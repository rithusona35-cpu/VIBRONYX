import os

p = r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System\app.py'
with open(p, 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

print(f"Total lines in app.py: {len(lines)}")
for i, l in enumerate(lines):
    if l.strip().startswith('@app.route') or l.strip().startswith('def '):
        print(f"{i+1}: {l.strip()}")
