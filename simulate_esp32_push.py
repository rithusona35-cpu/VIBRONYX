"""
==============================================================================
MineGuard AI — ESP32 Sensor Telemetry Cloud & Local Ingestion Simulator
SIH 26008: Intelligent Conveyor Belt Defect Detection & Safety System
==============================================================================
Simulates physical ESP32 edge device pushing 8-sensor telemetry with `device_id`
to both Supabase Cloud REST API and the local MineGuard backend (/api/hardware/ingest).
==============================================================================
"""

import time
import json
import random
import urllib.request
import urllib.error

# Configuration
DEVICE_ID = "ESP32-MINEGUARD-CONV-01"
CONVEYOR_ID = "C-01"
LOCAL_BACKEND_URL = "http://127.0.0.1:5000/api/hardware/ingest"

# Supabase Cloud REST API
SUPABASE_URL = "https://tffhdzctkfdmzamwqxal.supabase.co/rest/v1/conveyor_telemetry"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZmhkemN0a2ZkbXphbXdxeGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTM4MTEsImV4cCI6MjEwNDE4OTgxMX0.rDc7I_VHd4Egypi311fXVvsvrpRqbgbYinOV32irioo"


def generate_esp32_telemetry(state: str = "Optimal") -> dict:
    """Simulates real physical sensor readings from ESP32 pins."""
    if state == "Optimal":
        rpm = 1200.0 + random.uniform(-10.0, 10.0)
        speed_mps = round(rpm * 0.00314, 2)
        motor_curr = round(83.5 + random.uniform(-1.5, 1.5), 1)
        temp = round(42.1 + random.uniform(-0.4, 0.4), 1)
        bearing_temp = round(42.8 + random.uniform(-0.5, 0.5), 1)
        vib = round(2.25 + random.uniform(-0.15, 0.15), 2)
        sag = round(14.6 + random.uniform(-0.5, 0.5), 1)
        load = round(1840.0 + random.uniform(-20.0, 20.0), 1)
        aligned = True
        rip = False
        fail_prob = round(12.0 + random.uniform(0.0, 5.0), 1)
    elif state == "Warning":
        rpm = 1150.0 + random.uniform(-15.0, 15.0)
        speed_mps = round(rpm * 0.00314, 2)
        motor_curr = round(96.0 + random.uniform(-2.0, 2.0), 1)
        temp = round(49.2 + random.uniform(-0.8, 0.8), 1)
        bearing_temp = round(52.4 + random.uniform(-1.0, 1.0), 1)
        vib = round(4.85 + random.uniform(-0.3, 0.3), 2)
        sag = round(22.4 + random.uniform(-1.0, 1.0), 1)
        load = round(2150.0 + random.uniform(-30.0, 30.0), 1)
        aligned = True
        rip = False
        fail_prob = round(64.0 + random.uniform(0.0, 5.0), 1)
    else:  # Critical
        rpm = 0.0
        speed_mps = 0.0
        motor_curr = 142.0
        temp = 68.5
        bearing_temp = 74.0
        vib = 8.9
        sag = 42.0
        load = 2800.0
        aligned = False
        rip = True
        fail_prob = 98.5

    return {
        "device_id": DEVICE_ID,
        "conveyor_id": CONVEYOR_ID,
        "conveyor_status": state,
        "belt_speed": speed_mps,
        "belt_speed_rpm": round(rpm, 1),
        "avg_temperature": temp,
        "bearing_temp": bearing_temp,
        "vibration_velocity": vib,
        "motor_current": motor_curr,
        "belt_load_kg": load,
        "belt_sag_mm": sag,
        "belt_alignment_ok": aligned,
        "camera_rip_detected": rip,
        "failure_probability": fail_prob,
        "critical_zone": f"Joint J04 [{DEVICE_ID}]",
        "sensor_battery": 96.5,
        "system_latency": 14,
        "timestamp": time.time()
    }


def push_to_local_backend(payload: dict) -> bool:
    """Pushes telemetry to local MineGuard backend (/api/hardware/ingest)."""
    try:
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            LOCAL_BACKEND_URL,
            data=data_bytes,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            return resp.status == 200
    except Exception as e:
        print(f"  [!] Local Ingest Warning: {e}")
        return False


def push_to_supabase_cloud(payload: dict) -> bool:
    """Pushes telemetry directly to Supabase Cloud conveyor_telemetry table."""
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    # Attempt 1: Push with device_id
    try:
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(SUPABASE_URL, data=data_bytes, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            return resp.status in (200, 201)
    except urllib.error.HTTPError:
        # Attempt 2: Schema fallback without device_id column (device_id preserved in critical_zone)
        safe_copy = dict(payload)
        safe_copy.pop("device_id", None)
        safe_copy.pop("belt_speed_rpm", None)
        safe_copy.pop("timestamp", None)
        try:
            data_bytes = json.dumps(safe_copy).encode("utf-8")
            req = urllib.request.Request(SUPABASE_URL, data=data_bytes, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=4.0) as resp:
                return resp.status in (200, 201)
        except Exception as e2:
            print(f"  [!] Supabase Cloud Ingest Error: {e2}")
            return False
    except Exception as e:
        print(f"  [!] Supabase Cloud Connection Error: {e}")
        return False


if __name__ == "__main__":
    print("==================================================================")
    print("[*] MINEGUARD AI: ESP32 EDGE SENSOR PUSH SIMULATOR")
    print(f"   DEVICE ID:          {DEVICE_ID}")
    print(f"   CONVEYOR ID:        {CONVEYOR_ID}")
    print(f"   LOCAL BACKEND:      {LOCAL_BACKEND_URL}")
    print(f"   SUPABASE CLOUD:     {SUPABASE_URL}")
    print("==================================================================\n")

    for i in range(1, 4):
        state = "Optimal" if i < 3 else "Warning"
        telemetry = generate_esp32_telemetry(state)
        print(f"[{time.strftime('%H:%M:%S')}] Packet #{i} [State: {state}] Current: {telemetry['motor_current']}A | Speed: {telemetry['belt_speed']}m/s | Temp: {telemetry['bearing_temp']}C | Vib: {telemetry['vibration_velocity']}mm/s")

        ok_local = push_to_local_backend(telemetry)
        ok_cloud = push_to_supabase_cloud(telemetry)

        print(f"  -> Local Backend Sync: {'[OK]' if ok_local else '[FAILED]'}")
        print(f"  -> Supabase Cloud Sync: {'[OK]' if ok_cloud else '[FAILED]'}")
        time.sleep(1.5)

    print("\n[SUCCESS] ESP32 Edge Ingestion Simulation Completed Successfully!")
