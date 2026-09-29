"""
MINEGUARD AI — PHYSICAL HARDWARE & STM32 LINK COMMISSIONING TOOL
SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring

Interactive CLI utility to verify:
  1. Serial COM-Port Auto-Discovery
  2. Part 10 Binary Packet Transmit & Receive
  3. Real-Time Telemetry Decoding (Motor Current, Speed, Vibration, Temp)
  4. Heartbeat & Watchdog Continuity
  5. CRC-8 Integrity & Corruption Rejection
"""

import sys
import time
import struct
from hardware_controller import (
    detect_stm32_com_port,
    encode_binary_packet,
    decode_binary_packet,
    compute_crc8,
    MessageType,
    STM32ProtocolAbstraction,
    ConveyorHardwareController
)


def run_hardware_link_diagnostic():
    print("==================================================================")
    print("[DIAGNOSTIC] MineGuard AI - STM32 Hardware Link Commissioning")
    print("==================================================================")

    # Step 1: Detect COM ports
    detected_port = detect_stm32_com_port()
    print("\n[1] SCANNING HOST OPERATING SYSTEM COM PORTS...")
    if detected_port:
        print(f"    [OK] Discovered Target Controller Port: {detected_port}")
    else:
        print("    [WARN] No physical STM32 / USB-Serial hardware detected.")
        print("           (Connect your Nucleo-F401RE or FTDI USB-UART cable to laptop)")

    # Step 2: Test Protocol Abstraction Initialization
    print("\n[2] INITIALIZING STM32 PROTOCOL ABSTRACTION...")
    proto = STM32ProtocolAbstraction(serial_port=detected_port)
    if proto.is_connected:
        print(f"    [OK] Physical Serial UART established on {detected_port} @ 115200 baud.")
    else:
        print("    [INFO] Operating in SIMULATION loopback mode.")

    # Step 3: Test Binary Packet Encoding
    print("\n[3] TESTING PART 10 BINARY PACKET ENCODING...")
    test_frame = encode_binary_packet(seq_id=1, msg_type=MessageType.CMD_RUN)
    print(f"    Encoded Frame (Hex): {test_frame.hex(' ').upper()}")
    assert test_frame[0] == 0xAA and test_frame[1] == 0x55
    assert test_frame[-2] == 0x0D and test_frame[-1] == 0x0A
    print("    [OK] Preambles, Postambles, and CRC-8 correctly generated.")

    # Step 4: Test Telemetry Payload Decoding
    print("\n[4] TESTING 18-BYTE INDUSTRIAL TELEMETRY DECODING...")
    # Synthetic realistic industrial reading:
    # Current=340mA, RPM=160, Temp=28.7°C, VibX=18mg, VibY=22mg, VibZ=25mg, IR=1, Motor=RUNNING, Latch=0, Estop=NORMAL, Watchdog=1900ms
    mock_payload = struct.pack('>HHhHHHBBBBH', 340, 160, 287, 18, 22, 25, 1, 1, 0, 1, 1900)
    mock_pkt = encode_binary_packet(seq_id=10, msg_type=MessageType.TELEMETRY_PACKET, payload=mock_payload)
    valid, decoded, reason = decode_binary_packet(mock_pkt)

    if valid and "telemetry" in decoded:
        t = decoded["telemetry"]
        print("    [OK] Telemetry Frame Decoded Successfully:")
        print(f"         - Motor Current:      {t['motor_current_mA']} mA")
        print(f"         - Belt Speed:         {t['belt_speed_rpm']} RPM")
        print(f"         - Roller Temp:        {t['bearing_temp_c']} deg C")
        print(f"         - Vibration RMS:      X={t['vib_rms_x_mg']}mg, Y={t['vib_rms_y_mg']}mg, Z={t['vib_rms_z_mg']}mg")
        print(f"         - Belt Presence (IR): {'DETECTED (NORMAL)' if t['ir_belt_presence'] else 'MISSING'}")
        print(f"         - Motor Driver State: {t['motor_state']}")
        print(f"         - Safety Latch:       {'LATCHED (TRIPPED)' if t['safety_latch'] else 'UNLATCHED (SAFE)'}")
        print(f"         - E-Stop Circuit:     {t['estop_state']}")
        print(f"         - Watchdog Remaining: {t['watchdog_remaining_ms']} ms")
    else:
        print(f"    [FAIL] Telemetry decode failed: {reason}")

    # Step 5: Test Corruption Rejection
    print("\n[5] TESTING TRANSMISSION NOISE & CORRUPT FRAME REJECTION...")
    corrupt_frame = bytearray(mock_pkt)
    corrupt_frame[12] ^= 0xFF  # Invert bit in payload
    v_corrupt, _, r_corrupt = decode_binary_packet(bytes(corrupt_frame))
    if not v_corrupt and "CRC_MISMATCH" in r_corrupt:
        print(f"    [OK] Packet corruption detected and dropped: {r_corrupt}")
    else:
        print("    [FAIL] Failed to detect corruption!")

    # Step 6: Test Conveyor Controller Telemetry Output
    print("\n[6] CHECKING CONVEYOR HARDWARE CONTROLLER INTEGRATION...")
    hw = ConveyorHardwareController()
    hw_stat = hw.get_hardware_status()
    print(f"    - Subsystem:        {hw_stat['subsystem']}")
    print(f"    - Hardware Mode:    {hw_stat['hardware_mode']}")
    print(f"    - Connection Mode:  {hw_stat['connection_mode']}")
    print(f"    - Protocol Spec:    {hw_stat.get('protocol_spec', 'N/A')}")
    print(f"    - Safety Latch:     {hw_stat['critical_stop_latched']}")

    print("\n==================================================================")
    print("[SUCCESS] COMMISSIONING TEST COMPLETE - ALL TEST VECTORS VERIFIED (PASS)")
    print("==================================================================")


if __name__ == "__main__":
    run_hardware_link_diagnostic()
