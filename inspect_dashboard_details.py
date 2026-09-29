import os, sys

target = r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System'

with open(os.path.join(target, 'dashboard.js'), 'r', encoding='utf-8', errors='replace') as f:
    dash_lines = f.readlines()

print(f'Total dashboard.js lines: {len(dash_lines)}')
# Print functions in dashboard.js
for i, l in enumerate(dash_lines):
    if l.strip().startswith('function ') or ' = function' in l or 'async function' in l:
        print(f'{i+1}: {l.strip()[:80]}')
