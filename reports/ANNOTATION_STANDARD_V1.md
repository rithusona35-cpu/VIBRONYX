# MineGuard AI — Annotation Standard Specification (V1)
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**
*Document Version: 1.0 (Strict Defect-Centric Bounding Box Standard)*

---

## 1. Core Mandate & Golden Rule
> **"A bounding box must tightly and strictly enclose ONLY the visible morphological defect. It must NEVER encapsulate healthy conveyor background rubber or span multi-part continuous defects into a single oversized enclosure."**

---

## 2. Strict Class-by-Class Annotation Rules

### Class 0: Belt Splice
- **Enclosure Policy**: Box must tightly bound the splice joint interface, including the vulcanized overlap boundary, finger splices, or mechanical fasteners.
- **Transverse Margin**: Maximum $10\text{ px}$ margin beyond the outermost fastener or seam edge.
- **Healthy Rubber Exclusion**: Do NOT extend the box longitudinally into undamaged belt sections preceding or following the joint.

### Class 1: Deep Scratch
- **Enclosure Policy**: Box tightly bounds the continuous groove where vulcanized rubber has been physically carved or gouged ($>2\text{ mm}$ width).
- **Multi-Groove Rule**: Parallel scratches separated by more than $20\text{ px}$ of undamaged rubber must be annotated as **independent, separate bounding boxes**.
- **No Background Inclusion**: The box aspect ratio must reflect the scratch contour. Do not box adjacent undamaged rubber.

### Class 2: Longitudinal Tear
- **Enclosure Policy**: Box tightly encloses the through-thickness rubber fissure or carcass rupture.
- **Tile Partitioning Standard**: If a continuous tear extends longer than $250\text{ px}$, annotate it as **contiguous, overlapping segment tiles ($200\text{ px}$ length, $25\text{ px}$ overlap)**. Never draw a single massive box across the entire image diagonal.
- **Margin**: Maximum $5\text{ px}$ padding on each lateral edge of the fissure.

### Class 3: Normal Belt (Background Policy)
- **Zero-Box Standard**: In pure object detection, clean healthy rubber is the negative background. Annotators must **NOT** place arbitrary bounding boxes on unmarred conveyor rubber.
- **Dedicated Negative Images**: Clean frames must contain **zero annotations** in their `.txt` label files, establishing true negative training anchors.

### Class 4: Slight Scratch
- **Enclosure Policy**: Box tightly bounds surface hairline scuffs and abrasive wear lines ($<2\text{ mm}$ width).
- **Minimum Size Threshold**: Defect must be at least $15\text{ px}$ in physical length. Isolated dust grains or single-pixel noise must not be labeled.

---

## 3. Boundary & Truncation Handling
- **Image Margins**: For defects extending beyond the field of view, the bounding box must terminate precisely at the image border ($x = 0$, $y = 0$, $x = W$, $y = H$). Do not extrapolate invisible defect portions.
- **Occlusions**: If a scraper bracket or mechanical skirt occludes part of a defect, create separate disjoint boxes for the visible portions on either side of the obstacle.

---

## 4. Multi-Annotator Consensus & QA Acceptance Criteria
1. **IoU Consistency**: Two independent computer vision annotators must achieve an $\text{IoU} \ge 0.80$ on sample verification frames.
2. **Audit Rejection Threshold**: Any annotation box containing $>40\%$ undamaged rubber area will be flagged as `OVERSIZED_BOX` and rejected during dataset QA audits.
