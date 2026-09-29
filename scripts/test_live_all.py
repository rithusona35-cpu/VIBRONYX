import requests

base_5000 = 'http://127.0.0.1:5000'
base_4173 = 'http://localhost:4173'

# 1. Vite Preview check
r_preview = requests.get(base_4173)
print('Vite Preview (4173):', r_preview.status_code, 'Length:', len(r_preview.text))

r_json = requests.get(f'{base_4173}/model_validation_results.json')
print('Public validation json (4173):', r_json.status_code, 'Models in comparison:', len(r_json.json().get('model_comparison', [])))

# 2. Test each sample through /api/detect
samples = ['longitudinal_tear.jpg', 'normal_belt.jpg', 'belt_splice.jpg', 'deep_scratch.jpg', 'slight_scratch.jpg']
print('\n=== LIVE INFERENCE THROUGH /api/detect ===')
for s in samples:
    path = f'static/samples/{s}'
    with open(path, 'rb') as f:
        r = requests.post(f'{base_5000}/api/detect', files={'file': f})
    j = r.json()
    ov = j.get('overall', {})
    dets = j.get('detections', [])
    print(f"{s:<22} -> Status: {j.get('status')} | Dets: {len(dets)} | Overall: {ov.get('dashboard_class')} | Conf: {ov.get('confidence')} | Boxes Key present: {'boxes' in j}")

# 3. Test cross_check
r_cross = requests.post(f'{base_5000}/api/models/cross_check', json={'sample_filename': 'longitudinal_tear.jpg'})
print('\n=== LIVE CROSS CHECK (longitudinal_tear.jpg) ===')
cj = r_cross.json()
print('Status:', cj.get('agreement_status'), '| Models tested:', cj.get('models_tested'), '| Majority:', cj.get('majority_class'))
for m in cj.get('results', []):
    print(f"  * {m['model_name']}: {m['prediction']} ({m['confidence']*100:.1f}%) | {m['latency_ms']}ms")
