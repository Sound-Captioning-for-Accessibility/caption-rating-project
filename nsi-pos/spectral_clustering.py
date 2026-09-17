"""
Run spectral clustering on the POS-template similarity graph.

This script assumes that the edit-distance and similarity-matrix script
has already created:

    unique_pos_template_clusters.csv
    pos_distance_matrix.csv
    pos_similarity_matrix.csv

Outputs:

    clustered_pos_templates.csv
    spectral_cluster_summary.csv
"""

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import SpectralClustering
from sklearn.metrics import silhouette_score


# ============================================================
# SETTINGS
# ============================================================

UNIQUE_TEMPLATES_FILE = Path("unique_pos_template_clusters.csv")
DISTANCE_MATRIX_FILE = Path("pos_distance_matrix.csv")
SIMILARITY_MATRIX_FILE = Path("pos_similarity_matrix.csv")

ORIGINAL_NSI_FILE = Path("nsi_with_pos_templates.csv")

CLUSTERED_TEMPLATES_FILE = Path("clustered_pos_templates.csv")
CLUSTER_SUMMARY_FILE = Path("spectral_cluster_summary.csv")

TEMPLATE_COLUMN = "coarse_template"
TEXT_COLUMN = "nsi_text"

# This is the number of groups spectral clustering will produce.
# You can test different values later.
NUMBER_OF_CLUSTERS = 4

# Ensures that repeated runs produce the same result.
RANDOM_STATE = 42

MAX_SUBCLUSTERS_TO_TEST = 10

MANUAL_SUBCLUSTER_K = {
    1: None,
    2: None,
    3: None,
    4: None
}

# ============================================================
# LOAD A SAVED MATRIX
# ============================================================

def load_matrix(
    file_path: Path
) -> pd.DataFrame:
    """
    Load a matrix CSV that has template names as both:

        - row labels
        - column labels

    index_col=0 tells pandas that the first column contains
    the row names rather than ordinary matrix values.
    """

    if not file_path.exists():
        raise FileNotFoundError(
            f"Could not find:\n{file_path.resolve()}"
        )

    matrix_df = pd.read_csv(
        file_path,
        index_col=0
    )

    return matrix_df


# ============================================================
# VALIDATE THE MATRICES
# ============================================================

def validate_matrices(
    distance_df: pd.DataFrame,
    similarity_df: pd.DataFrame
) -> None:
    """
    Confirm that the distance and similarity matrices are compatible.

    Both matrices should:

        - be square
        - have the same dimensions
        - use the same template names
        - contain finite numeric values
    """

    if distance_df.shape[0] != distance_df.shape[1]:
        raise ValueError(
            "The distance matrix is not square."
        )

    if similarity_df.shape[0] != similarity_df.shape[1]:
        raise ValueError(
            "The similarity matrix is not square."
        )

    if distance_df.shape != similarity_df.shape:
        raise ValueError(
            "The distance and similarity matrices have "
            "different dimensions."
        )

    if list(distance_df.index) != list(similarity_df.index):
        raise ValueError(
            "The matrix row labels are not in the same order."
        )

    if list(distance_df.columns) != list(similarity_df.columns):
        raise ValueError(
            "The matrix column labels are not in the same order."
        )

    distance_values = distance_df.to_numpy(
        dtype=float
    )

    similarity_values = similarity_df.to_numpy(
        dtype=float
    )

    if not np.isfinite(distance_values).all():
        raise ValueError(
            "The distance matrix contains missing or infinite values."
        )

    if not np.isfinite(similarity_values).all():
        raise ValueError(
            "The similarity matrix contains missing or infinite values."
        )

    if not np.allclose(
        distance_values,
        distance_values.T
    ):
        raise ValueError(
            "The distance matrix is not symmetric."
        )

    if not np.allclose(
        similarity_values,
        similarity_values.T
    ):
        raise ValueError(
            "The similarity matrix is not symmetric."
        )

    if np.any(similarity_values < 0):
        raise ValueError(
            "The similarity matrix contains negative edge weights."
        )


# ============================================================
# RUN SPECTRAL CLUSTERING
# ============================================================

def run_spectral_clustering(
    similarity_matrix: np.ndarray,
    number_of_clusters: int
) -> np.ndarray:
    """
    Run spectral clustering on the precomputed similarity graph.

    Each row and column represents one POS template.

    Each matrix value represents the strength of the edge
    between two POS templates.

    affinity="precomputed" tells scikit-learn that we have already
    created the similarity matrix. It should therefore use the matrix
    directly as the weighted graph.

    assign_labels="kmeans" means that after spectral clustering creates
    its new eigenvector-based representation, k-means assigns the final
    cluster labels.
    """

    number_of_templates = similarity_matrix.shape[0]

    if number_of_clusters < 2:
        raise ValueError(
            "NUMBER_OF_CLUSTERS must be at least 2."
        )

    if number_of_clusters >= number_of_templates:
        raise ValueError(
            "NUMBER_OF_CLUSTERS must be smaller than the "
            "number of unique templates."
        )

    model = SpectralClustering(
        n_clusters=number_of_clusters,
        affinity="precomputed",
        assign_labels="kmeans",
        n_init=20,
        random_state=RANDOM_STATE
    )

    labels = model.fit_predict(
        similarity_matrix
    )

    return labels


# ============================================================
# CALCULATE SILHOUETTE SCORE
# ============================================================

def calculate_silhouette_score(
    distance_matrix: np.ndarray,
    labels: np.ndarray
) -> float:
    """
    Evaluate how well-separated the clusters are.

    Because we already calculated pairwise edit distances, we use:

        metric="precomputed"

    General interpretation:

        close to 1:
            templates are much closer to their own cluster than
            to other clusters

        close to 0:
            clusters overlap

        below 0:
            some templates may fit better in another cluster

    The score should not be treated as the only measure of success.
    The linguistic interpretability of the clusters also matters.
    """

    return float(
        silhouette_score(
            distance_matrix,
            labels,
            metric="precomputed"
        )
    )


# ============================================================
# CREATE A CLUSTER SUMMARY
# ============================================================

def create_cluster_summary(
    clustered_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Create one summary row for each cluster.

    The summary includes:

        - number of unique POS templates
        - number of original NSIs represented
        - average template length
        - most frequent POS template
    """

    summary_rows = []

    for cluster_id, group in clustered_df.groupby(
        "cluster"
    ):
        group = group.sort_values(
            by="frequency",
            ascending=False
        )

        summary_rows.append(
            {
                "cluster": cluster_id,
                "number_of_unique_templates": len(group),
                "total_nsi_frequency": int(
                    group["frequency"].sum()
                ),
                "average_template_length": float(
                    group["template_length"].mean()
                ),
                "most_frequent_template": (
                    group.iloc[0][TEMPLATE_COLUMN]
                ),
                "most_frequent_template_count": int(
                    group.iloc[0]["frequency"]
                )
            }
        )

    summary_df = pd.DataFrame(
        summary_rows
    )

    return summary_df.sort_values(
        by="cluster"
    )


# ============================================================
# PRINT EXAMPLE TEMPLATES
# ============================================================

def print_cluster_examples(
    clustered_df: pd.DataFrame,
    examples_per_cluster: int = 10
) -> None:
    """
    Print the most frequent POS templates in every cluster.

    This is useful for determining whether each cluster represents
    an understandable grammatical structure.
    """

    for cluster_id in sorted(
        clustered_df["cluster"].unique()
    ):
        cluster = clustered_df[
            clustered_df["cluster"] == cluster_id
        ].sort_values(
            by="frequency",
            ascending=False
        )

        print("\n" + "=" * 65)
        print(f"CLUSTER {cluster_id}")
        print("=" * 65)

        examples = cluster.head(
            examples_per_cluster
        )

        for _, row in examples.iterrows():
            print(
                f"{row[TEMPLATE_COLUMN]:40s} "
                f"frequency={row['frequency']}"
            )

def add_caption_examples(
    clustered_df: pd.DataFrame,
    original_df: pd.DataFrame,
    max_examples: int = 5
) -> pd.DataFrame:
    """
    Add two columns to each POS template:

    1. unique_nsi_count
       Number of distinct NSI captions using that template.

    2. example_nsi_captions
       Up to five distinct NSI captions using that template.

    Duplicate captions are removed before counting/selecting examples.
    """

    # Keep only rows that have both a POS template and NSI text.
    usable = original_df[
        original_df[TEMPLATE_COLUMN].notna()
        & original_df[TEXT_COLUMN].notna()
    ].copy()

    # Clean whitespace so captions such as
    # "music" and " music " are treated as the same caption.
    usable[TEMPLATE_COLUMN] = (
        usable[TEMPLATE_COLUMN]
        .astype(str)
        .str.strip()
    )

    usable[TEXT_COLUMN] = (
        usable[TEXT_COLUMN]
        .astype(str)
        .str.strip()
    )

    # Remove empty strings.
    usable = usable[
        (usable[TEMPLATE_COLUMN] != "")
        & (usable[TEXT_COLUMN] != "")
    ]

    # Remove repeated copies of the exact same caption
    # within the same POS template.
    unique_caption_pairs = usable.drop_duplicates(
        subset=[TEMPLATE_COLUMN, TEXT_COLUMN]
    )

    # Count the number of UNIQUE captions for each template.
    unique_counts = (
        unique_caption_pairs
        .groupby(TEMPLATE_COLUMN)[TEXT_COLUMN]
        .nunique()
        .rename("unique_nsi_count")
    )

    # Select at most five UNIQUE caption examples per template.
    examples = (
        unique_caption_pairs
        .groupby(TEMPLATE_COLUMN)[TEXT_COLUMN]
        .apply(
            lambda captions:
            " | ".join(
                captions.head(max_examples).tolist()
            )
        )
        .rename("example_nsi_captions")
    )

    # Add the new information to the clustered template dataframe.
    result = clustered_df.merge(
        unique_counts,
        how="left",
        left_on=TEMPLATE_COLUMN,
        right_index=True
    )

    result = result.merge(
        examples,
        how="left",
        left_on=TEMPLATE_COLUMN,
        right_index=True
    )

    # Templates with no matching original caption get sensible defaults.
    result["unique_nsi_count"] = (
        result["unique_nsi_count"]
        .fillna(0)
        .astype(int)
    )

    result["example_nsi_captions"] = (
        result["example_nsi_captions"]
        .fillna("")
    )

    return result

def calculate_subcluster_k(
    similarity_matrix: np.ndarray,
    max_subclusters: int = 10
) -> int:
    """
    Use the eigengap heuristic to estimate how many subclusters
    should exist inside one high-level cluster.
    """

    number_of_templates = similarity_matrix.shape[0]

    if number_of_templates <= 1:
        return 1

    # Ensure symmetry.
    W = (
        similarity_matrix
        + similarity_matrix.T
    ) / 2.0

    # Degree of each node.
    degrees = np.sum(
        W,
        axis=1
    )

    if np.any(degrees <= 0):
        return 1

    # D^(-1/2)
    inverse_sqrt_degree = np.diag(
        1.0 / np.sqrt(degrees)
    )

    identity = np.eye(
        number_of_templates
    )

    # Normalized graph Laplacian.
    laplacian = (
        identity
        - inverse_sqrt_degree
        @ W
        @ inverse_sqrt_degree
    )

    laplacian = (
        laplacian
        + laplacian.T
    ) / 2.0

    eigenvalues = np.linalg.eigvalsh(
        laplacian
    )

    eigengaps = np.diff(
        eigenvalues
    )

    largest_k_to_test = min(
        max_subclusters,
        number_of_templates - 1
    )

    candidate_gaps = eigengaps[
        :largest_k_to_test
    ]

    if len(candidate_gaps) == 0:
        return 1

    suggested_k = (
        int(np.argmax(candidate_gaps))
        + 1
    )

    return suggested_k


def add_subclusters(
    clustered_df: pd.DataFrame,
    similarity_df: pd.DataFrame
) -> pd.DataFrame:
    """
    Run spectral clustering again separately inside each
    existing high-level cluster.

    Adds:
        subcluster
        subcluster_id

    Example:
        cluster = 1, subcluster = 2
        subcluster_id = "1.2"
    """

    result = clustered_df.copy()

    result["subcluster"] = pd.NA
    result["subcluster_id"] = ""

    high_level_clusters = sorted(
        result["cluster"].unique()
    )

    for high_cluster in high_level_clusters:

        mask = (
            result["cluster"]
            == high_cluster
        )

        templates = (
            result.loc[
                mask,
                TEMPLATE_COLUMN
            ]
            .astype(str)
            .tolist()
        )

        print("\n" + "=" * 65)
        print(
            f"SUBCLUSTERING HIGH-LEVEL CLUSTER {high_cluster}"
        )
        print("=" * 65)

        print(
            f"Templates: {len(templates)}"
        )

        # Pull only this cluster's rows and columns
        # from the full similarity matrix.
        cluster_similarity_df = similarity_df.loc[
            templates,
            templates
        ]

        cluster_similarity = (
            cluster_similarity_df
            .to_numpy(dtype=float)
        )

        # Find k using eigengap.
        suggested_k = calculate_subcluster_k(
            similarity_matrix=cluster_similarity,
            max_subclusters=MAX_SUBCLUSTERS_TO_TEST
        )

        manual_k = MANUAL_SUBCLUSTER_K.get(
            int(high_cluster)
        )

        if manual_k is None:
            chosen_k = suggested_k
        else:
            chosen_k = manual_k

        print(
            f"Eigengap suggested subcluster k = "
            f"{suggested_k}"
        )

        print(
            f"Using {chosen_k} subclusters"
        )

        # If k = 1, don't run spectral clustering.
        if chosen_k <= 1:

            labels = np.zeros(
                len(templates),
                dtype=int
            )

        else:

            model = SpectralClustering(
                n_clusters=chosen_k,
                affinity="precomputed",
                assign_labels="kmeans",
                n_init=20,
                random_state=RANDOM_STATE
            )

            labels = model.fit_predict(
                cluster_similarity
            )

        # Convert 0-based labels into 1-based labels.
        subcluster_numbers = (
            labels + 1
        )

        template_to_subcluster = dict(
            zip(
                templates,
                subcluster_numbers
            )
        )

        result.loc[
            mask,
            "subcluster"
        ] = (
            result.loc[
                mask,
                TEMPLATE_COLUMN
            ]
            .astype(str)
            .map(template_to_subcluster)
        )

        result.loc[
            mask,
            "subcluster_id"
        ] = (
            result.loc[
                mask
            ]
            .apply(
                lambda row:
                f"{int(row['cluster'])}."
                f"{int(row['subcluster'])}",
                axis=1
            )
        )

    result["subcluster"] = (
        result["subcluster"]
        .astype(int)
    )

    return result

# ============================================================
# MAIN PROGRAM
# ============================================================

def main() -> None:
    if not UNIQUE_TEMPLATES_FILE.exists():
        raise FileNotFoundError(
            f"Could not find:\n"
            f"{UNIQUE_TEMPLATES_FILE.resolve()}"
        )

    unique_templates_df = pd.read_csv(
        UNIQUE_TEMPLATES_FILE
    )

    if not ORIGINAL_NSI_FILE.exists():
        raise FileNotFoundError(
            f"Could not find:\n"
            f"{ORIGINAL_NSI_FILE.resolve()}"
        )

    original_df = pd.read_csv(
        ORIGINAL_NSI_FILE
    )

    required_original_columns = {
        TEMPLATE_COLUMN,
        TEXT_COLUMN
    }

    missing_original_columns = (
        required_original_columns
        - set(original_df.columns)
    )

    if missing_original_columns:
        raise KeyError(
            f"Missing columns in {ORIGINAL_NSI_FILE.name}: "
            f"{sorted(missing_original_columns)}"
        )

    required_columns = {
        TEMPLATE_COLUMN,
        "frequency",
        "template_length"
    }

    missing_columns = (
        required_columns
        - set(unique_templates_df.columns)
    )

    if missing_columns:
        raise KeyError(
            f"Missing columns in "
            f"{UNIQUE_TEMPLATES_FILE.name}: "
            f"{sorted(missing_columns)}"
        )

    distance_df = load_matrix(
        DISTANCE_MATRIX_FILE
    )

    similarity_df = load_matrix(
        SIMILARITY_MATRIX_FILE
    )

    validate_matrices(
        distance_df,
        similarity_df
    )

    # The ordering in the matrix must be used when assigning labels.
    matrix_template_names = (
        similarity_df.index.astype(str).tolist()
    )

    similarity_values = similarity_df.to_numpy(
        dtype=float
    )

    distance_values = distance_df.to_numpy(
        dtype=float
    )

    print(
        f"Unique templates: "
        f"{len(matrix_template_names):,}"
    )

    print(
        f"Running spectral clustering with "
        f"{NUMBER_OF_CLUSTERS} clusters..."
    )

    labels = run_spectral_clustering(
        similarity_matrix=similarity_values,
        number_of_clusters=NUMBER_OF_CLUSTERS
    )

    # Scikit-learn labels clusters starting from zero.
    # Adding one makes the labels easier to read: 1 through k.
    cluster_numbers = labels + 1

    # Create a map from each template name to its assigned cluster.
    template_to_cluster = dict(
        zip(
            matrix_template_names,
            cluster_numbers
        )
    )

    unique_templates_df["cluster"] = (
        unique_templates_df[TEMPLATE_COLUMN]
        .astype(str)
        .map(template_to_cluster)
    )

    if unique_templates_df["cluster"].isna().any():
        missing_templates = unique_templates_df.loc[
            unique_templates_df["cluster"].isna(),
            TEMPLATE_COLUMN
        ].tolist()

        raise ValueError(
            "Some templates in the unique-template file were not "
            "found in the matrices. Examples: "
            f"{missing_templates[:5]}"
        )

    unique_templates_df["cluster"] = (
        unique_templates_df["cluster"]
        .astype(int)
    )

    clustered_df = unique_templates_df.sort_values(
        by=["cluster", "frequency"],
        ascending=[True, False]
    )

    clustered_df = add_caption_examples(
        clustered_df=clustered_df,
        original_df=original_df,
        max_examples=5
    )

    clustered_df = add_subclusters(
        clustered_df=clustered_df,
        similarity_df=similarity_df
    )

    silhouette = calculate_silhouette_score(
        distance_matrix=distance_values,
        labels=labels
    )

    clustered_df.to_csv(
        CLUSTERED_TEMPLATES_FILE,
        index=False
    )

    summary_df = create_cluster_summary(
        clustered_df
    )

    # Store the overall silhouette score in the summary so that
    # the evaluation result is preserved in an output file.
    summary_df["overall_silhouette_score"] = silhouette

    summary_df.to_csv(
        CLUSTER_SUMMARY_FILE,
        index=False
    )

    print(
        f"Silhouette score: {silhouette:.4f}"
    )

    print("\nCluster sizes:")

    print(
        clustered_df["cluster"]
        .value_counts()
        .sort_index()
        .rename_axis("cluster")
        .to_string()
    )

    print_cluster_examples(
        clustered_df,
        examples_per_cluster=10
    )

    print("\nFiles saved:")

    print(
        CLUSTERED_TEMPLATES_FILE.resolve()
    )

    print(
        CLUSTER_SUMMARY_FILE.resolve()
    )


if __name__ == "__main__":
    main()