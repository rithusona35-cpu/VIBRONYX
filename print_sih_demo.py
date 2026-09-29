import json

p = r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System\demo\sih_final_demo_manifest.json'
with open(p, 'r', encoding='utf-8') as f:
    d = json.load(f)

for k, v in d.items():
    if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict):
        print(f"List key: {k} with {len(v)} items")
        for item in v[:12]:
            print(" ", item.get('step') or item.get('step_id') or item.get('sequence_id'), item.get('name') or item.get('title'))
    elif not isinstance(v, (list, dict)):
        print(f"{k}: {v}")
