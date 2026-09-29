import os
import shutil
import subprocess

BASE = r"c:\Users\AnbuRithu\Downloads\yolo_output"
STAGING_MAIN = os.path.join(BASE, "git_staging_main")

if os.path.exists(STAGING_MAIN):
    shutil.rmtree(STAGING_MAIN)

os.makedirs(STAGING_MAIN, exist_ok=True)

# Exact directories to ignore from git
IGNORE_DIRS = {
    'node_modules', 'venv', '.venv', 'env', 'ENV', 'dist', 'dist-ssr', 
    'git_staging_frontend', 'git_staging_backend', 'git_staging_main',
    '__pycache__', '.pytest_cache', 'backup', 'runs', 'experiments',
    '.git', '.vscode', '.idea',
    'datasets', 'MineGuard-AI-FINAL', 'MineGuard-AI-Production', 
    'MineGuard-AI-GitHub-Package', 'MineGuard-AI-Lite-Package',
    '13 belt_output', 'belt_output', 'belt_defect_yolo11m', 'belt_defect_yolo11s',
    'run_v3_balanced', 'real_world_controlled_v1', 'real_world_validation_v2',
    'real_world_test', 'detect', 'visual_validation_sheets', 'visualizations',
    'candidate_B_false_negative_gallery', 'candidate_B_false_positive_gallery'
}

IGNORE_EXTENSIONS = {
    '.zip', '.tar', '.gz', '.tgz', '.rar', '.7z',
    '.pyc', '.pyo', '.pyd', '.tmp', '.bak'
}

IGNORE_FILES = {
    '.env', '.env.local', 'Thumbs.db', 'Desktop.ini', 'ehthumbs.db',
    'best.pt'  # 19MB redundant root duplicate
}

print(f"[*] Copying clean repository files to {STAGING_MAIN}...")

total_copied_files = 0
total_copied_bytes = 0

for root, dirs, files in os.walk(BASE):
    dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith('git_staging')]
    
    rel_path = os.path.relpath(root, BASE)
    if rel_path == '.':
        dest_dir = STAGING_MAIN
    else:
        dest_dir = os.path.join(STAGING_MAIN, rel_path)
    
    os.makedirs(dest_dir, exist_ok=True)
    
    for f in files:
        if f in IGNORE_FILES:
            continue
        ext = os.path.splitext(f)[1].lower()
        if ext in IGNORE_EXTENSIONS:
            continue
        # Avoid uploading test uploads
        if rel_path.startswith('uploads') and f != '.gitkeep':
            continue
        # Avoid duplicate model checkpoints in models/best or models/production
        if rel_path.replace('\\', '/') in ('models/best', 'models/production') and f.endswith('.pt'):
            continue
            
        src_file = os.path.join(root, f)
        dest_file = os.path.join(dest_dir, f)
        shutil.copy2(src_file, dest_file)
        total_copied_files += 1
        total_copied_bytes += os.path.getsize(src_file)

# Ensure .gitkeep in uploads
uploads_dir = os.path.join(STAGING_MAIN, 'uploads')
os.makedirs(uploads_dir, exist_ok=True)
with open(os.path.join(uploads_dir, '.gitkeep'), 'w') as f:
    pass

print(f"[+] Total files staged: {total_copied_files}")
print(f"[+] Total staged size: {total_copied_bytes / (1024 * 1024):.2f} MB")
