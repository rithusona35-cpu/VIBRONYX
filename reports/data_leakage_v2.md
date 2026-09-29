# Data Leakage Forensic Analysis V2 — MineGuard AI
**SIH Problem Statement:** SIH 26008  

---

## 1. Sequence Prefix Grouping Findings

* **Total Images Audited:** 1556
* **Distinct Physical Video Capture Sequences:** 544
* **Original Flaw:** In the original Roboflow random frame split, multiple augmented frames of sequence `frame_00002` were present in Train while raw `frame_00002` was placed in Test.
* **Leakage-Free Solution in Dataset V2:**
  - Sequences partitioned strictly as atomic units.
  - **Train Sequences:** 414 (1175 images)
  - **Val Sequences:** 65 (191 images)
  - **Test Sequences:** 65 (190 images)
  - **Cross-Split Overlap:** **0 sequences, 0 frames (100% Leakage-Free)**.
