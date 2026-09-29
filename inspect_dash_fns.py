import os

p = r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System\dashboard.js'
with open(p, 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()

import re
funcs = re.findall(r'function\s+([a-zA-Z0-9_]+)', text)
print(f"Total dashboard.js length: {len(text)} chars, {len(text.splitlines())} lines")
print("Key functions in dashboard.js:")
for fn in funcs[:35]:
    print(" ", fn)
