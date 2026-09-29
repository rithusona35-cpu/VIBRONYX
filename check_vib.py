import urllib.request
import json

url = "https://tffhdzctkfdmzamwqxal.supabase.co/rest/v1/conveyor_telemetry?select=id,vibration,status,created_at&order=id.desc&limit=200"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZmhkemN0a2ZkbXphbXdxeGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTM4MTEsImV4cCI6MjEwNDE4OTgxMX0.rDc7I_VHd4Egypi311fXVvsvrpRqbgbYinOV32irioo"
headers = {"apikey": key, "Authorization": f"Bearer {key}"}

req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    rows = json.loads(resp.read().decode())
    vib_vals = [r.get("vibration") for r in rows if r.get("vibration") is not None]
    print("Vibration range in last 200 rows:", min(vib_vals), "to", max(vib_vals))
    print("Unique vibration values (sample):", set(vib_vals)[:10] if len(set(vib_vals)) > 10 else set(vib_vals))
