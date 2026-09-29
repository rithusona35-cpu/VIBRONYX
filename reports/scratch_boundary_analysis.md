# Deep Scratch vs Slight Scratch Boundary Analysis
**MineGuard AI — Conveyor Defect Taxonomy Resolution**

## 1. Quantitative Breakdown
- **Total Scratch Annotations Audited in Validation**: 115
- **CLEAR_DEEP**: 47 (40.9%)
- **CLEAR_SLIGHT**: 0 (0.0%)
- **AMBIGUOUS**: 68 (59.1%)

## 2. Visual Ambiguity & Physics of Optical Imaging
1. **Depth Ambiguity in 2D Monochrome/RGB**: Single 2D camera views cannot directly measure millimeter depth profile. A deep scratch illuminated by overhead lighting casts less shadow than a shallow scratch under low-angle cross-lighting.
2. **Resolution Limitations**: At 800x800 nominal resolution, a 1 mm hairline scratch spans only 1-2 pixels, where anti-aliasing blurs the edge boundary.
3. **Operational Impact**: For industrial conveyor safety, any scratch displaying severe elongation or carcass exposure must trigger maintenance alert; slight scratches indicate routine cosmetic wear.

## 3. Policy Recommendation
- Maintain conservative separation without aggressive relabeling.
- Exclude ambiguous samples from contradictory gradient penalties.
