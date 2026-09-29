# MineGuard AI — Optical Lighting Layout Specification
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**
*Document Version: 1.0 (Low-Angle Grazing Cross-Illumination Standard)*

---

## 1. Executive Objective
Carbon-black vulcanized conveyor rubber possesses very low diffuse reflectivity ($\approx 4 - 6\%$). Traditional high-angle overhead lighting causes direct specular reflection (glare bloom) into the camera lens, while washing out the subtle shadows cast inside tears and scratches.

This layout defines a **low-angle grazing LED cross-lighting system** that:
1. Casts micro-shadows into fine hairline abrasions and deep grooves.
2. Diverts specular reflections away from the normal camera axis.
3. Provides uniform bilateral illumination across the conveyor belt width.

---

## 2. Geometric Layout Architecture

```
                       [ CAMERA (Normal Axis, 90°) ]
                                    │
                                    │ Distance: 1.20 m
                                    │
                             ▼      ▼      ▼
    ───────────────────────────────────────────────────────────── (Belt Surface)
      ▲                                                       ▲
     /                                                         \
    / Angle: 15°-25°                              Angle: 15°-25° \
   /                                                             \
[ LED BAR A (Left) ]                                    [ LED BAR B (Right) ]
 Height: 0.30 m                                          Height: 0.30 m
 Distance: 0.85 m                                        Distance: 0.85 m
```

---

## 3. Dimensional & Physical Parameters

| Component | Parameter | Specified Value | Permissible Range |
| :--- | :--- | :--- | :--- |
| **LED Bar A & B Type** | Linear Chip-on-Board (COB) LED Array | 60W per bar, 5000K CCT | 4500K – 5500K |
| **Illumination Angle** | Grazing incidence relative to belt plane | **18.0°** | **15.0° – 25.0°** |
| **Luminaire Height** | Vertical height above conveyor belt line | **0.30 meters** | $0.25 - 0.35\text{ m}$ |
| **Luminaire Offset** | Transverse horizontal distance from belt edge | **0.85 meters** | $0.80 - 0.90\text{ m}$ |
| **Luminous Intensity** | Belt surface illuminance | **2,500 Lux** | 2,000 – 3,000 Lux |
| **Uniformity Ratio** | Minimum / Maximum illuminance across belt | **$>0.85$** | $>0.80$ |
| **Polarization** | Linear polarizing film mounted over LED diffusers | Crossed at 90° to lens polarizer | Strict |

---

## 4. Elimination of Specular Glare (Cross-Polarization Principle)
1. **Source Polarizer**: High-transmission linear polarizing sheets are installed in front of LED Bars A and B with horizontal polarization orientation ($0^\circ$).
2. **Camera Polarizer**: A high-extinction polarizing filter is attached to the camera lens oriented vertically ($90^\circ$).
3. **Physics**: Direct specular reflections off shiny rubber retain their polarization state and are extinguished by $>98\%$ by the lens filter. Diffuse light scattered by subsurface fractures is depolarized and transmitted freely, yielding high-contrast defect silhouettes without glare streaks.

---

## 5. Strobe Synchronization
For conveyors moving faster than $2.0\text{ m/s}$, constant DC lighting produces slight motion blur unless shutter speeds are $<1/1500\text{s}$. 
- **Strobe Frequency**: Driven by a hardware optical shaft encoder attached to the conveyor tail pulley.
- **Pulse Duration**: $200\text{ \mu s}$ high-current overdrive flash pulse synchronized with the camera global shutter trigger.
- **Result**: Completely eliminates motion blur up to $5.0\text{ m/s}$ conveyor transit speed while extending LED operating lifespan.
