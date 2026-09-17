from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import SpectralClustering
from sklearn.metrics import silhouette_score

input_file = Path("nsi_with_pos_templates.csv")
unique_templates_file = Path("unique_pos_template_clusters.csv")
distance_matrix_file = Path("pos_distance_matrix.csv")
similarity_matrix_file = Path("pos_similarity_matrix.csv")

template_column = "coarse_template"
text_column = "nsi_text"

def sequence(template: str) -> list[str]:
    return [
        tag.strip()
        for tag in template.split("+")
        if tag.strip()
    ]

def edit_distance(sequence_a: list[str], sequence_b: list[str]) -> int:
    rows = len(sequence_a) + 1
    columns = len(sequence_b) + 1

    table = np.zeros(
        (rows,columns),
        dtype = int
    )

    for row in range(rows):
        table[row, 0] = row
    
    for column in range(columns):
        table[0, column] = column

    for row in range(1, rows):
        for column in range(1, columns):
            current_a = sequence_a[row - 1]
            current_b = sequence_b[column - 1]

            if current_a == current_b:
                table[row, column] = table[row - 1, column - 1]
            else:
                deletion_cost = table[row - 1, column] + 1
                insertion_cost = table[row, column - 1] + 1

                table[row, column] = min(
                    deletion_cost,
                    insertion_cost
                )
    
    return int(table[-1, -1])

def distance_matrix(sequences: list[list[str]]) -> np.ndarray:
    num_templates = len(sequences)
    matrix = np.zeros(
        (num_templates, num_templates),
        dtype = int
    )

    for i in range(num_templates):
        for j in range(i + 1, num_templates):
            distance = edit_distance(
                sequences[i],
                sequences[j]
            )

            matrix[i, j] = distance
            matrix[j, i] = distance
        
        if (i + 1) % 50 == 0 or i + 1 == num_templates:
            print(
                f"Processed {i + 1}/"
                f"{num_templates} templates"
            )
    
    return matrix

def estimate_sigma(distance_matrix: np.ndarray) -> float:
    positive_distances = distance_matrix[distance_matrix > 0]

    if len(positive_distances) == 0:
        return 1.0
    
    return float(np.median(positive_distances))

def similarity_matrix(distance_matrix: np.ndarray, sigma: float) -> np.ndarray:
    similarity_matrix = np.exp(-(distance_matrix.astype(float) ** 2) / (2 * sigma * 2))

    np.fill_diagonal(similarity_matrix, 1.0)

    return similarity_matrix

def save_matrix(matrix: np.ndarray, template_names: list[str], output_file: Path) -> None:
    matrix_df = pd.DataFrame(matrix, index=template_names,columns=template_names)

    matrix_df.index.name = template_column

    matrix_df.to_csv(output_file)

def main() -> None:
    df = pd.read_csv(input_file)

    usable_templates = (df[template_column].dropna().astype(str).str.strip())
    usable_templates = usable_templates[usable_templates != ""]

    unique_templates_df = (usable_templates.value_counts().rename_axis(template_column).reset_index(name="frequency"))

    template_names = (unique_templates_df[template_column].tolist())

    sequences = [
        sequence(template)
        for template in template_names
    ]

    unique_templates_df["template_length"] = [
        len(sequence)
        for sequence in sequences
    ]

    unique_templates_df.to_csv(unique_templates_file, index = False)

    d_matrix = distance_matrix(sequences)

    save_matrix(matrix = d_matrix, template_names=template_names, output_file=distance_matrix_file)

    sigma = estimate_sigma(d_matrix)

    s_matrix = similarity_matrix(distance_matrix=d_matrix, sigma=sigma)

    save_matrix(matrix=s_matrix, template_names=template_names, output_file=similarity_matrix_file)

if __name__ == "__main__":
    main()