import requests
import json

base_url = "http://127.0.0.1:5000"

print("--- 1. Testing Known Defect Image (Splice/Tear) ---")
res_defect = requests.post(f"{base_url}/api/detect", data={"sample_filename": "frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg"})
data_defect = res_defect.json()
print("Status Code:", res_defect.status_code)
print("status:", data_defect.get("status"))
print("health_state:", data_defect.get("health_state"))
print("highest_severity:", data_defect.get("highest_severity"))
print("total_detections:", data_defect.get("total_detections"))
print("model_latency_ms:", data_defect.get("model_latency_ms"))
print("latency_ms:", data_defect.get("latency_ms"))
for d in data_defect.get("detections", []):
    print(f"  -> {d['class_name']}: conf={d['confidence']}, severity={d['severity']}")

print("\n--- 2. Testing Zero-Detection / Clean Image (frame_00064) ---")
res_clean = requests.post(f"{base_url}/api/detect", data={"sample_filename": "frame_00064_jpg.rf.388be8135d2ae5802f530028dd44d209.jpg"})
data_clean = res_clean.json()
print("Status Code:", res_clean.status_code)
print("status:", data_clean.get("status"))
print("health_state:", data_clean.get("health_state"))
print("highest_severity:", data_clean.get("highest_severity"))
print("total_detections:", data_clean.get("total_detections"))
print("model_latency_ms:", data_clean.get("model_latency_ms"))
print("latency_ms:", data_clean.get("latency_ms"))

print("\n--- 3. Testing Uploaded Clean Texture ---")
with open("hard_negatives/hard_neg_normal_texture_1.jpg", "rb") as f:
    res_upload = requests.post(f"{base_url}/api/detect", files={"file": ("test_upload.jpg", f, "image/jpeg")})
data_upload = res_upload.json()
print("Upload status:", data_upload.get("status"))
print("Upload health_state:", data_upload.get("health_state"))
print("Upload highest_severity:", data_upload.get("highest_severity"))
print("Upload total_detections:", data_upload.get("total_detections"))

assert data_defect.get("health_state") == "DEFECT_DETECTED", "Expected DEFECT_DETECTED for defect image"
assert data_upload.get("health_state") == "NO_DETECTIONS", "Expected NO_DETECTIONS for zero-box image"
assert data_upload.get("highest_severity") == "NO_DETECTIONS", "Zero-box image must NEVER be labeled HEALTHY"
print("\n🎉 ALL ASSERTIONS PASSED! Pipeline health state segregation verified.")
