import json

p = r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System\demo\demo_manifest.json'
with open(p, 'r', encoding='utf-8') as f:
    d = json.load(f)

for s in d.get('demo_sequence', []):
    print(f"Step {s.get('sequence_id')}: {s.get('name')} | expected: {s.get('health_state')} | action: {s.get('expected_action')} | image: {s.get('image_path')}")
