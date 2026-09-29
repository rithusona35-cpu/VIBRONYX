# Real-World V2 False Positive Analysis & Root Cause Breakdown
**SIH 26008: Blind Validation Diagnostics**

---

## 1. Summary of False Positives
Total False Positives Recorded: **56 instances** across 50 blind test images.

| Defect Class | False Positive Count | Primary Physical Mechanism |
| :--- | :--- | :--- |
| **Slight Scratch** | 13 | Specular Glare & Directional Overhead Lamp Reflections |
| **Deep Scratch** | 26 | Skirting Rubber Shadows & Bracket Crevices |
| **Longitudinal Tear** | 11 | Belt Edge Guide Roller Seams |
| **Belt Splice** | 6 | Transverse Heavy Scraper Accumulation |

---

## 2. Root Cause Category Classification

| Incident ID | Image ID | Predicted Class | Confidence | Physical Root Cause | Lighting Condition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FP-01` | `belt_splice_02_frame_20260504_001445_047434_jpg.rf.1fd76942948d19edb8efa98b10b9b4a5.jpg` | **Belt Splice** | 0.73 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-02` | `belt_splice_04_frame_20260504_001534_122536_jpg.rf.ccb51e749bead969d37c4cbeea5d6bcc.jpg` | **Belt Splice** | 0.75 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-03` | `belt_splice_05_frame_20260504_001549_078762_jpg.rf.4c9b6a416fb4d0d4d54b9f63c4bc5d6f.jpg` | **Belt Splice** | 0.76 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-04` | `belt_splice_08_frame_20260504_002351_721258_jpg.rf.61050ff5514265572a506e35b06ad461.jpg` | **Belt Splice** | 0.69 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-05` | `belt_splice_08_frame_20260504_002351_721258_jpg.rf.61050ff5514265572a506e35b06ad461.jpg` | **Deep Scratch** | 0.55 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-06` | `belt_splice_09_frame_20260504_002355_717638_jpg.rf.9bd9227984df4f46c166e76263bddbd8.jpg` | **Belt Splice** | 0.76 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-07` | `belt_splice_10_frame_20260504_002406_708018_jpg.rf.be4013cacfa2e012ff1421bd1bb97e7c.jpg` | **Belt Splice** | 0.71 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-08` | `belt_splice_10_frame_20260504_002406_708018_jpg.rf.be4013cacfa2e012ff1421bd1bb97e7c.jpg` | **Deep Scratch** | 0.59 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-09` | `deep_scratch_01_frame_20260504_005906_773257_jpg.rf.a5efba1b2b765512f9944b0d89dd10ec.jpg` | **Slight Scratch** | 0.39 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-10` | `deep_scratch_02_frame_20260504_005941_985035_jpg.rf.443b36939fe4355f2011e3c0e9bf75f6.jpg` | **Slight Scratch** | 0.50 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-11` | `deep_scratch_03_frame_20260504_010353_895335_jpg.rf.d339c892c6d1d0625aefec9eafc61439.jpg` | **Deep Scratch** | 0.66 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-12` | `deep_scratch_04_frame_20260504_001426_418414_jpg.rf.161c709ef1bd88450caf793a1dd2d5d2.jpg` | **Deep Scratch** | 0.43 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-13` | `deep_scratch_04_frame_20260504_001426_418414_jpg.rf.161c709ef1bd88450caf793a1dd2d5d2.jpg` | **Deep Scratch** | 0.35 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-14` | `deep_scratch_04_frame_20260504_001426_418414_jpg.rf.161c709ef1bd88450caf793a1dd2d5d2.jpg` | **Deep Scratch** | 0.31 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-15` | `deep_scratch_05_frame_20260504_001427_194997_jpg.rf.c120e9b8ef8efb9d1278dbd5c44b0bbe.jpg` | **Deep Scratch** | 0.41 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-16` | `deep_scratch_05_frame_20260504_001427_194997_jpg.rf.c120e9b8ef8efb9d1278dbd5c44b0bbe.jpg` | **Deep Scratch** | 0.33 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-17` | `deep_scratch_05_frame_20260504_001427_194997_jpg.rf.c120e9b8ef8efb9d1278dbd5c44b0bbe.jpg` | **Deep Scratch** | 0.29 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-18` | `deep_scratch_06_frame_20260504_001428_139165_jpg.rf.6919eb4a4d94d18f19961c12d1b181cf.jpg` | **Deep Scratch** | 0.45 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-19` | `deep_scratch_06_frame_20260504_001428_139165_jpg.rf.6919eb4a4d94d18f19961c12d1b181cf.jpg` | **Deep Scratch** | 0.41 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-20` | `deep_scratch_06_frame_20260504_001428_139165_jpg.rf.6919eb4a4d94d18f19961c12d1b181cf.jpg` | **Deep Scratch** | 0.40 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-21` | `deep_scratch_07_frame_20260504_001428_997880_jpg.rf.ffb58c3abd33fdafd1b5bc9c71c4bf90.jpg` | **Deep Scratch** | 0.47 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-22` | `deep_scratch_07_frame_20260504_001428_997880_jpg.rf.ffb58c3abd33fdafd1b5bc9c71c4bf90.jpg` | **Deep Scratch** | 0.42 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-23` | `deep_scratch_07_frame_20260504_001428_997880_jpg.rf.ffb58c3abd33fdafd1b5bc9c71c4bf90.jpg` | **Deep Scratch** | 0.33 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-24` | `deep_scratch_08_frame_20260504_001430_293195_jpg.rf.72b04e3058dd21b8fa6af7fd40ad0261.jpg` | **Deep Scratch** | 0.42 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-25` | `deep_scratch_08_frame_20260504_001430_293195_jpg.rf.72b04e3058dd21b8fa6af7fd40ad0261.jpg` | **Deep Scratch** | 0.41 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-26` | `deep_scratch_08_frame_20260504_001430_293195_jpg.rf.72b04e3058dd21b8fa6af7fd40ad0261.jpg` | **Deep Scratch** | 0.39 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-27` | `deep_scratch_09_frame_20260504_001431_208607_jpg.rf.a0a3672eef9af93716af13a483dbd162.jpg` | **Deep Scratch** | 0.43 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-28` | `deep_scratch_09_frame_20260504_001431_208607_jpg.rf.a0a3672eef9af93716af13a483dbd162.jpg` | **Deep Scratch** | 0.43 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-29` | `deep_scratch_09_frame_20260504_001431_208607_jpg.rf.a0a3672eef9af93716af13a483dbd162.jpg` | **Deep Scratch** | 0.41 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-30` | `deep_scratch_10_frame_20260504_001432_273343_jpg.rf.40f508fad80025b65e6a826779a7ab93.jpg` | **Deep Scratch** | 0.42 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-31` | `deep_scratch_10_frame_20260504_001432_273343_jpg.rf.40f508fad80025b65e6a826779a7ab93.jpg` | **Deep Scratch** | 0.40 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-32` | `deep_scratch_10_frame_20260504_001432_273343_jpg.rf.40f508fad80025b65e6a826779a7ab93.jpg` | **Deep Scratch** | 0.34 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-33` | `longitudinal_tear_01_frame_20260504_001509_988740_jpg.rf.03c9d782be7db917b7aaca7aeb339782.jpg` | **Longitudinal Tear** | 0.51 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-34` | `longitudinal_tear_02_frame_20260504_001614_049752_jpg.rf.4f4263eb05be3c5dd2b42729460aa66e.jpg` | **Longitudinal Tear** | 0.61 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-35` | `longitudinal_tear_03_frame_20260504_001441_961350_jpg.rf.aebad6485a90033e8aafb8473b255733.jpg` | **Longitudinal Tear** | 0.44 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-36` | `longitudinal_tear_04_frame_20260504_001442_973718_jpg.rf.90d4f9f9ea14388c79734122d099959d.jpg` | **Longitudinal Tear** | 0.72 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-37` | `longitudinal_tear_05_frame_20260504_001446_073037_jpg.rf.41a1e03f738daaea4fa37ef8e77b8514.jpg` | **Longitudinal Tear** | 0.68 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-38` | `longitudinal_tear_06_frame_20260504_001458_186179_jpg.rf.45c9d9611e5b70db947eea4e15b0ee40.jpg` | **Longitudinal Tear** | 0.70 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-39` | `longitudinal_tear_07_frame_20260504_001500_986995_jpg.rf.137e077228e57924f663b0fc7ab37f2c.jpg` | **Longitudinal Tear** | 0.73 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-40` | `longitudinal_tear_08_frame_20260504_001513_018302_jpg.rf.f7516e8158c1e059f9d729290f1cadd1.jpg` | **Longitudinal Tear** | 0.71 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-41` | `longitudinal_tear_09_frame_20260504_001516_192421_jpg.rf.47ba6e82dc7c892129965266c47dab0f.jpg` | **Longitudinal Tear** | 0.63 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-42` | `longitudinal_tear_10_frame_20260504_001530_996480_jpg.rf.79076124b49cc1e78d71bf932343f671.jpg` | **Longitudinal Tear** | 0.60 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-43` | `healthy_01_frame_20260504_001551_068015_jpg.rf.2eae1557a440a3106f20cad67bc9714f.jpg` | **Slight Scratch** | 0.26 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-44` | `healthy_03_frame_20260504_001610_014236_jpg.rf.3eae5a7e3561521329e39c8bf75f3ab2.jpg` | **Slight Scratch** | 0.58 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-45` | `healthy_08_frame_20260504_001453_094795_jpg.rf.965b1f19600269ad921f53f2648c46a9.jpg` | **Slight Scratch** | 0.25 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-46` | `healthy_09_frame_20260504_001457_172954_jpg.rf.c14014192a520d1f9c41d3a31ef9b8e0.jpg` | **Longitudinal Tear** | 0.42 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-47` | `slight_scratch_02_frame_20260504_005841_669567_jpg.rf.3fd04fd5405cc984bf43bcfe6c6ab419.jpg` | **Slight Scratch** | 0.37 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-48` | `slight_scratch_03_frame_20260504_005842_678301_jpg.rf.375ec8311467a5f68cec5c5ab10a9719.jpg` | **Slight Scratch** | 0.41 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-49` | `slight_scratch_04_frame_20260504_005913_708942_jpg.rf.de54908c81e5e744e12851844dacbb41.jpg` | **Slight Scratch** | 0.61 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-50` | `slight_scratch_04_frame_20260504_005913_708942_jpg.rf.de54908c81e5e744e12851844dacbb41.jpg` | **Deep Scratch** | 0.32 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-51` | `slight_scratch_04_frame_20260504_005913_708942_jpg.rf.de54908c81e5e744e12851844dacbb41.jpg` | **Slight Scratch** | 0.30 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-52` | `slight_scratch_06_frame_20260504_001506_013874_jpg.rf.505f8f14ab8c2fd9a7fa0609dcc8f890.jpg` | **Slight Scratch** | 0.46 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-53` | `slight_scratch_07_frame_20260504_001508_000036_jpg.rf.efb61e2418a00773b1f1ece1ade28d53.jpg` | **Slight Scratch** | 0.47 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-54` | `slight_scratch_08_frame_20260504_001556_054329_jpg.rf.be72c461d23c71e9a1bbf6f247c5de1e.jpg` | **Deep Scratch** | 0.43 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-55` | `slight_scratch_09_frame_20260504_002357_706435_jpg.rf.d832e83050f6ecd76d7b9d2a3e933c87.jpg` | **Slight Scratch** | 0.52 | BELT_TEXTURE | NORMAL_LIGHT |
| `FP-56` | `slight_scratch_10_frame_20260504_002359_717757_jpg.rf.62d5259233ef832813a943c301a5a014.jpg` | **Slight Scratch** | 0.40 | BELT_TEXTURE | NORMAL_LIGHT |

---

## 3. Engineering Countermeasures
1. **Polarizing Optical Filters**: Eliminates specular reflections from shiny vulcanized rubber.
2. **Low-Angle Grazing Illumination**: Replaces diffuse overhead fixtures with 15–25° cross-lighting to highlight true depth.
