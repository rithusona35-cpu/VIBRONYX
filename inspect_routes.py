import re, os

def get_routes(filepath):
    routes = []
    if not os.path.exists(filepath):
        return [("NOT FOUND", filepath)]
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    for m in re.finditer(r'@app\.route\(["\']([^"\']+)["\'](?:,\s*methods=\[([^\]]+)\])?\)', content):
        routes.append((m.group(1), m.group(2) or 'GET'))
    return routes

print('=== ROUTES IN ullas website/MineGuard_AI_Conveyor_System/app.py ===')
for r in get_routes(r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System\app.py'):
    print(f'  {r[1]:<25} {r[0]}')

print('\n=== ROUTES IN yolo_output/app_backend_server.py ===')
for r in get_routes('app_backend_server.py'):
    print(f'  {r[1]:<25} {r[0]}')
