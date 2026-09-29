import os, re

target = r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System'
for fname in ['dashboard.js', 'hardware_integration.js', 'code.html', 'config.js']:
    fpath = os.path.join(target, fname)
    if not os.path.exists(fpath):
        continue
    content = open(fpath, 'r', encoding='utf-8', errors='replace').read()
    fetches = re.findall(r'fetch\([`\'"]([^`\'"]+)[`\'"]', content)
    ajax = re.findall(r'[\'"](/api/[^\'"]+)[\'"]', content)
    supabase_calls = re.findall(r'supabase\.[a-zA-Z0-9_\.]+\([^\)]*\)', content)
    print(f'=== {fname} ===')
    print('  fetch URLs:', set(fetches))
    print('  /api/ URLs:', set(ajax))
    print('  supabase calls sample (first 5):', list(set(supabase_calls))[:5])
