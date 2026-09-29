import os, re

target = r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System'
with open(os.path.join(target, 'code.html'), 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

print(f'Total code.html lines: {len(lines)}')
for i, l in enumerate(lines):
    # look for headings, sections, ids
    m = re.search(r'<(section|div|header|main|aside|nav)[^>]*id=["\']([^"\']+)["\']', l)
    if m:
        print(f'{i+1}: {m.group(1)} id="{m.group(2)}"')
    elif '<h1' in l or '<h2' in l or '<h3' in l:
        print(f'{i+1}: {l.strip()[:80]}')
