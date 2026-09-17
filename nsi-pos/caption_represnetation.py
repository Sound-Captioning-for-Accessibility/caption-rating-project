# caption_representation.py

import pandas as pd
import numpy as np

from wordfreq import zipf_frequency

from scipy.sparse import hstack, csr_matrix, save_npz

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.preprocessing import StandardScaler


# ============================================================
# CONFIG
# ============================================================

FILE_PATH = "nsi_with_pos_templates.csv"

NSI_COLUMNS = [
    "general_nsi",
    "music_nsi",
    "environmental_nsi",
    "extraspeech_nsi",
    "additionalnarrative_nsi",
    "quotedspeech_nsi",
    "misc_nsi",
    "nonenglish_captions"
]


# ============================================================
# STEP 1: LOAD DATASET
# ============================================================

df = pd.read_csv(FILE_PATH)

print("Original dataset shape:", df.shape)
print("\nColumns:")
print(df.columns.tolist())


# ============================================================
# STEP 2: CLEAN DATA
# ============================================================

# Remove rows with missing captions
df = df.dropna(
    subset=["caption"]
).copy()

# Convert captions to strings
df["caption"] = df["caption"].astype(str)

# Remove surrounding whitespace
df["caption"] = df["caption"].str.strip()

# Remove empty captions
df = df[
    df["caption"] != ""
].copy()

# Reset index
df = df.reset_index(drop=True)

# Unique ID for every caption
df["caption_id"] = np.arange(
    len(df)
)

print(
    "\nCleaned dataset shape:",
    df.shape
)


# ============================================================
# STEP 3: CREATE LENGTH FEATURES
# ============================================================

df["word_count"] = (
    df["caption"]
    .str.split()
    .str.len()
)

df["char_count"] = (
    df["caption"]
    .str.len()
)


def average_word_length(text):

    words = text.split()

    if len(words) == 0:
        return 0.0

    return np.mean(
        [len(word) for word in words]
    )


df["avg_word_length"] = (
    df["caption"]
    .apply(average_word_length)
)


# ============================================================
# STEP 4: PREPARE POS SEQUENCES
# ============================================================

# Your dataset already contains coarse POS templates such as:
# "ADJ + NOUN"
# "NOUN + VERB"
#
# Convert:
# "ADJ + NOUN"
# into:
# "ADJ NOUN"
#
# so CountVectorizer can easily generate n-grams.

df["pos_sequence"] = (
    df["coarse_template"]
    .fillna("")
    .astype(str)
    .str.replace(
        " + ",
        " ",
        regex=False
    )
    .str.strip()
)

print("\nExample POS sequences:")

print(
    df[
        [
            "caption",
            "coarse_template",
            "pos_sequence"
        ]
    ].head(10)
)


# ============================================================
# STEP 5: CREATE POS BIGRAM + TRIGRAM FEATURES
# ============================================================

print(
    "\nCreating POS bigram/trigram features..."
)

pos_vectorizer = CountVectorizer(
    tokenizer=str.split,
    token_pattern=None,
    lowercase=False,
    ngram_range=(2, 3)
)

X_pos = pos_vectorizer.fit_transform(
    df["pos_sequence"]
)

pos_feature_names = (
    pos_vectorizer
    .get_feature_names_out()
)

print(
    "POS feature matrix shape:",
    X_pos.shape
)

print(
    "Number of POS n-gram features:",
    len(pos_feature_names)
)


# ============================================================
# STEP 6: CREATE LEXICAL FREQUENCY FEATURE
# ============================================================

def mean_lexical_frequency(text):

    words = (
        text
        .lower()
        .split()
    )

    if len(words) == 0:
        return 0.0

    frequencies = []

    for word in words:

        frequency = zipf_frequency(
            word,
            "en"
        )

        frequencies.append(
            frequency
        )

    return np.mean(
        frequencies
    )


print(
    "\nCalculating lexical frequency..."
)

df["mean_lexical_frequency"] = (
    df["caption"]
    .apply(mean_lexical_frequency)
)


# ============================================================
# STEP 7: PREPARE NSI FEATURES
# ============================================================

print("\nNSI counts:")

for column in NSI_COLUMNS:

    print(
        f"\n{column}:"
    )

    print(
        df[column]
        .value_counts(
            dropna=False
        )
        .sort_index()
    )


# Fill missing NSI values with 0
# and force numeric type

df[NSI_COLUMNS] = (
    df[NSI_COLUMNS]
    .fillna(0)
    .astype(float)
)


# These columns are already binary features.
# No OneHotEncoder is needed.

X_nsi = csr_matrix(
    df[NSI_COLUMNS].to_numpy(
        dtype=float
    )
)

print(
    "\nNSI feature matrix shape:",
    X_nsi.shape
)


# ============================================================
# STEP 8: SCALE NUMERICAL FEATURES
# ============================================================

numeric_columns = [
    "word_count",
    "char_count",
    "avg_word_length",
    "mean_lexical_frequency"
]


numeric_scaler = StandardScaler()

X_numeric = (
    numeric_scaler
    .fit_transform(
        df[numeric_columns]
    )
)

X_numeric = csr_matrix(
    X_numeric
)

print(
    "Numeric feature matrix shape:",
    X_numeric.shape
)


# ============================================================
# STEP 9: COMBINE ALL FEATURES
# ============================================================

X = hstack(
    [
        X_pos,
        X_numeric,
        X_nsi
    ]
).tocsr()


# ============================================================
# STEP 10: CREATE FEATURE NAMES + SAVE
# ============================================================

all_feature_names = (

    list(
        pos_feature_names
    )

    +

    numeric_columns

    +

    NSI_COLUMNS
)


assert (
    len(all_feature_names)
    ==
    X.shape[1]
)


print(
    "\n================================"
)

print(
    "FINAL REPRESENTATION"
)

print(
    "================================"
)

print(
    "Number of captions:",
    X.shape[0]
)

print(
    "Number of features:",
    X.shape[1]
)

print(
    "Matrix shape:",
    X.shape
)


# ------------------------------------------------------------
# SAVE METADATA
# ------------------------------------------------------------

df.to_csv(
    "caption_features_metadata.csv",
    index=False
)


# ------------------------------------------------------------
# SAVE REPRESENTATION MATRIX
# ------------------------------------------------------------

save_npz(
    "caption_representation_X.npz",
    X
)


# ------------------------------------------------------------
# SAVE FEATURE NAMES
# ------------------------------------------------------------

pd.DataFrame(
    {
        "feature_name":
            all_feature_names
    }
).to_csv(
    "caption_representation_feature_names.csv",
    index=False
)


print(
    "\nSaved files:"
)

print(
    "caption_features_metadata.csv"
)

print(
    "caption_representation_X.npz"
)

print(
    "caption_representation_feature_names.csv"
)
