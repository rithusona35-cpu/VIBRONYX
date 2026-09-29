import os, sys
sys.stdout.reconfigure(encoding='utf-8')

p = r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System\code.html'
with open(p, 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for i in range(len(lines) - 80, len(lines)):
    print(f"{i+1}: {lines[i]}", end='')
