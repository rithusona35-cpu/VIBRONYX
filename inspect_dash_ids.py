import os, re

p = r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System\dashboard.js'
with open(p, 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()

ids = re.findall(r'document\.getElementById\(["\']([^"\']+)["\']\)', text)
print(f"Total unique IDs accessed by dashboard.js: {len(set(ids))}")
for i in sorted(set(ids)):
    print(" ", i)
