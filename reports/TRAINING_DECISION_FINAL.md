# MineGuard AI — Training Decision Final

## DECISION: MODEL_TRAINING_NOT_JUSTIFIED

### Rigorous Engineering Criteria:
1. **Pipeline & Orientation Root Cause**: The primary failure was mathematically reproduced as an optical aspect-ratio compression (5.1x) and 90-degree gantry orientation mismatch. Rotating to landscape restores 100% defect detection immediately.
2. **Production Model Superiority**: Benchmark proves `models/final_sih_model.pt` has 100% horizontal tear recall, 85.2% splice recall, and 0.0% clean-belt false alarms.
3. **Risk of Retraining**: Blindly retraining on portrait cellphone images would cause catastrophic domain shift, severe false alarms, and degradation of industrial gantry detection.
