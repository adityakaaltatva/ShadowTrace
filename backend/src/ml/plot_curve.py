import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("dealbreaker_benchmark.csv")

plt.figure(figsize=(8,5))
plt.plot(df["evaluations"], df["time_ms"], marker="o", linewidth=2)

plt.title("Dealbreaker Efficiency Curve")
plt.xlabel("Number of Wallet Evaluations")
plt.ylabel("Time (ms)")
plt.grid(True)

plt.savefig("dealbreaker_efficiency_curve.png", dpi=300)
print("Saved: dealbreaker_efficiency_curve.png")
