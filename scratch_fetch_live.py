import urllib.request
import json
from datetime import datetime

url = "https://tffhdzctkfdmzamwqxal.supabase.co/rest/v1/conveyor_telemetry?order=id.desc&limit=10"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZmhkemN0a2ZkbXphbXdxeGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTM4MTEsImV4cCI6MjEwNDE4OTgxMX0.rDc7I_VHd4Egypi311fXVvsvrpRqbgbYinOV32irioo"
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=5) as resp:
        rows = json.loads(resp.read().decode())
        print(f"Total rows retrieved: {len(rows)}")
        for r in rows:
            ts = r.get("created_at", "")
            row_id = r.get("id")
            dev = r.get("device_id")
            temp = r.get("temperature")
            vib = r.get("vibration")
            cur = r.get("motor_current")
            load = r.get("load")
            d1 = r.get("distance1")
            d2 = r.get("distance2")
            th = r.get("belt_thickness")
            rpm1 = r.get("rpm1")
            rpm2 = r.get("rpm2")
            stat = r.get("status")
            print(f"Row #{row_id:4d} | {ts[11:19]} UTC | Dev: {dev:13s} | Temp: {temp:6.3f} °C | Vib: {vib:6.2f} | Current: {cur:6.3f} A | Load: {load:8.5f} kg | Dist: {d1},{d2} | Thick: {th} | Status: {stat}")
except Exception as e:
    print("Error querying Supabase:", e)
