import os, sys
sys.stdout.reconfigure(encoding='utf-8')

p = r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System\code.html'
with open(p, 'r', encoding='utf-8', errors='replace') as f:
    html = f.read()

keywords = [
    'camera', 'live', 'sensor', 'status', 'motor', 'chart', 'log',
    'defect', 'safety', 'demo', 'maintenance', 'operator', 'reset'
]
print("Keywords present in code.html:")
for k in keywords:
    count = html.lower().count(k)
    print(f"  '{k}': {count} occurrences")
