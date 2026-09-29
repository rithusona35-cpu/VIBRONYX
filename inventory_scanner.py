import os
import glob
import hashlib
import datetime
import torch
import csv

def get_md5(p):
    h = hashlib.md5()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1024*1024), b''):
            h.update(chunk)
    return h.hexdigest()

patterns = [
    '**/*.pt', '**/*.onnx', '**/*.engine', '**/*.pth', '**/*.weights',
]

search_dirs = ['.', 'd:/SIH']

all_files = []
for d in search_dirs:
    if os.path.exists(d):
        for pat in patterns:
            found = glob.glob(os.path.join(d, pat), recursive=True)
            for f in found:
                if 'venv' not in f and 'site-packages' not in f:
                    all_files.append(os.path.normpath(f))

all_files = sorted(list(set(all_files)))
print(f"Total model files found: {len(all_files)}")

models_info = []
for p in all_files:
    size = os.path.getsize(p)
    md5 = get_md5(p)
    mtime = datetime.datetime.fromtimestamp(os.path.getmtime(p)).strftime('%Y-%m-%d %H:%M:%S')
    ctime = datetime.datetime.fromtimestamp(os.path.getctime(p)).strftime('%Y-%m-%d %H:%M:%S')
    
    epoch = 'N/A'
    model_arch = 'Unknown'
    imgsz = 'Unknown'
    data = 'Unknown'
    names = {}
    class_count = 0
    
    if p.endswith('.pt'):
        try:
            ckpt = torch.load(p, map_location='cpu', weights_only=False)
            epoch = ckpt.get('epoch', -1)
            train_args = ckpt.get('train_args', {}) or {}
            model_arch = train_args.get('model', 'yolo11s.pt')
            imgsz = train_args.get('imgsz', 640)
            data = train_args.get('data', 'Unknown')
            names = ckpt.get('names', {})
            if not names and 'model' in ckpt and hasattr(ckpt['model'], 'names'):
                names = ckpt['model'].names
            class_count = len(names) if names else 0
        except Exception as e:
            model_arch = f"LoadError: {e}"
            
    models_info.append({
        'model_name': os.path.basename(p),
        'model_path': p,
        'architecture': model_arch,
        'file_size': f"{size / (1024*1024):.2f} MB",
        'training_epoch': epoch,
        'class_count': class_count,
        'class_names': str(names),
        'image_size': imgsz,
        'source_dataset': data,
        'date_created': mtime,
        'md5': md5
    })

# Print summary
unique_md5 = {}
for m in sorted(models_info, key=lambda x: x['date_created']):
    md5 = m['md5']
    if md5 not in unique_md5:
        unique_md5[md5] = m['model_path']
        tag = "[UNIQUE]"
    else:
        tag = f"[DUPE of {os.path.basename(unique_md5[md5])}]"
    print(f"{tag:30} | {m['date_created']} | {m['file_size']:8} | MD5:{md5[:8]} | Epoch:{m['training_epoch']} | Sz:{m['image_size']} | {m['model_path']}")

# Write to MODEL_INVENTORY.csv
csv_fields = [
    'model_name', 'model_path', 'architecture', 'file_size', 
    'training_epoch', 'class_count', 'class_names', 'image_size', 
    'source_dataset', 'date_created'
]

with open('MODEL_INVENTORY.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=csv_fields)
    writer.writeheader()
    for m in models_info:
        row = {k: m[k] for k in csv_fields}
        writer.writerow(row)

print("Saved MODEL_INVENTORY.csv successfully.")
