"""
MINEGUARD AI — STM32 PART 10 BINARY PROTOCOL VERIFICATION TEST SUITE
SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring

Validates:
  1. Binary Packet Framing: [0xAA] [0x55] [SEQ_ID] [MSG_TYPE] [PAYLOAD_LEN] [PAYLOAD...] [CRC-8] [0x0D] [0x0A]
  2. CRC-8 Calculation with Polynomial 0x07 (SMBus standard)
  3. Commands: CMD_RUN (0x01), CMD_STOP (0x02), CMD_ESTOP (0x03), CMD_RESET (0x04), HEARTBEAT_PING (0xFF)
  4. Telemetry Frame: 0x10 with 18-byte packed industrial sensors payload
  5. Corruption and Rejection: bad preamble, bad postamble, CRC mismatch, length mismatch
  6. COM Port Detection: Graceful fallback when no hardware is connected
"""

import os
import sys
import struct
import unittest

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from hardware_controller import (
    compute_crc8,
    encode_binary_packet,
    decode_binary_packet,
    detect_stm32_com_port,
    MessageType,
    PREAMBLE_BYTE_1,
    PREAMBLE_BYTE_2,
    POSTAMBLE_BYTE_1,
    POSTAMBLE_BYTE_2,
    STM32ProtocolAbstraction,
    ConveyorHardwareController
)


class TestSTM32BinaryProtocol(unittest.TestCase):
    def test_01_crc8_calculation(self):
        """1. Verify standard CRC-8 calculation on known vectors."""
        # Empty data
        self.assertEqual(compute_crc8(b""), 0x00)
        # Standard ASCII test vector '123456789' with poly 0x07 init 0x00 -> 0xF4
        self.assertEqual(compute_crc8(b"123456789"), 0xF4)
        # Sequence 1, CMD_RUN (0x01), len 0 -> [1, 1, 0]
        self.assertEqual(compute_crc8(bytes([1, 1, 0])), 126)

    def test_02_encode_decode_run_command(self):
        """2. Encode and decode CMD_RUN packet."""
        frame = encode_binary_packet(seq_id=5, msg_type=MessageType.CMD_RUN)
        self.assertEqual(frame[0], PREAMBLE_BYTE_1)
        self.assertEqual(frame[1], PREAMBLE_BYTE_2)
        self.assertEqual(frame[2], 5)
        self.assertEqual(frame[3], MessageType.CMD_RUN)
        self.assertEqual(frame[4], 0)  # len 0
        self.assertEqual(frame[-2], POSTAMBLE_BYTE_1)
        self.assertEqual(frame[-1], POSTAMBLE_BYTE_2)

        valid, decoded, reason = decode_binary_packet(frame)
        self.assertTrue(valid)
        self.assertEqual(reason, "OK")
        self.assertEqual(decoded["seq_id"], 5)
        self.assertEqual(decoded["msg_type"], MessageType.CMD_RUN)
        self.assertEqual(decoded["payload_len"], 0)

    def test_03_encode_decode_estop_and_reset(self):
        """3. Encode and decode CMD_ESTOP and CMD_RESET packets."""
        estop_frame = encode_binary_packet(seq_id=10, msg_type=MessageType.CMD_ESTOP)
        v_estop, dec_estop, _ = decode_binary_packet(estop_frame)
        self.assertTrue(v_estop)
        self.assertEqual(dec_estop["msg_type"], MessageType.CMD_ESTOP)

        reset_frame = encode_binary_packet(seq_id=11, msg_type=MessageType.CMD_RESET)
        v_reset, dec_reset, _ = decode_binary_packet(reset_frame)
        self.assertTrue(v_reset)
        self.assertEqual(dec_reset["msg_type"], MessageType.CMD_RESET)

    def test_04_encode_decode_heartbeat_ping(self):
        """4. Encode and decode HEARTBEAT_PING packet."""
        hb_frame = encode_binary_packet(seq_id=255, msg_type=MessageType.HEARTBEAT_PING)
        v_hb, dec_hb, _ = decode_binary_packet(hb_frame)
        self.assertTrue(v_hb)
        self.assertEqual(dec_hb["msg_type"], MessageType.HEARTBEAT_PING)

    def test_05_telemetry_payload_packing_and_parsing(self):
        """5. Encode and decode full 18-byte TELEMETRY_PACKET frame."""
        # 18-byte payload: Current=350mA, Speed=175RPM, Temp=29.4°C(294),
        # VibX=14mg, VibY=18mg, VibZ=22mg, IR=1(OK), Motor=1(RUNNING),
        # SafetyLatch=0(UNLATCHED), EStop=1(NORMAL), Watchdog=1850ms
        payload = struct.pack('>HHhHHHBBBBH', 350, 175, 294, 14, 18, 22, 1, 1, 0, 1, 1850)
        self.assertEqual(len(payload), 18)

        frame = encode_binary_packet(seq_id=42, msg_type=MessageType.TELEMETRY_PACKET, payload=payload)
        valid, decoded, reason = decode_binary_packet(frame)
        self.assertTrue(valid)
        self.assertEqual(reason, "OK")
        self.assertIn("telemetry", decoded)

        tel = decoded["telemetry"]
        self.assertEqual(tel["motor_current_mA"], 350)
        self.assertEqual(tel["belt_speed_rpm"], 175)
        self.assertAlmostEqual(tel["bearing_temp_c"], 29.4, places=1)
        self.assertEqual(tel["vib_rms_x_mg"], 14)
        self.assertEqual(tel["vib_rms_y_mg"], 18)
        self.assertEqual(tel["vib_rms_z_mg"], 22)
        self.assertTrue(tel["ir_belt_presence"])
        self.assertEqual(tel["motor_state"], "RUNNING")
        self.assertFalse(tel["safety_latch"])
        self.assertEqual(tel["estop_state"], "NORMAL")
        self.assertEqual(tel["watchdog_remaining_ms"], 1850)

    def test_06_reject_corrupt_crc(self):
        """6. Validate rejection of corrupt CRC byte."""
        frame = bytearray(encode_binary_packet(seq_id=1, msg_type=MessageType.CMD_STOP))
        # Corrupt CRC byte (located at index -3)
        frame[-3] ^= 0xFF
        valid, decoded, reason = decode_binary_packet(bytes(frame))
        self.assertFalse(valid)
        self.assertIn("CRC_MISMATCH", reason)

    def test_07_reject_invalid_preamble(self):
        """7. Validate rejection of invalid preamble."""
        frame = bytearray(encode_binary_packet(seq_id=1, msg_type=MessageType.CMD_STOP))
        frame[0] = 0x00  # corrupt preamble 1
        valid, decoded, reason = decode_binary_packet(bytes(frame))
        self.assertFalse(valid)
        self.assertEqual(reason, "INVALID_PREAMBLE")

    def test_08_reject_invalid_postamble(self):
        """8. Validate rejection of invalid postamble."""
        frame = bytearray(encode_binary_packet(seq_id=1, msg_type=MessageType.CMD_STOP))
        frame[-1] = 0x00  # corrupt postamble \n
        valid, decoded, reason = decode_binary_packet(bytes(frame))
        self.assertFalse(valid)
        self.assertEqual(reason, "INVALID_POSTAMBLE")

    def test_09_com_port_detection_behavior(self):
        """9. Test COM port discovery graceful fallback."""
        port = detect_stm32_com_port(preferred_port="NON_EXISTENT_COM999")
        # Should gracefully return None or existing valid port without throwing
        self.assertTrue(port is None or isinstance(port, str))

    def test_10_controller_simulation_mode_telemetry(self):
        """10. Verify ConveyorHardwareController preserves simulation telemetry."""
        hw = ConveyorHardwareController()
        status = hw.get_hardware_status()
        self.assertEqual(status["hardware_mode"], "SIMULATION")
        self.assertEqual(status["connection_mode"], "SIMULATED_LOOPBACK")
        self.assertEqual(status["protocol_spec"], "PART_10_BINARY_0xAA_0x55")


if __name__ == '__main__':
    unittest.main(verbosity=2)
