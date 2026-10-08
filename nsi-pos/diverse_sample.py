"""
diverse_sample.py — pick a diverse, tail-covering subset of NSI captions.

Pipeline (continues from skeleton.explode_nsi):
  1. explode_nsi(df, sk)  -> one row per NSI span, with 'nsi' + 'skeleton_tags'
  2. add_features(df)     -> adds 'min_zipf' (rarest word) and 'length'
  3. build form cache     -> normalized edit-distance matrix over UNIQUE skeletons
  4. farthest_first_fused -> ~k spans spanning form + lexical + length, incl. tails

Sampling unit is the SPAN (caption), not the skeleton: min-Zipf and length vary
within a skeleton, so they only do work at the span level. The skeleton matrix is
reused as a form-distance *cache* — each span looks up its form distance there and
adds its own |Δzipf| / |Δlength|, so no spans×spans matrix is ever built.

Deps: numpy, pandas, editdistance, wordfreq  (skeleton.py for the upstream steps)
"""

from __future__ import annotations
import re
import numpy as np
import editdistance
from wordfreq import zipf_frequency

_WORD_RE = re.compile(r"[a-z]+(?:[-'][a-z]+)*")   # keeps hyphen/apostrophe compounds


# --- features ----------------------------------------------------------------

def min_zipf(text: str) -> float:
    """Zipf of the RAREST word in the caption (lower = rarer / more marked).
    OOV words (onomatopoeia like 'fwoomp', exotic terms) return 0.0 from
    wordfreq, so they correctly read as maximally rare. min over the few words
    self-selects the marked term and ignores common words without averaging.
    No caption / no words -> 0.0."""
    toks = _WORD_RE.findall(str(text).lower())
    if not toks:
        return 0.0
    return min(zipf_frequency(w, "en") for w in toks)


def add_features(df, nsi_col: str = "nsi", skel_col: str = "skeleton_tags"):
    """Add 'min_zipf' (from the words) and 'length' (# skeleton tokens) columns."""
    df = df.copy()
    df["min_zipf"] = df[nsi_col].apply(min_zipf)
    df["length"] = df[skel_col].apply(len)
    return df


# --- form-distance cache (your function + max-length normalization) ----------

def normalized_edit_distance_matrix(skeletons) -> np.ndarray:
    """Pairwise length-normalized edit distance over skeleton token-tuples.
    d(a,b) = editdistance(a,b) / max(len(a), len(b))  ->  [0, 1], unit costs.
    `skeletons`: sequence of tuples (e.g. df['skeleton_tags'].unique())."""
    seqs = list(skeletons)
    n = len(seqs)
    D = np.zeros((n, n), dtype=np.float32)
    for i in range(n):
        for j in range(i + 1, n):
            denom = max(len(seqs[i]), len(seqs[j]))
            d = editdistance.eval(seqs[i], seqs[j]) / denom if denom else 0.0
            D[i, j] = D[j, i] = d
    return D


# --- helpers -----------------------------------------------------------------

def _unit(x: np.ndarray) -> np.ndarray:
    """Min-max scale to [0,1] so a scalar feature's |Δ| is comparable to the
    [0,1] form distance. Constant column -> all zeros (contributes nothing)."""
    x = x.astype(float)
    lo, hi = np.nanmin(x), np.nanmax(x)
    return np.zeros_like(x) if hi <= lo else (x - lo) / (hi - lo)


# --- fused farthest-first traversal (coverage incl. tails) -------------------

def farthest_first_fused(
    df, D_skel, skel_list, k,
    w_form: float = 1.0, w_zipf: float = 1.0, w_len: float = 1.0,
    skel_col: str = "skeleton_tags", zipf_col: str = "min_zipf", len_col: str = "length",
    strata_col: str | None = None, seed: str = "medoid",
    quality=None, quality_strength: float = 0.0,
):
    """Greedy k-center over SPANS with a fused distance:

        d(a,b) = w_form * D_skel[skel(a), skel(b)]          # form, cached [0,1]
               + w_zipf * |zipf01(a) - zipf01(b)|           # lexical rareness
               + w_len  * |len01(a)  - len01(b)|            # verbosity

    Returns positional indices into `df` of the selected spans (selection order).
    seed='medoid' starts near the center (central skeleton, median zipf) so early
    picks spread through the bulk before reaching outliers. If strata_col is set,
    runs independently within each group and allocates k ~evenly across groups
    (so minority form-families aren't buried).

    NOTE: farthest-first reaches for isolated points first — genuine tails AND
    parse-garbage skeletons. Hand-clean the rare-skeleton tail before sampling.
    """
    skel_pos = {s: i for i, s in enumerate(skel_list)}
    # Direct dict lookup rather than Series.map(dict): with tuple keys, some
    # pandas versions turn the dict into a MultiIndexed Series and raise
    # "Reindexing only valid with uniquely valued Index objects". This avoids it.
    idx = np.array([skel_pos[t] for t in df[skel_col]], dtype=int)   # span -> skeleton row
    z01 = _unit(df[zipf_col].to_numpy())
    l01 = _unit(df[len_col].to_numpy())

    # Quality multiplier: pick argmax(min_dist * q**strength) instead of argmax(min_dist),
    # so frequent (typical) skeletons are preferred and the rare tail is damped.
    # strength=0 -> q**0 = 1 -> pure farthest-first (unchanged). Higher -> more
    # frequency bias. q is floored so rare items are damped, never fully excluded.
    if quality is None or quality_strength == 0:
        qpow = np.ones(len(df))
    else:
        q = _unit(np.asarray(quality, float))        # -> [0,1]
        q = 0.05 + 0.95 * q                          # floor so tail stays reachable
        qpow = q ** quality_strength

    def dist_from(r, members=None):
        """Fused distance from span r to all spans (or to `members` subset)."""
        f = D_skel[idx[r]][idx]                           # gather form dists, (n,)
        d = w_form * f + w_zipf * np.abs(z01[r] - z01) + w_len * np.abs(l01[r] - l01)
        return d if members is None else d[members]

    def _one_group(members: np.ndarray, kk: int) -> list:
        kk = min(kk, len(members))
        if kk <= 0:
            return []
        if seed == "medoid":
            # central skeleton among this group, then its median-zipf span.
            # Reduce to UNIQUE skeletons first so the gather is bounded by the
            # skeleton count (<= len(skel_list)), never n_spans x n_spans.
            sub_sk = idx[members]
            uniq = np.unique(sub_sk)
            cost = D_skel[np.ix_(uniq, uniq)].mean(axis=1)   # (n_uniq,), n_uniq <= n_skeletons
            central_sk = int(uniq[cost.argmin()])
            cand = members[sub_sk == central_sk]
            s0 = int(cand[np.argsort(z01[cand])[len(cand) // 2]])
        else:
            s0 = int(members[0])
        chosen = [s0]
        mind = dist_from(s0, members)
        qm = qpow[members]
        for _ in range(kk - 1):
            j = int((mind * qm).argmax())            # distance tempered by quality
            chosen.append(int(members[j]))
            np.minimum(mind, dist_from(chosen[-1], members), out=mind)
        return chosen

    n = len(df)
    if strata_col is None:
        return _one_group(np.arange(n), k)

    # stratified: ~even allocation across groups, capped by group size, with
    # leftover from small groups redistributed to groups that can still give more
    groups = {g: np.where(df[strata_col].to_numpy() == g)[0]
              for g in df[strata_col].unique()}
    order = sorted(groups, key=lambda g: len(groups[g]))     # smallest first
    picks, remaining, left = {}, len(groups), k
    for g in order:
        share = min(len(groups[g]), -(-left // remaining))   # ceil div
        picks[g] = share
        left -= share
        remaining -= 1
    out = []
    for g, members in groups.items():
        out.extend(_one_group(members, picks[g]))
    return out[:k]


# --- one-call orchestration ---------------------------------------------------

def select_diverse_captions(
    df, k: int = 500, weights=(1.0, 1.0, 1.0),
    skel_col: str = "skeleton_tags", nsi_col: str = "nsi",
    strata_col: str | None = None, dedup: bool = True,
    freq_strength: float = 0.0,
):
    """df: exploded NSI spans (from explode_nsi, with skeleton_tags + nsi).
    Returns a sub-DataFrame of ~k diverse spans (form + lexical + length).
    weights = (form, zipf, length).

    freq_strength (0 = off) biases picks toward FREQUENT skeleton forms to damp
    tail-heaviness: 0 is pure coverage (every pick as different as possible,
    tails included); ~1-3 progressively prefers common/typical forms. Skeleton
    frequency is counted over the FULL df (before the nsi-dedup), so it reflects
    how common each form is in the corpus, not in the deduped set."""
    # skeleton-form frequency over the whole corpus (pre-dedup), log-damped.
    counts = df[skel_col].value_counts()
    count_map = dict(zip(counts.index, counts.values))   # dict, not .map (tuple-key safe)

    work = df.drop_duplicates(subset=nsi_col).reset_index(drop=True) if dedup else df.reset_index(drop=True)
    work = add_features(work, nsi_col=nsi_col, skel_col=skel_col)
    skel_list = list(work[skel_col].unique())
    D_skel = normalized_edit_distance_matrix(skel_list)
    quality = np.array([np.log1p(count_map.get(t, 1)) for t in work[skel_col]])
    sel = farthest_first_fused(
        work, D_skel, skel_list, k,
        w_form=weights[0], w_zipf=weights[1], w_len=weights[2],
        skel_col=skel_col, strata_col=strata_col,
        quality=quality, quality_strength=freq_strength,
    )
    return work.iloc[sel].reset_index(drop=True)


if __name__ == "__main__":
    # --- component tests that need no spaCy model ---
    print("min_zipf:",
          f"'door creaks'={min_zipf('door creaks'):.2f}",
          f"| 'portcullis reverberates'={min_zipf('portcullis reverberates'):.2f}",
          f"| 'fwoomp'={min_zipf('fwoomp'):.2f}")

    sk_list = [("NOUN", "VERB-Fin"), ("ADJ", "NOUN", "VERB-Fin"),
               ("NOUN",), ("NOUN", "VERB-Part"), ("INTJ",)]
    D = normalized_edit_distance_matrix(sk_list)
    print("\nnormalized skeleton distances (should be in [0,1]):")
    print(np.round(D, 3))

    import pandas as pd
    # spans: note two DIFFERENT captions share skeleton (NOUN, VERB-Fin) but
    # differ in min_zipf -> they must stay distinguishable (span-level point)
    df = pd.DataFrame({
        "nsi": ["door creaks", "portcullis reverberates", "loud door creaks",
                "boom", "wind howling", "fwoomp"],
        "skeleton_tags": [("NOUN", "VERB-Fin"), ("NOUN", "VERB-Fin"),
                          ("ADJ", "NOUN", "VERB-Fin"), ("NOUN",),
                          ("NOUN", "VERB-Part"), ("NOUN",)],
    })
    out = select_diverse_captions(df, k=4)
    print("\nselected 4 diverse spans:")
    print(out[["nsi", "skeleton_tags", "min_zipf", "length"]].to_string(index=False))
