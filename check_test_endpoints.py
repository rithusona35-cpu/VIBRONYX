import re

with open(r'C:\Users\AnbuRithu\Downloads\yolo_output\tests\test_final_integration.py', 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()

calls = re.findall(r'client\.(?:get|post)\(["\']([^"\']+)["\']', text)
print("Endpoints called in test_final_integration:")
for c in set(calls):
    print(" ", c)
