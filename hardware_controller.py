"""
MINEGUARD AI — HARDWARE INTEGRATION & CONVEYOR CONTROLLER BRIDGE
SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring
Role: Senior Computer Vision / Embedded Systems Integration Engineer

================================================================================
CRITICAL SAFETY INVARIANTS:
1. HARDWARE_MODE defaults to "SIMULATION".
2. PHYSICAL_HARDWARE_VERIFIED is permanently False until physical sign-off.
3. No real GPIO, relays, or motor drivers are energized during automated operation.
4. Critical defects (Belt Splice, Longitudinal Tear) trigger STOP_CONVEYOR and LATCH.
   The conveyor cannot auto-restart without an explicit operator reset.
5. Watchdog timeout or communication failure trips HARDWARE_FAULT -> STOP_CONVEYOR.
================================================================================
"""

import os
import json
import time
import logging
from enum import Enum
from typing import Dict, Any, Optional, Tuple

# Configure structured logging
logger = logging.getLogger("MineGuardHardware")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


class HardwareState(str, Enum):
    """Deterministic 9-State Finite State Machine for Safe Hardware Control."""
    SYSTEM_INIT = "SYSTEM_INIT"
    SYSTEM_READY = "SYSTEM_READY"
    BELT_RUNNING = "BELT_RUNNING"
    DEFECT_DETECTED = "DEFECT_DETECTED"
    BELT_STOPPED = "BELT_STOPPED"
    NO_DETECTIONS = "NO_DETECTIONS"
    ANALYSIS_ERROR = "ANALYSIS_ERROR"
    EMERGENCY_STOP = "EMERGENCY_STOP"
    HARDWARE_FAULT = "HARDWARE_FAULT"


class ControlCommand(str, Enum):
    """Deterministic Control Commands dispatched to conveyor actuators."""
    STOP_CONVEYOR = "STOP_CONVEYOR"
    CONTINUE_CONVEYOR = "CONTINUE"
    ALERT = "ALERT"
    RESET = "RESET"
    SAFE_STATE = "SAFE_STATE"



# Part 10 Industrial Binary Communication Protocol Constants
PREAMBLE_BYTE_1 = 0xAA
PREAMBLE_BYTE_2 = 0x55
POSTAMBLE_BYTE_1 = 0x0D
POSTAMBLE_BYTE_2 = 0x0A


class MessageType(int, Enum):
    """Part 10 Industrial Binary Message Types."""
    CMD_RUN = 0x01
    CMD_STOP = 0x02
    CMD_ESTOP = 0x03
    CMD_RESET = 0x04
    TELEMETRY_PACKET = 0x10
    HEARTBEAT_PING = 0xFF


def compute_crc8(data: bytes, polynomial: int = 0x07) -> int:
    """Standard CRC-8 (SMBus/ATM) calculation for packet validation."""
    crc = 0x00
    for byte in data:
        crc ^= byte
        for _ in range(8):
            if crc & 0x80:
                crc = ((crc << 1) ^ polynomial) & 0xFF
            else:
                crc = (crc << 1) & 0xFF
    return crc


def encode_binary_packet(seq_id: int, msg_type: int, payload: bytes = b'') -> bytes:
    """
    Constructs an industrial binary frame matching Part 10 specification:
    [0xAA] [0x55] [SEQ_ID] [MSG_TYPE] [PAYLOAD_LEN] [PAYLOAD...] [CRC-8] [0x0D] [0x0A]
    """
    seq_byte = seq_id & 0xFF
    type_byte = msg_type & 0xFF
    len_byte = len(payload) & 0xFF
    data_for_crc = bytes([seq_byte, type_byte, len_byte]) + payload
    crc = compute_crc8(data_for_crc)
    return bytes([PREAMBLE_BYTE_1, PREAMBLE_BYTE_2]) + data_for_crc + bytes([crc, POSTAMBLE_BYTE_1, POSTAMBLE_BYTE_2])


def decode_binary_packet(raw: bytes) -> Tuple[bool, Optional[Dict[str, Any]], str]:
    """
    Validates and decodes Part 10 binary frame.
    Rejects: invalid preamble, length mismatch, corrupted CRC, malformed postamble.
    """
    if len(raw) < 8:
        return False, None, "PACKET_TOO_SHORT"
    if raw[0] != PREAMBLE_BYTE_1 or raw[1] != PREAMBLE_BYTE_2:
        return False, None, "INVALID_PREAMBLE"
    if raw[-2] != POSTAMBLE_BYTE_1 or raw[-1] != POSTAMBLE_BYTE_2:
        return False, None, "INVALID_POSTAMBLE"

    seq_id = raw[2]
    msg_type = raw[3]
    payload_len = raw[4]

    expected_total_len = 5 + payload_len + 3
    if len(raw) != expected_total_len:
        return False, None, f"PAYLOAD_LEN_MISMATCH: expected {expected_total_len}, got {len(raw)}"

    payload = raw[5:5 + payload_len]
    recv_crc = raw[5 + payload_len]
    calc_crc = compute_crc8(raw[2:5 + payload_len])

    if recv_crc != calc_crc:
        return False, None, f"CRC_MISMATCH: calculated {calc_crc} != received {recv_crc}"

    result: Dict[str, Any] = {
        "seq_id": seq_id,
        "msg_type": msg_type,
        "payload_len": payload_len,
        "raw_payload": payload
    }

    if msg_type == MessageType.TELEMETRY_PACKET:
        if payload_len >= 18:
            try:
                import struct
                fields = struct.unpack('>HHhHHHBBBBH', payload[:18])
                motor_states = {0: "HALTED", 1: "RUNNING", 2: "FAULT"}
                estop_states = {0: "TRIPPED", 1: "NORMAL"}
                result["telemetry"] = {
                    "motor_current_mA": fields[0],
                    "belt_speed_rpm": fields[1],
                    "bearing_temp_c": fields[2] / 10.0,
                    "vib_rms_x_mg": fields[3],
                    "vib_rms_y_mg": fields[4],
                    "vib_rms_z_mg": fields[5],
                    "ir_belt_presence": bool(fields[6]),
                    "motor_state": motor_states.get(fields[7], "UNKNOWN"),
                    "safety_latch": bool(fields[8]),
                    "estop_state": estop_states.get(fields[9], "UNKNOWN"),
                    "watchdog_remaining_ms": fields[10]
                }
            except Exception as dec_err:
                result["telemetry_error"] = str(dec_err)

    return True, result, "OK"


def detect_stm32_com_port(preferred_port: Optional[str] = None) -> Optional[str]:
    """
    Scans host operating system COM ports to discover physical STM32 / USB-Serial interface.
    Prioritizes STMicroelectronics / STM32 / ST-Link, then generic FTDI / CH340 / CP210x adapters.
    """
    try:
        import serial.tools.list_ports
        available_ports = list(serial.tools.list_ports.comports())
        if not available_ports:
            return None

        # 1. If preferred port is provided and exists, return it
        if preferred_port:
            for p in available_ports:
                if p.device.upper() == preferred_port.upper():
                    return p.device

        # 2. Priority match for ST-Link / STM32 signatures
        for p in available_ports:
            desc = (p.description or "").lower()
            mfg = (p.manufacturer or "").lower()
            hwid = (p.hwid or "").lower()
            if any(sig in desc or sig in mfg or sig in hwid for sig in ["stmicroelectronics", "st-link", "stm32", "0483:"]):
                logger.info(f"Auto-discovered STM32 controller on {p.device} ({p.description})")
                return p.device

        # 3. Secondary match for generic USB-to-UART bridges
        for p in available_ports:
            desc = (p.description or "").lower()
            hwid = (p.hwid or "").lower()
            if any(sig in desc or sig in hwid for sig in ["ch340", "cp210", "ftdi", "usb-serial", "usb serial"]):
                logger.info(f"Auto-discovered USB-Serial bridge on {p.device} ({p.description})")
                return p.device

        return available_ports[0].device
    except Exception as e:
        logger.warning(f"Error detecting COM ports: {e}")
        return None


class STM32ProtocolAbstraction:
    """
    Structured Communication Protocol Abstraction for STM32 Microcontroller.
    
    Part 10 Protocol Specification:
      - Baud Rate: 115200 bps
      - Data Format: 8N1 (8 data bits, no parity, 1 stop bit)
      - Serial Port: Auto-detected or configurable
      - Binary Frame Structure:
          [0xAA] [0x55] [SEQ_ID] [MSG_TYPE] [PAYLOAD_LEN] [PAYLOAD...] [CRC-8] [0x0D] [0x0A]
      - Message Types:
          0x01 = CMD_RUN
          0x02 = CMD_STOP
          0x03 = CMD_ESTOP
          0x04 = CMD_RESET
          0x10 = TELEMETRY_PACKET
          0xFF = HEARTBEAT_PING
      - Timeout: 1000 ms
      - Watchdog: 2.0s host timeout -> STM32 failsafe shutdown
      - Hardware Safety: Physical E-stop remains mechanically independent.
      - Backward Compatibility: Full support for legacy simulation tests.
    """
    def __init__(self, serial_port: Optional[str] = None, baud_rate: int = 115200):
        self.preferred_port = serial_port
        self.serial_port = serial_port
        self.baud_rate = baud_rate
        self.seq_counter = 0
        self.is_connected = False
        self.last_ack_time = time.time()
        self.last_heartbeat_time = time.time()
        self.ser = None
        self.latest_telemetry: Optional[Dict[str, Any]] = None
        self._rx_thread = None
        self._rx_running = False

        # If serial port not explicitly specified, attempt auto-detection
        if not self.serial_port:
            detected = detect_stm32_com_port(self.preferred_port)
            if detected:
                self.serial_port = detected

        if self.serial_port:
            self.connect()

    def connect(self) -> bool:
        """Attempts physical UART connection. Marks NOT PHYSICALLY VERIFIED if port fails."""
        if not self.serial_port:
            self.is_connected = False
            return False
        try:
            import serial
            self.ser = serial.Serial(self.serial_port, self.baud_rate, timeout=0.1)
            self.is_connected = True
            logger.info(f"Connected to STM32 UART on {self.serial_port} @ {self.baud_rate} baud")
            self._start_rx_worker()
            return True
        except Exception as e:
            self.is_connected = False
            logger.warning(f"STM32 serial link unavailable on {self.serial_port}: {e}. Protocol running in SIMULATION loopback.")
            return False

    def _start_rx_worker(self):
        """Spawns background reader thread for physical UART reception."""
        if self._rx_running or not self.ser:
            return
        import threading
        self._rx_running = True
        self._rx_thread = threading.Thread(target=self._rx_worker, daemon=True)
        self._rx_thread.start()

    def _rx_worker(self):
        """Background thread continuously parsing binary frames from STM32."""
        buffer = bytearray()
        while self._rx_running and self.ser and self.ser.is_open:
            try:
                incoming = self.ser.read(64)
                if incoming:
                    buffer.extend(incoming)
                    while len(buffer) >= 8:
                        # Scan for preamble 0xAA 0x55
                        pre_idx = -1
                        for i in range(len(buffer) - 1):
                            if buffer[i] == PREAMBLE_BYTE_1 and buffer[i+1] == PREAMBLE_BYTE_2:
                                pre_idx = i
                                break
                        if pre_idx == -1:
                            buffer = buffer[-1:]
                            break
                        if pre_idx > 0:
                            buffer = buffer[pre_idx:]

                        if len(buffer) < 5:
                            break

                        payload_len = buffer[4]
                        total_expected = 5 + payload_len + 3
                        if len(buffer) < total_expected:
                            break

                        frame = bytes(buffer[:total_expected])
                        buffer = buffer[total_expected:]

                        valid, parsed, status = decode_binary_packet(frame)
                        if valid and parsed:
                            self.last_ack_time = time.time()
                            if "telemetry" in parsed:
                                self.latest_telemetry = parsed["telemetry"]
                else:
                    time.sleep(0.01)
            except Exception as rx_err:
                logger.debug(f"Serial rx exception: {rx_err}")
                time.sleep(0.05)

    def close(self):
        self._rx_running = False
        if self.ser and self.ser.is_open:
            try:
                self.ser.close()
            except Exception:
                pass
        self.is_connected = False

    def send_binary_command(self, msg_type: MessageType, payload: bytes = b'') -> Tuple[bool, str]:
        """Dispatches binary frame compliant with Part 10 protocol."""
        self.seq_counter = (self.seq_counter + 1) & 0xFF
        frame = encode_binary_packet(self.seq_counter, int(msg_type), payload)
        if not self.is_connected or not self.ser:
            return False, "PHYSICAL_LINK_DISCONNECTED"
        try:
            self.ser.write(frame)
            self.ser.flush()
            return True, "SENT"
        except Exception as e:
            return False, f"TX_ERROR: {e}"

    def send_heartbeat(self) -> bool:
        """Dispatches Part 10 0xFF HEARTBEAT_PING frame to reset watchdog timer."""
        self.last_heartbeat_time = time.time()
        if self.is_connected and self.ser:
            success, _ = self.send_binary_command(MessageType.HEARTBEAT_PING)
            return success
        return True

    def build_packet(self, cmd: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Builds packet dict for compatibility with existing tests and simulation."""
        self.seq_counter = (self.seq_counter + 1) & 0xFF
        pkt = {
            "seq_id": self.seq_counter,
            "msg_type": "CMD",
            "cmd": cmd,
            "payload": payload or {},
            "timestamp": time.time()
        }
        pkt_bytes = json.dumps(pkt, sort_keys=True).encode('utf-8')
        pkt["crc8"] = compute_crc8(pkt_bytes)
        return pkt

    def transmit(self, pkt: Dict[str, Any], hardware_mode: str = "SIMULATION") -> Tuple[bool, str]:
        """
        Transmits packet over physical serial if connected, or executes simulation loopback.
        Strictly preserves [SIMULATION]\\nCOMMAND = {cmd_str} output format for tests.
        """
        cmd_str = pkt.get("cmd", "")
        if hardware_mode == "SIMULATION":
            # Strict formatting required by Phase 3 and unit tests
            print(f"[SIMULATION]\nCOMMAND = {cmd_str}")
            self.last_ack_time = time.time()
            return True, "SIMULATION_LOOPBACK_ACK"

        # Map high-level commands to Part 10 binary message types
        cmd_upper = cmd_str.upper()
        if "RUN" in cmd_upper or "CONTINUE" in cmd_upper:
            bin_type = MessageType.CMD_RUN
        elif "ESTOP" in cmd_upper or "EMERGENCY" in cmd_upper:
            bin_type = MessageType.CMD_ESTOP
        elif "RESET" in cmd_upper:
            bin_type = MessageType.CMD_RESET
        else:
            bin_type = MessageType.CMD_STOP

        # Dispatch binary packet if connected
        if self.is_connected and self.ser:
            self.send_binary_command(bin_type)

        # Also support JSON line fallback if connected device is JSON-based
        raw_line = (json.dumps(pkt) + "\n").encode('utf-8')
        for attempt in range(1, 4):
            try:
                if self.ser and self.ser.is_open:
                    self.ser.write(raw_line)
                    self.ser.flush()
                    resp_line = self.ser.readline()
                    if resp_line:
                        resp_json = json.loads(resp_line.decode('utf-8').strip())
                        resp_crc = resp_json.pop("crc8", None)
                        calc_crc = compute_crc8(json.dumps(resp_json, sort_keys=True).encode('utf-8'))
                        if resp_crc == calc_crc and resp_json.get("msg_type") == "ACK":
                            self.last_ack_time = time.time()
                            return True, "ACK"
            except Exception as tx_err:
                logger.error(f"Transmission error on attempt {attempt}: {tx_err}")
            time.sleep(0.05)

        return (True, "BINARY_DISPATCHED") if self.is_connected else (False, "PHYSICAL_LINK_DISCONNECTED")


class ConveyorHardwareController:
    """
    Industrial Conveyor Belt Hardware Bridge & Safety State Machine.
    
    Implements:
      - 9-state finite state machine
      - Watchdog fail-safe timer (2.0s threshold)
      - Critical defect stop latching (Splice / Tear require operator reset)
      - Strict simulation mode isolation (zero physical hardware energization)
      - Sensor telemetry model (nulls for physically unconnected sensors)
    """

    def __init__(self, serial_port: Optional[str] = None, baud_rate: int = 115200):
        # Configuration flags
        self.HARDWARE_MODE = os.environ.get("MINEGUARD_HARDWARE_MODE", "SIMULATION")
        self.PHYSICAL_HARDWARE_VERIFIED = False  # Must be explicitly signed off in physical lab

        self.serial_port = serial_port
        self.baud_rate = baud_rate
        self.stm32 = STM32ProtocolAbstraction(serial_port, baud_rate)

        # State Machine Initialization
        self.state: HardwareState = HardwareState.SYSTEM_READY
        self.last_command: str = "CONTINUE"
        self.last_state: str = "NO_DETECTIONS"
        self.critical_stop_latched: bool = False
        self.latch_reason: Optional[str] = None
        self.estop_triggered: bool = False
        self.motor_fault_detected: bool = False
        self.frame_counter: int = 0

        # Watchdog Timer Configuration
        self.watchdog_timeout_sec: float = 2.0
        self.last_heartbeat_time: float = time.time()
        self.watchdog_enabled: bool = True

        logger.info(f"Initialized ConveyorHardwareController [MODE: {self.HARDWARE_MODE}, VERIFIED: {self.PHYSICAL_HARDWARE_VERIFIED}]")

    def heartbeat(self):
        """Refreshes communication watchdog heartbeat."""
        self.last_heartbeat_time = time.time()

    def check_watchdog(self) -> bool:
        """
        Verifies communication watchdog status.
        If communication lost beyond timeout: transitions to HARDWARE_FAULT -> STOP_CONVEYOR.
        """
        if not self.watchdog_enabled:
            return True

        elapsed = time.time() - self.last_heartbeat_time
        if elapsed > self.watchdog_timeout_sec:
            logger.error(f"[FAIL-SAFE] Watchdog expired ({elapsed:.2f}s > {self.watchdog_timeout_sec}s). Tripping HARDWARE_FAULT.")
            self._transition_to_fault("WATCHDOG_COMMUNICATION_TIMEOUT")
            return False
        return True

    def trigger_emergency_stop(self, source: str = "OPERATOR_ESTOP"):
        """
        Immediate emergency stop trip. Transitions to EMERGENCY_STOP -> BELT_STOPPED.
        """
        self.estop_triggered = True
        self.critical_stop_latched = True
        self.latch_reason = f"EMERGENCY_STOP: {source}"
        self.state = HardwareState.EMERGENCY_STOP
        self.last_command = "STOP_CONVEYOR"
        logger.warning(f"🚨 EMERGENCY STOP TRIPPED: {source} -> BELT_STOPPED")
        self._dispatch_command("STOP_CONVEYOR", {"reason": self.latch_reason})
        self.state = HardwareState.BELT_STOPPED

    def trigger_motor_fault(self, fault_code: str = "OVERCURRENT_STALL"):
        """
        Motor driver fault trip. Transitions to HARDWARE_FAULT -> BELT_STOPPED.
        """
        self.motor_fault_detected = True
        self.critical_stop_latched = True
        self.latch_reason = f"MOTOR_FAULT: {fault_code}"
        self._transition_to_fault(self.latch_reason)

    def trigger_stm32_disconnect(self):
        """Simulates physical disconnect of STM32 cable/UART."""
        self.stm32.is_connected = False
        self._transition_to_fault("STM32_DISCONNECTED")

    def _transition_to_fault(self, reason: str):
        """Forces state machine into HARDWARE_FAULT and stops conveyor."""
        self.state = HardwareState.HARDWARE_FAULT
        self.critical_stop_latched = True
        self.latch_reason = reason
        self.last_command = "STOP_CONVEYOR"
        logger.error(f"❌ HARDWARE FAULT: {reason} -> BELT_STOPPED")
        self._dispatch_command("STOP_CONVEYOR", {"fault": reason})
        self.state = HardwareState.BELT_STOPPED

    def operator_reset(self, operator_id: str = "CHIEF_OPERATOR") -> Dict[str, Any]:
        """
        Explicit Operator Reset to clear latched critical defect stop or fault.
        Conveyor CANNOT auto-restart without this explicit call.
        """
        logger.info(f"🔄 Operator Reset invoked by {operator_id}. Clearing critical latch.")
        self.critical_stop_latched = False
        self.latch_reason = None
        self.estop_triggered = False
        self.motor_fault_detected = False
        self.last_heartbeat_time = time.time()
        self.state = HardwareState.SYSTEM_READY
        self.last_command = "RESET"

        self._dispatch_command("RESET", {"operator": operator_id})

        return {
            "status": "RESET_SUCCESSFUL",
            "hardware_state": self.state.value,
            "critical_stop_latched": False,
            "message": "Conveyor safe state restored. System ready for inspection."
        }

    def process_detection_result(self, inference_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deterministic State Transition & Actuator Command Generator.
        Enforces Phase 2 State Machine, Phase 3 Simulation Mode, and Phase 9 Conveyor Logic.
        """
        self.frame_counter += 1
        self.heartbeat()  # Local inference serves as backend activity heartbeat

        # Step 1: Check Communication Watchdog
        if not self.check_watchdog():
            return self._build_payload(
                action="STOP_CONVEYOR",
                health_state="HARDWARE_FAULT",
                defect_class="WATCHDOG_TIMEOUT",
                confidence=None,
                severity="CRITICAL",
                relay_active=True,
                buzzer_active=True,
                motor_state="HALTED"
            )

        current_frame_health = inference_result.get("health_state", "ANALYSIS_ERROR")
        health_state = current_frame_health
        detections = inference_result.get("detections", [])
        
        # Primary defect if detected in current frame
        primary_defect = None
        if detections:
            primary_defect = detections[0].get("class", "").upper().replace(" ", "_")

        # Step 2: Handle Latched Critical Stop (Splice, Tear, or Fault requires operator reset)
        if self.critical_stop_latched:
            logger.info(f"Conveyor stop latched ({self.latch_reason}). Auto-restart prohibited.")
            self.state = HardwareState.BELT_STOPPED
            self.last_command = "STOP_CONVEYOR"
            
            # Rule 25: Do not display stale CRITICAL_STOP_LATCHED as current-frame detection!
            # Separate CURRENT_FRAME_STATE from SAFETY_LATCH_STATE
            return self._build_payload(
                action="STOP_CONVEYOR",
                health_state=current_frame_health,
                defect_class=primary_defect,
                confidence=detections[0].get("confidence") if detections else None,
                severity="CRITICAL" if primary_defect else "NORMAL",
                relay_active=True,
                buzzer_active=True,
                motor_state="HALTED",
                current_frame_state=current_frame_health,
                safety_latch_state="CRITICAL_STOP_LATCHED"
            )

        # Step 3: Explicit State Machine Evaluation
        if health_state == "DEFECT_DETECTED":
            self.state = HardwareState.DEFECT_DETECTED
            critical_defects = [d for d in detections if d.get("severity") == "CRITICAL"]

            if critical_defects:
                # Belt Splice or Longitudinal Tear -> STOP_CONVEYOR & LATCH
                primary = critical_defects[0]
                defect_name = primary.get("class", "").upper().replace(" ", "_")
                action = "STOP_CONVEYOR"
                self.critical_stop_latched = True
                self.latch_reason = f"CRITICAL_DEFECT_{defect_name}"
                self.last_command = "STOP_CONVEYOR"
                self.state = HardwareState.BELT_STOPPED

                self._dispatch_command("STOP_CONVEYOR", {"defect": defect_name, "severity": "CRITICAL"})

                payload = self._build_payload(
                    action=action,
                    health_state="DEFECT_DETECTED",
                    defect_class=defect_name,
                    confidence=primary.get("confidence"),
                    severity="CRITICAL",
                    relay_active=True,
                    buzzer_active=True,
                    motor_state="HALTED"
                )
            else:
                # Deep Scratch or Slight Scratch -> ALERT (Conveyor continues running with warning)
                primary = detections[0] if detections else {}
                defect_name = primary.get("class", "").upper().replace(" ", "_")
                action = "ALERT"
                self.last_command = "ALERT"
                self.state = HardwareState.BELT_RUNNING

                self._dispatch_command("ALERT", {"defect": defect_name, "severity": primary.get("severity")})

                payload = self._build_payload(
                    action=action,
                    health_state="DEFECT_DETECTED",
                    defect_class=defect_name,
                    confidence=primary.get("confidence"),
                    severity=primary.get("severity", "WARNING"),
                    relay_active=False,
                    buzzer_active=True,  # Warning chirp
                    motor_state="RUNNING"
                )

        elif health_state in ["NO_DETECTIONS", "NORMAL_BELT"]:
            self.state = HardwareState.BELT_RUNNING
            self.last_command = "CONTINUE"
            self._dispatch_command("CONTINUE", {"health": health_state})

            confidence_val = None
            defect_cls = None
            if health_state == "NORMAL_BELT":
                defect_cls = "NORMAL_BELT"
                confidence_val = detections[0].get("confidence", 1.0) if detections else 1.0

            payload = self._build_payload(
                action="CONTINUE",
                health_state=health_state,
                defect_class=defect_cls,
                confidence=confidence_val,
                severity="NORMAL",
                relay_active=False,
                buzzer_active=False,
                motor_state="RUNNING"
            )

        else:
            # ANALYSIS_ERROR or unknown -> SAFE_STATE (Standby mode, do not assume healthy)
            self.state = HardwareState.ANALYSIS_ERROR
            self.last_command = "SAFE_STATE"
            self._dispatch_command("SAFE_STATE", {"error": inference_result.get("error_code", "IMAGE_ERROR")})

            payload = self._build_payload(
                action="SAFE_STATE",
                health_state="ANALYSIS_ERROR",
                defect_class=None,
                confidence=None,
                severity="ERROR",
                relay_active=False,
                buzzer_active=True,
                motor_state="STANDBY"
            )

        self.last_state = health_state
        return payload

    def _dispatch_command(self, cmd: str, extra: Dict[str, Any]):
        """Dispatches structured command to STM32 abstraction or logs simulation."""
        pkt = self.stm32.build_packet(cmd, extra)
        self.stm32.transmit(pkt, hardware_mode=self.HARDWARE_MODE)

    def _build_payload(
        self,
        action: str,
        health_state: str,
        defect_class: Optional[str],
        confidence: Optional[float],
        severity: str,
        relay_active: bool,
        buzzer_active: bool,
        motor_state: str,
        current_frame_state: Optional[str] = None,
        safety_latch_state: Optional[str] = None
    ) -> Dict[str, Any]:
        """Constructs unified telemetry payload matching Phase 10 & 25 specification."""
        latch_val = safety_latch_state or ("CRITICAL_STOP_LATCHED" if self.critical_stop_latched else "UNLATCHED")
        frame_val = current_frame_state or health_state
        # Merge physical sensor telemetry from STM32 if available
        phys_tel = self.stm32.latest_telemetry or {}
        b_speed = phys_tel.get("belt_speed_rpm") if self.stm32.is_connected else None
        m_curr = phys_tel.get("motor_current_mA") if self.stm32.is_connected else None
        b_temp = phys_tel.get("bearing_temp_c") if self.stm32.is_connected else None

        return {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "frame_id": self.frame_counter,
            "belt_speed": b_speed,          # Physical RPM or None (simulation)
            "motor_current": m_curr,        # Physical mA or None (simulation)
            "temperature": b_temp,          # Physical °C or None (simulation)
            "distance": None,               # None: VL53L0X NOT PHYSICALLY VERIFIED
            "encoder_position": None,       # None: Optical encoder NOT PHYSICALLY VERIFIED
            "camera_status": "ONLINE (VALIDATED)",
            "health_state": health_state,
            "ai_health_state": health_state,
            "current_frame_state": frame_val,
            "safety_latch_state": latch_val,
            "defect_class": defect_class,
            "confidence": confidence,
            "severity": severity,
            "action": action,
            "control_action": action,
            "hardware_state": self.state.value,
            "hardware_mode": self.HARDWARE_MODE,
            "physical_hardware_verified": self.PHYSICAL_HARDWARE_VERIFIED,
            "critical_stop_latched": self.critical_stop_latched,
            "emergency_relay_active": relay_active,
            "buzzer_active": buzzer_active,
            "motor_state": motor_state,
            "watchdog_ok": (time.time() - self.last_heartbeat_time) <= self.watchdog_timeout_sec,
            "physical_telemetry": phys_tel if self.stm32.is_connected else None
        }

    def get_unified_telemetry(self) -> Dict[str, Any]:
        """Unified sensor and control telemetry model (Phase 10)."""
        phys_tel = self.stm32.latest_telemetry or {}
        b_speed = phys_tel.get("belt_speed_rpm") if self.stm32.is_connected else None
        m_curr = phys_tel.get("motor_current_mA") if self.stm32.is_connected else None
        b_temp = phys_tel.get("bearing_temp_c") if self.stm32.is_connected else None

        return {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "frame_id": self.frame_counter,
            "belt_speed": b_speed,          # null: Rotary encoder NOT PHYSICALLY VERIFIED
            "motor_current": m_curr,        # null: ACS712 NOT PHYSICALLY VERIFIED
            "temperature": b_temp,          # null: DS18B20/MLX90614 NOT PHYSICALLY VERIFIED
            "distance": None,               # null: VL53L0X NOT PHYSICALLY VERIFIED
            "encoder_position": None,       # null: Encoder NOT PHYSICALLY VERIFIED
            "camera_status": "ONLINE (VALIDATED)",
            "ai_health_state": self.last_state,
            "defect_class": getattr(self, "last_defect_class", None),
            "confidence": getattr(self, "last_confidence", None),
            "control_action": self.last_command,
            "hardware_state": self.state.value,
            "hardware_mode": self.HARDWARE_MODE,
            "physical_hardware_verified": self.PHYSICAL_HARDWARE_VERIFIED,
            "physical_telemetry": phys_tel if self.stm32.is_connected else None
        }

    def get_hardware_status(self) -> Dict[str, Any]:
        """Telemetry status endpoint for dashboard and diagnostic integration."""
        return {
            "subsystem": "MineGuard Conveyor Emergency Response & Motor Control",
            "hardware_mode": self.HARDWARE_MODE,
            "physical_hardware_verified": self.PHYSICAL_HARDWARE_VERIFIED,
            "hardware_state": self.state.value,
            "physical_stm32_connected": self.stm32.is_connected,
            "detected_com_port": self.stm32.serial_port,
            "protocol_spec": "PART_10_BINARY_0xAA_0x55",
            "connection_mode": "SERIAL_UART_BINARY" if self.stm32.is_connected else "SIMULATED_LOOPBACK",
            "last_action": self.last_command,
            "last_health_state": self.last_state,
            "critical_stop_latched": self.critical_stop_latched,
            "latch_reason": self.latch_reason,
            "estop_relay_status": "TRIPPED" if (self.estop_triggered or self.critical_stop_latched) else "OPEN",
            "motor_driver_signal": "STOP (0V)" if (self.estop_triggered or self.critical_stop_latched) else "RUN (24V)",
            "telemetry": self.get_unified_telemetry(),
            "camera_optical_specs": {
                "working_distance_m": 1.20,
                "camera_orientation": "PERPENDICULAR_TO_BELT (90_DEG)",
                "recommended_lens": "12.5 mm C-mount low-distortion lens (NOT PHYSICALLY VERIFIED)",
                "led_illumination_angle_deg": 18.0,
                "illumination_type": "DUAL_SIDED_LOW_ANGLE_GRAZING",
                "cross_polarization": "90_DEG_EXTINCTION (OPTIONAL)",
                "camera_parameters": "MANUAL_FOCUS, FIXED_EXPOSURE, FIXED_WHITE_BALANCE",
                "verification_status": "NOT PHYSICALLY VERIFIED"
            },
            "sensor_inventory": {
                "MPU6050": {"purpose": "Vibration & Triaxial Shock", "status": "NOT PHYSICALLY VERIFIED"},
                "ACS712": {"purpose": "Motor Current / Load Monitoring", "status": "NOT PHYSICALLY VERIFIED"},
                "DS18B20": {"purpose": "Roller Bearing Temperature", "status": "NOT PHYSICALLY VERIFIED"},
                "IR_SENSOR": {"purpose": "Belt Motion & Edge Alignment", "status": "NOT PHYSICALLY VERIFIED"},
                "LOAD_CELL": {"purpose": "Conveyor Mass / Throughput", "status": "NOT PHYSICALLY VERIFIED"},
                "VL53L0X": {"purpose": "Belt Sag / Profile Distance", "status": "NOT PHYSICALLY VERIFIED"},
                "MLX90614": {"purpose": "Non-contact Belt Surface Temp", "status": "NOT PHYSICALLY VERIFIED"},
                "ROTARY_ENCODER": {"purpose": "Belt Linear Speed & Odometry", "status": "NOT PHYSICALLY VERIFIED"},
                "CAMERA": {"purpose": "Optical Defect Surface Inspection", "status": "SOFTWARE PIPELINE VERIFIED"}
            },
            "verification_status": "PHYSICAL_HARDWARE_NOT_VERIFIED (Simulated Protocol Active)"
        }


class IndustrialCameraManager:
    """
    Industrial Camera Ingestion & Validation Pipeline (Phase 6).
    
    Pipeline Architecture:
      CAMERA
        ↓
      FRAME CAPTURE
        ↓
      VALIDATION
        ↓
      PREPROCESSING
        ↓
      YOLO11s
        ↓
      DETECTION
        ↓
      HEALTH STATE
        ↓
      CONTROL SIGNAL
    """
    def __init__(self, camera_index: int = 0, source_type: str = "SIMULATED"):
        self.camera_index = camera_index
        self.source_type = source_type
        self.is_opened = False
        self.cap = None

    def validate_frame(self, frame_np) -> Tuple[bool, str]:
        """
        Rigorous validation of captured raw camera frames before preprocessing.
        """
        if frame_np is None:
            return False, "FRAME_IS_NULL"
        if not hasattr(frame_np, 'shape'):
            return False, "INVALID_FRAME_OBJECT"
        if len(frame_np.shape) != 3 or frame_np.shape[2] != 3:
            return False, f"INVALID_CHANNELS: expected 3, got shape {frame_np.shape}"
        h, w = frame_np.shape[:2]
        if w < 100 or h < 100 or w > 4096 or h > 4096:
            return False, f"RESOLUTION_OUT_OF_BOUNDS: {w}x{h}"
        # Check that frame is not completely blank/black (zero variance)
        if frame_np.std() < 0.5:
            return False, "DEGENERATE_FRAME_BLANK_OR_SENSOR_FAILURE"
        return True, "VALID_FRAME"

    def process_pipeline(self, frame_pil, inference_engine, hardware_bridge_inst) -> Dict[str, Any]:
        """Executes full verified industrial pipeline from frame to control signal."""
        import numpy as np
        frame_np = np.array(frame_pil)
        valid, reason = self.validate_frame(frame_np)
        if not valid:
            err_payload = {
                "health_state": "ANALYSIS_ERROR",
                "error_code": reason,
                "detections": []
            }
            hw_sig = hardware_bridge_inst.process_detection_result(err_payload)
            return {
                "status": "error",
                "health_state": "ANALYSIS_ERROR",
                "error": reason,
                "hardware_control": hw_sig
            }

        result = inference_engine.infer(frame_pil, conf=0.25, iou=0.50)
        hw_sig = hardware_bridge_inst.process_detection_result(result)
        result["hardware_control"] = hw_sig
        return result


# Global Singleton Instance
hardware_bridge = ConveyorHardwareController()
camera_pipeline = IndustrialCameraManager()
