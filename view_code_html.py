import os, sys
sys.stdout.reconfigure(encoding='utf-8')

p = r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System\code.html'
with open(p, 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

def show_range(start, end):
    print(f"=== Lines {start} to {end} ===")
    for i in range(start - 1, min(end, len(lines))):
        print(f"{i+1}: {lines[i]}", end='')

show_range(1, 100)
