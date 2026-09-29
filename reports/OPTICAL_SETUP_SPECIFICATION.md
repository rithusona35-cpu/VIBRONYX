# MineGuard AI — Optical Setup Specification
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**
*Document Version: 1.0 (Phase 3 Optical Standardization)*
*Target Hardware: Industrial Conveyor Testbed & Field Deployments*

---

## 1. Purpose & Scope
This specification defines the mandatory optical, geometric, and sensor parameters for capturing conveyor belt imagery in the MineGuard AI system. The objective is to eliminate deployment domain shift caused by variable working distances, motion blur, and underexposed crevices.

---

## 2. Reference Camera Geometric Configuration

| Parameter | Reference Value | Tolerance | Operational Rationale |
| :--- | :--- | :--- | :--- |
| **Working Distance** | **1.20 meters** | $\pm 0.05\text{ m}$ | Standardized to guarantee $\le 0.8\text{ mm/pixel}$ resolution across a $1.6\text{ m}$ belt width. |
| **Camera Angle** | **90.0° (Normal)** | $\pm 2.0^\circ$ | Perpendicular to conveyor belt surface to eliminate keystone geometric distortion. |
| **Optical Axis** | Centered on belt centerline | $\pm 10\text{ mm}$ | Ensures symmetric field of view coverage from edge to edge. |
| **Field of View (H)** | **1,650 mm** | $\pm 25\text{ mm}$ | Fully covers $1,600\text{ mm}$ belt width plus $25\text{ mm}$ idler frame margins. |
| **Field of View (V)** | **1,250 mm** | $\pm 25\text{ mm}$ | Captures continuous longitudinal progression across conveyor transit. |
| **Native Sensor Resolution** | **1920 × 1080 (FHD)** or **2048 × 1536** | Native (No binning) | Native capture avoids downsampling blur before neural network inference. |
| **Aspect Ratio** | Fixed (16:9 or 4:3) | Strict | Statically aligned with optical sensor active pixel array. |

---

## 3. Sensor & Exposure Settings

To guarantee consistent signal-to-noise ratio and prevent motion blur at belt speeds up to $4.5\text{ m/s}$:

1. **Focus**: **MANUAL / FIXED**. Calibrated at $1.20\text{ m}$ with industrial focus lock ring screw tightened.
2. **Exposure Mode**: **MANUAL / FIXED**. Automatic exposure is strictly disabled to prevent frame-to-frame flicker.
3. **Shutter Speed**: **1/1000s to 1/2000s** ($0.5 - 1.0\text{ ms}$). Eliminates linear motion blur on moving rubber.
4. **Gain / ISO**: **ISO 100 to 200** (Low gain). Minimizes CMOS dark current thermal noise in dark vulcanized rubber.
5. **White Balance**: **FIXED (5000 K daylight balance)**. Auto white balance disabled to preserve true pigment contrasts.
6. **Lens Aperture**: **f/4.0 to f/5.6**. Maximizes depth of field ($\approx 120\text{ mm}$) to maintain sharp focus across belt sag and roller troughing.

---

## 4. Mandatory Disabled Software Enhancements
Consumer camera ISP features introduce non-linear artifacts that degrade neural feature maps. The following processing must be permanently disabled:
- **Auto Exposure (AE)**: Disabled.
- **Auto White Balance (AWB)**: Disabled.
- **Dynamic HDR / Local Tone Mapping**: Disabled (destroys shadow depth signatures in scratches).
- **Edge Enhancement / Digital Sharpening**: Disabled (generates halo artifacts resembling false cracks).
- **Digital Zoom / EIS**: Disabled (causes bilinear interpolation interpolation blur).
- **Noise Reduction Filters**: Set to lowest linear setting to preserve fine hairline scratch contours.

---

## 5. Industrial Lens Selection Guidelines
- **Lens Type**: High-resolution, low-distortion C-mount industrial lens ($<0.5\%$ optical distortion).
- **Focal Length**: $f = 12.5\text{ mm}$ on a 1/1.8" format sensor yields $1.65\text{ m}$ FOV at $1.20\text{ m}$ working distance.
- **Lens Filter**: Polarizing optical filter (linear or circular) permanently mounted to extinguish high-angle specular glare streaks from industrial lighting.
