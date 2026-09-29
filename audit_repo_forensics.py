import os
import re

search_terms = [
    "random", "np.random", "dummy", "mock", "fake",
    "simulation", "simulated", "hardcoded", "heuristic"
]

target_dirs = [
    r"c:\Users\AnbuRithu\Downloads\yolo_output",
    r"d:\SIH\anband told"
]

target_exts = [".py", ".js", ".html"]

findings = []

for base_dir in target_dirs:
    if not os.path.exists(base_dir):
        continue
    for root, dirs, files in os.walk(base_dir):
        # Exclude venv, .git, .gemini, runs, __pycache__
        dirs[:] = [d for d in dirs if d not in ['venv', '.git', '.gemini', '__pycache__', 'runs', 'node_modules', '.agents']]
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in target_exts:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                    for idx, line in enumerate(lines):
                        for term in search_terms:
                            if re.search(r'\b' + re.escape(term) + r'\b', line, re.IGNORECASE):
                                # Filter out legitimate test scripts or comments that mention the term
                                findings.append({
                                    "file": os.path.relpath(file_path, base_dir),
                                    "full_path": file_path,
                                    "line_num": idx + 1,
                                    "term": term,
                                    "line_content": line.strip()
                                })
                except Exception as e:
                    pass

print(f"Total occurrences found: {len(findings)}")
for f in findings[:40]:
    print(f"[{f['file']}:{f['line_num']}] ({f['term']}) -> {f['line_content'][:90]}")
