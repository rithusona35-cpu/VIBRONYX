import pandas as pd

df = pd.read_csv("per_class_metrics.csv")
df.to_csv("baseline_metrics.csv", index=False)
print("Saved baseline_metrics.csv")
