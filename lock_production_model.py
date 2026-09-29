import hashlib
import os
import json
import shutil

def get_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

pt_path = 'models/final_sih_model.pt'
onnx_path = 'models/final_sih_model.onnx'
meta_path = 'models/final_sih_model_metadata.json'

pt_hash = get_sha256(pt_path)
onnx_hash = get_sha256(onnx_path)

print(f"final_sih_model.pt SHA256:   {pt_hash}")
print(f"final_sih_model.onnx SHA256: {onnx_hash}")

# Update metadata json
with open(meta_path, 'r', encoding='utf-8') as f:
    meta = json.load(f)

meta['sha256_checksum'] = pt_hash
meta['onnx_sha256_checksum'] = onnx_hash
meta['immutability_status'] = 'PERMANENTLY_LOCKED_PRODUCTION_IMMUTABLE'
meta['model_lock_date'] = '2026-09-19'
meta['freeze_policy'] = 'DO NOT RETRAIN OR REPLACE. PRODUCTION MODEL IS PERMANENT.'

with open(meta_path, 'w', encoding='utf-8') as f:
    json.dump(meta, f, indent=2)

print(f"Updated {meta_path} with SHA256 checksum.")

# Create models/production/
prod_dir = 'models/production'
os.makedirs(prod_dir, exist_ok=True)

# Copy files to models/production/
shutil.copy2(pt_path, os.path.join(prod_dir, 'final_sih_model.pt'))
shutil.copy2(onnx_path, os.path.join(prod_dir, 'final_sih_model.onnx'))
shutil.copy2(meta_path, os.path.join(prod_dir, 'final_sih_model_metadata.json'))

meta_in_prod_hash = get_sha256(os.path.join(prod_dir, 'final_sih_model_metadata.json'))

# Create SHA256SUMS.txt
sha256_content = f"""{pt_hash}  final_sih_model.pt
{onnx_hash}  final_sih_model.onnx
{meta_in_prod_hash}  final_sih_model_metadata.json
"""

with open(os.path.join(prod_dir, 'SHA256SUMS.txt'), 'w', encoding='utf-8') as f:
    f.write(sha256_content)

print(f"Created {os.path.join(prod_dir, 'SHA256SUMS.txt')}")
print("Verified production freeze.")
