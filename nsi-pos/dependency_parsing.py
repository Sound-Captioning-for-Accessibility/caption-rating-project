import json
from pathlib import Path

import pandas as pd
import spacy


input_file = Path("nsi_with_pos_templates.csv")
output_file = Path("dependency_trees.csv")

column = "nsi_text"


def dependency_template(doc) -> str:
    relationships = []

    for token in doc:
        if token.is_space:
            continue

        relationship = (
            f"{token.pos_}"
            f"-{token.dep_}->"
            f"{token.head.pos_}"
        )

        relationships.append(relationship)

    return " | ".join(relationships)


def dependency_tree_json(doc) -> str:
    nodes = []

    for token in doc:
        if token.is_space:
            continue

        node = {
            "token_index": token.i,
            "word": token.text,
            "coarse_pos": token.pos_,
            "fine_pos": token.tag_,
            "dependency": token.dep_,
            "head_index": token.head.i,
            "head_word": token.head.text,
            "head_pos": token.head.pos_,
            "is_root": token.dep_ == "ROOT",
        }

        nodes.append(node)

    return json.dumps(nodes)


def print_dependency_parse(doc) -> None:
    print(f"\nText: {doc.text}")
    print("-" * 85)

    print(
        f"{'WORD':<20}"
        f"{'COARSE POS':<14}"
        f"{'FINE POS':<12}"
        f"{'DEPENDENCY':<16}"
        f"{'HEAD'}"
    )

    print("-" * 85)

    for token in doc:
        print(
            f"{token.text:<20}"
            f"{token.pos_:<14}"
            f"{token.tag_:<12}"
            f"{token.dep_:<16}"
            f"{token.head.text}"
        )


def main() -> None:
    if not input_file.exists():
        raise FileNotFoundError(
            f"Could not find the input file: {input_file.resolve()}"
        )

    df = pd.read_csv(input_file)

    if column not in df.columns:
        raise KeyError(
            f"The column '{column}' was not found. "
            f"Available columns: {list(df.columns)}"
        )

    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError as error:
        raise OSError(
            "The spaCy model is not installed. Run:\n"
            "python -m spacy download en_core_web_sm"
        ) from error

    texts = (
        df[column]
        .fillna("")
        .astype(str)
        .tolist()
    )

    dependency_templates = []
    dependency_trees = []
    root_words = []
    root_pos_tags = []
    token_counts = []

    docs = nlp.pipe(
        texts,
        batch_size=100
    )

    for doc in docs:
        dependency_templates.append(
            dependency_template(doc)
        )

        dependency_trees.append(
            dependency_tree_json(doc)
        )

        roots = [
            token
            for token in doc
            if token.dep_ == "ROOT"
        ]

        if roots:
            root_words.append(roots[0].text)
            root_pos_tags.append(roots[0].pos_)
        else:
            root_words.append("")
            root_pos_tags.append("")

        token_counts.append(
            sum(
                1
                for token in doc
                if not token.is_space
            )
        )

    df["dependency_template"] = dependency_templates
    df["dependency_tree_json"] = dependency_trees
    df["dependency_root_word"] = root_words
    df["dependency_root_pos"] = root_pos_tags
    df["dependency_token_count"] = token_counts

    df.to_csv(
        output_file,
        index=False
    )

    print(f"\nSaved output to: {output_file.resolve()}")

    # This needs to be a list, not a string.
    columns_to_show = [column]

    if "coarse_template" in df.columns:
        columns_to_show.append("coarse_template")

    columns_to_show.extend(
        [
            "dependency_template",
            "dependency_root_word",
            "dependency_root_pos",
        ]
    )

    print("\nSample results:\n")

    print(
        df[columns_to_show]
        .head(20)
        .to_string(index=False)
    )

    print("\nParses for first five rows:")

    # Correct placement of .head().
    sample = (
        df[column]
        .fillna("")
        .astype(str)
        .head(5)
        .tolist()
    )

    for text in sample:
        doc = nlp(text)
        print_dependency_parse(doc)


if __name__ == "__main__":
    main()