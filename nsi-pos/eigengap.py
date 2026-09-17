import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

similarity_file = "pos_similarity_matrix.csv"
max = 30

similarity_df = pd.read_csv(similarity_file, index_col=0)

W = similarity_df.to_numpy(dtype=float)

W = (W + W.T) / 2

degrees = np.sum(W, axis=1)

if np.any(degrees <= 0):
    raise ValueError(
        "At least one node as degree zero."
    )

D_inverse_sqrt = np.diag(
    1.0 / np.sqrt(degrees)
)

L = (
    np.eye(W.shape[0]) - D_inverse_sqrt @ W @ D_inverse_sqrt
)

L = (L + L.T) / 2

eigenvalues = np.linalg.eigvalsh(L)

eigenvalues[np.isclose(eigenvalues, 0, atol=1e-12)] = 0.0

eigengaps = np.diff(eigenvalues)

candidate_k = np.arange(1, len(eigengaps) + 1)

num_to_plot = min(max, len(eigengaps))

plot_k = candidate_k[:num_to_plot]
plot_gaps = eigengaps[:num_to_plot]

results = pd.DataFrame({
    "candidate_k": candidate_k,
    "left_eigenvalue": eigenvalues[:-1],
    "right_eigenvalue": eigenvalues[1:],
    "eigengap": eigengaps
})

print("\n Largest eigengaps among the plotted values:")

print(
    results.head(num_to_plot)
    .sort_values(
        by="eigengap",
        ascending=False
    )
    .head(10)
    .to_string(index=False)
)

plt.figure(figsize=(11,6))

plt.plot(plot_k, plot_gaps, marker="o")

plt.xlabel("Candidate number of clusters, k")

plt.ylabel(r"Eigengap: $\lambda_{k+1} - \lambda_k$")

plt.title("Eigengap by Increasing Eigenvalue Index")

plt.xticks(plot_k)

plt.grid()

plt.tight_layout()

plt.savefig("eigengap_by_eigenvalue.png", dpi=300, bbox_inches = "tight")

plt.show()