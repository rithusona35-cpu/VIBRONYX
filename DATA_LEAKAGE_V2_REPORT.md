# DATA_LEAKAGE_V2_REPORT.md
## Elimination of Cross-Split Video Sequence Leakage

### 1. The Video Sequence Leakage Problem
In the original dataset split, Roboflow partitioned individual images at random. Because conveyor belt video recording captures continuous sequences (e.g. `frame_00000`, `frame_00001`, `frame_00002`), augmented frames from the **exact same video recording appeared in both Train and Test**.

### 2. The Solution: Group-Based Video Sequence Splitting
We cataloged all **544 unique video sequences** across the 1,556 images.  
We partitioned by **entire video sequence units**, ensuring:
* **ZERO video frames** from any sequence in Train appear in Validation or Test.
* **ZERO perceptual dHash overlap** between sets.

### 3. Leakage-Free Dataset Partitioning
* **Directory**: `d:/SIH/anband told/leakage_free_dataset`
* **Train Set**: 1159 images (409 distinct video sequences)
* **Validation Set**: 239 images (81 distinct video sequences)
* **Test Set**: 158 images (54 distinct video sequences)

### 4. Integrity Assertion
```text
Sequence Overlap (Train ∩ Valid) : ZERO
Sequence Overlap (Train ∩ Test)  : ZERO
Sequence Overlap (Valid ∩ Test)  : ZERO
Status                           : 100% LEAK-FREE SCIENTIFIC BENCHMARK
```
