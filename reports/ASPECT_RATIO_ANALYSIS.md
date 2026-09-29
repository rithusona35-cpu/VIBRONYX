# MineGuard AI — Aspect Ratio Information Loss Analysis

When an image with aspect ratio 1:2.21 (1844x4080) is processed through standard YOLO letterboxing (800x800):
- **Effective Scale Factor**: 800 / 4080 = 0.196 (5.1x reduction)
- **Scaled Width**: 1844 * 0.196 = 361 px (with 219 px letterbox padding on left and right)
- **Defect Fissure Physical Width**: An 18 px tear fissure is reduced to 18 * 0.196 = 3.5 px.
- **Result**: Deep convolutional feature maps at stride 16 and 32 completely lose narrow vertical edges.
