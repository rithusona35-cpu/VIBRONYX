# CLASS_MAPPING_AUDIT.md
## Verification of 5-Class Industrial Defect Taxonomy

### 1. Absolute Class ID Mapping
| Class ID | Ultralytics model.names | data.yaml specification | Backend (unified_preprocessor.py) | Frontend Display Name | Severity |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **0** | `belt splice` | `belt splice` | `belt splice` | Belt Splice | **CRITICAL** |
| **1** | `deep scratch` | `deep scratch` | `deep scratch` | Deep Scratch | **WARNING** |
| **2** | `longitudinal tear` | `longitudinal tear` | `longitudinal tear` | Longitudinal Tear | **CRITICAL** |
| **3** | `normal belt` | `normal belt` | `normal belt` | Normal Belt | **HEALTHY** |
| **4** | `slight scratch` | `slight scratch` | `slight scratch` | Slight Scratch | **INFO** |

### 2. Parity Check
* **Model Checkpoint vs data.yaml**: 100% IDENTICAL
* **Backend Preprocessor vs Model**: 100% IDENTICAL
* **Frontend UI Canvas vs Backend**: 100% IDENTICAL
* **Status**: **PASS (ZERO CLASS ID DRIFT DETECTED)**
