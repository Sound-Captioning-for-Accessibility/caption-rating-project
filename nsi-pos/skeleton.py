"""
skeleton.py — caption -> POS skeleton (fine + coarse), standalone.

    from skeleton import Skeletonizer
    sk = Skeletonizer()                      # loads en_core_web_sm (or trf)
    sk.fine("[door creaking]")               # -> "NOUN VERB-Part"
    sk.coarse("[door creaking]")             # -> "NOUN VERB"
    sk.both("(the phone rings)")             # -> ("the NOUN VERB-Fin", "DET NOUN VERB")
    sk.tags("[door creaking]", "fine")       # -> ("NOUN", "VERB-Part")   (tuple for edit distance)

Fine skeleton keeps the verb-inflection distinction spaCy's UPOS throws away
(VERB-Fin "creaks" vs VERB-Part "creaking" vs VERB-Inf), function words and
punctuation literal, other content words -> UPOS. Coarse skeleton is bare UPOS.

Needs:  pip install spacy && python -m spacy download en_core_web_sm
"""

from __future__ import annotations
import re
import spacy

FUNCTION_POS = {"DET", "ADP", "CCONJ", "SCONJ", "PRON", "PART", "AUX"}

# Music symbols kept consistent with CaptionUtil.SPECIAL_CHARS (mirrored here so
# importing CaptionUtil — which loads ML models at import — isn't required). If
# you refactor, lift SPECIAL_CHARS / MUSIC_SYMBOLS into a shared constants module
# that both this file and CaptionUtil import.
MUSIC_SYMBOLS = "♩♪♫♬♭♮♯"
_MUSIC_GLYPHS = MUSIC_SYMBOLS
_STRIP = "[](){}<>" + _MUSIC_GLYPHS + " \t"
_LABEL_RE = re.compile(r"^\s*([A-Z][A-Za-z0-9 .'#\-]{0,30}?)\s*:\s+(.*)$")

# NSI lives inside paired delimiters [], (), {}, <>, or flanked by music symbols.
# <i>/<b> formatting tags are stripped first (matching CaptionUtil.tag_pattern)
# so they aren't mistaken for <> NSI.
_HTML_TAG_RE = re.compile(r"</?[ib]>", re.IGNORECASE)
_BRACKET_RE = re.compile(r"\[([^\[\]]*)\]|\(([^()]*)\)|\{([^{}]*)\}|<([^<>]*)>")
_MUSIC_RE = re.compile(r"[%s][^%s]*[%s]?" % (MUSIC_SYMBOLS, MUSIC_SYMBOLS, MUSIC_SYMBOLS))

# Timecodes embedded in real NSI (e.g. "inaudible 00:05:37") ride along into the
# extracted span. CaptionUtil.remove_time_bold_italics only uses this pattern to
# DROP pure-timecode rows, never to scrub timecodes from kept captions — so we
# reuse the SAME pattern here as a scrub. Kept consistent with CaptionUtil.
_TIME_RE = re.compile(r"\b\d{1,2}\s*:\s*\d{1,2}(?:\s*[:]\d+)*(?:\s*(?:AM|PM|am|pm))?\b")
# Leaked line/index numbers like "232 sighs heavily" are NOT timecodes (no colon).
# Strip standalone runs of >=2 digits, which protects small in-caption counts
# ("3 knocks") while removing index/timecode debris.
_LONGNUM_RE = re.compile(r"\b\d{2,}\b")


def clean_nsi(text: str, strip_long_numbers: bool = True) -> str:
    """Scrub timecode / numeric debris from an NSI span before skeletonizing,
    so the skeleton and min_zipf don't ingest NUM tokens. Timecodes always go;
    standalone 2+-digit numbers go when strip_long_numbers (default True)."""
    text = _TIME_RE.sub(" ", text)
    if strip_long_numbers:
        text = _LONGNUM_RE.sub(" ", text)
    return re.sub(r"\s+", " ", text).strip()


def extract_nsi(caption: str, clean: bool = True) -> list:
    """From a caption that may MIX speech and NSI, return only the NSI spans,
    as a list of inner-text strings (delimiters removed, original case kept).

        "BOY: Dude, classic. (SCHOOL BELL RINGING)"  -> ["SCHOOL BELL RINGING"]
        "[THUNDER CRASHES] I'm scared."              -> ["THUNDER CRASHES"]
        "[DOG BARKS] Hi? [PHONE RINGS]"              -> ["DOG BARKS", "PHONE RINGS"]
        "Dude, classic."                             -> []   (no NSI)

    NSI = content inside [], (), {}, <>, or flanked by music symbols. Unbracketed
    dialogue and leading SPEAKER: labels fall outside the spans and are dropped.
    A caption with several NSI spans yields several entries — explode those to
    one row each if your unit of analysis is the individual NSI event.
    """
    text = _HTML_TAG_RE.sub(" ", caption)
    spans = []

    def _grab(m):
        inner = next(g for g in m.groups() if g is not None)
        inner = inner.strip().strip(MUSIC_SYMBOLS).strip()
        if clean:
            inner = clean_nsi(inner)
        if inner:
            spans.append(inner)
        return " "                      # remove the span so the music pass won't re-see it

    remainder = _BRACKET_RE.sub(_grab, text)
    for m in _MUSIC_RE.finditer(remainder):
        inner = m.group(0).strip(MUSIC_SYMBOLS + " \t").strip()
        if clean:
            inner = clean_nsi(inner)
        if inner:
            spans.append(inner)
    return spans


def peel(caption: str) -> str:
    """Strip the orthographic wrapper (brackets, music glyphs, a leading
    SPEAKER: label) from a SINGLE NSI span and return the inner text. For a
    caption that mixes speech and NSI, call extract_nsi() first — peel() alone
    does not remove dialogue, only the surrounding wrapper of one span."""
    inner = caption.strip().strip(_STRIP)
    m = _LABEL_RE.match(inner)
    if m:
        inner = m.group(2).strip()
    return inner


# spaCy (esp. trf) mis-tags present participles as NOUN in the terse SFX frame
# ("sign buzzing", "Door closing", "church bell ringing"). In this domain an
# -ing content word is almost always a participle, so a NOUN-tagged -ing token
# is retagged VERB-Part — EXCEPT these lexicalized -ing nouns. Editable; scan
# your own NOUN-tagged -ing tokens once and extend it if you spot more.
ING_NOUN_STOPLIST = {
    "recording", "building", "ceiling", "morning", "evening", "lightning",
    "warning", "feeling", "meeting", "wedding", "ending", "opening",
    "beginning", "offering", "clothing", "drawing", "painting", "crossing",
    "greeting", "something", "nothing", "anything", "everything", "thing",
    "being", "king", "ring", "wing", "string", "spring", "swing", "sting",
    "awning", "earring", "sibling", "icing", "casing", "siding",
}


def is_ing_participle(token) -> bool:
    """True if a NOUN-tagged token is really a present participle that should be
    VERB-Part (the common SFX mis-tag), excluding lexicalized -ing nouns."""
    w = token.lower_
    return (token.pos_ == "NOUN" and w.endswith("ing") and len(w) >= 5
            and w not in ING_NOUN_STOPLIST)


class Skeletonizer:
    def __init__(self, model: str = "en_core_web_sm", nlp=None, fix_ing: bool = True):
        self.nlp = nlp if nlp is not None else spacy.load(model)
        self.fix_ing = fix_ing          # retag NOUN-tagged -ing participles as VERB-Part

    def _doc(self, caption: str):
        # lowercase: capitalization is a separate (shell) signal and ALL-CAPS
        # captions push the tagger toward spurious PROPN readings.
        return self.nlp(peel(caption).lower())

    def fine(self, caption: str) -> str:
        out = []
        for t in self._doc(caption):
            if t.is_space:
                continue
            if t.is_punct:
                out.append(t.text)
            elif t.pos_ in FUNCTION_POS:
                out.append(t.lemma_ if t.pos_ == "AUX" else t.lower_)
            elif t.pos_ == "VERB":
                vf = t.morph.get("VerbForm")
                out.append(f"VERB-{vf[0] if vf else t.tag_}")
            elif self.fix_ing and is_ing_participle(t):
                out.append("VERB-Part")
            else:
                out.append(t.pos_)
        return " ".join(out)

    def coarse(self, caption: str) -> str:
        return " ".join(
            t.pos_ for t in self._doc(caption) if not (t.is_space or t.is_punct)
        )

    def inflected(self, caption: str) -> str:
        """Bare UPOS like `coarse`, EXCEPT verbs keep their inflection
        (VERB-Fin / VERB-Part / VERB-Inf ...). Function words collapse to their
        POS tag (he/she/it -> PRON, the/a -> DET), so referent and
        definite/indefinite differences are invariant, while the
        nominal/gerundive/finite axis that carries style is preserved.
        Punctuation is kept literally (comma / period / semicolon ...): the
        specific mark is a style signal, not content, so a comma separator vs a
        semicolon, or a terminal period vs none, stays visible to the edit
        distance. This is the resolution to feed the edit distance."""
        out = []
        for t in self._doc(caption):
            if t.is_space:
                continue
            if t.is_punct:
                out.append(t.text)
            elif t.pos_ == "VERB":
                vf = t.morph.get("VerbForm")
                out.append(f"VERB-{vf[0] if vf else t.tag_}")
            elif self.fix_ing and is_ing_participle(t):
                out.append("VERB-Part")
            else:
                out.append(t.pos_)
        return " ".join(out)

    def construction(self, caption: str) -> str:
        """Head-based construction class of a SINGLE NSI span, for stratifying
        the sample so every form-family is represented:
          nominal / gerundive / finite_clause / bare_verb / interjection /
          modifier_only / other / empty.
        Uses the dependency ROOT + its VerbForm (the parse-dependent signal that
        most benefits from en_core_web_trf over _sm)."""
        doc = self._doc(caption)
        root = next((t for t in doc if t.dep_ == "ROOT"), None)
        if root is None:
            return "empty"
        has_subj = any(c.dep_ in ("nsubj", "nsubjpass") for c in doc)
        vf = root.morph.get("VerbForm")
        if self.fix_ing and is_ing_participle(root):
            return "gerundive"          # NOUN-tagged -ing head is really a participle
        if root.pos_ in ("NOUN", "PROPN"):
            return "nominal"
        if "Part" in vf or "Ger" in vf or root.tag_ == "VBG":
            return "gerundive"          # participle wins over the finite test
        if root.pos_ in ("VERB", "AUX"):
            return "finite_clause" if has_subj else "bare_verb"
        if root.pos_ == "INTJ":
            return "interjection"
        if root.pos_ in ("ADJ", "ADV"):
            return "modifier_only"
        return "other"

    def both(self, caption: str) -> tuple:
        return self.fine(caption), self.coarse(caption)

    _RES = {"fine": fine, "coarse": coarse, "inflected": inflected}

    def tags(self, caption: str, resolution: str = "inflected") -> tuple:
        """Skeleton of a SINGLE NSI span as a tuple of tokens — ready for edit
        distance. resolution: 'inflected' (default), 'fine', or 'coarse'.
        Assumes `caption` is one NSI unit; for a mixed/multi-NSI caption use
        nsi_tags(), which runs extract_nsi() first."""
        return tuple(self._RES[resolution](self, caption).split())

    # -- caption-level: extract NSI first, then skeletonize each span ---------

    def nsi_skeletons(self, caption: str, resolution: str = "inflected") -> list:
        """Extract the NSI span(s) from a (possibly mixed) caption and return a
        skeleton string per span. Speech and speaker labels are dropped.
        Empty list if the caption has no NSI."""
        fn = self._RES[resolution]
        return [fn(self, span) for span in extract_nsi(caption)]

    def nsi_tags(self, caption: str, resolution: str = "inflected") -> list:
        """Like nsi_skeletons but each span as a token tuple (for edit distance).
        One entry per NSI span — explode to one row each if the NSI event is your
        unit of analysis."""
        return [tuple(s.split()) for s in self.nsi_skeletons(caption, resolution)]


def explode_nsi(df, skeletonizer=None, resolution: str = "inflected",
                caption_col: str = "caption", log: bool = False):
    """Explode a caption DataFrame to ONE ROW PER NSI SPAN.

    A caption with several NSI spans becomes several rows; a caption with no NSI
    contributes none. Original columns (file, start_time, end_time, ...) are
    carried onto every row produced from that caption. Adds:
        nsi        — the span's inner text (speech / speaker labels removed)
        nsi_index  — 0-based position of the span within its source caption
        n_nsi      — how many spans that source caption had
    and, when a Skeletonizer is passed:
        skeleton        — the skeleton string at `resolution`
        skeleton_tags   — that skeleton as a token tuple (for edit distance)

    This also tightens NSI_filter: a caption kept only for a stray ':' (a
    SPEAKER: label, no bracketed sound) yields zero spans and drops out here.
    """
    import pandas as pd
    if df.empty:
        return df.copy()
    rows = []
    for _, row in df.iterrows():
        spans = extract_nsi(str(row[caption_col]))
        for i, span in enumerate(spans):
            rec = row.to_dict()
            rec["nsi"] = span
            rec["nsi_index"] = i
            rec["n_nsi"] = len(spans)
            if skeletonizer is not None:
                s = getattr(skeletonizer, resolution)(span)
                rec["skeleton"] = s
                rec["skeleton_tags"] = tuple(s.split())
            rows.append(rec)
    out = pd.DataFrame(rows).reset_index(drop=True)
    if log:
        multi = int((out["n_nsi"] > 1).sum()) if not out.empty else 0
        print(f"{len(df)} captions -> {len(out)} NSI spans "
              f"({multi} rows from multi-NSI captions)")
    return out


if __name__ == "__main__":
    # extract_nsi needs no model — exercise it directly
    print("--- extract_nsi (speech stripped, NSI kept) ---")
    for cap in ["BOY: Dude, classic. (SCHOOL BELL RINGING)",
                "[THUNDER CRASHES] I'm scared.",
                "[DOG BARKS] Hi? [PHONE RINGS]",
                "<i>[door creaks]</i>",
                "MAN: Hello. ♪ upbeat music ♪",
                "Dude, classic."]:
        print(f"  {cap:44} -> {extract_nsi(cap)}")

    sk = Skeletonizer()
    print("\n--- skeletons ---")
    for cap in ["[door creaks]", "[door creaking]", "(the phone rings)",
                "[a door creaks]", "[Door creaks.]",
                "[door slams, footsteps approaching]", "[sighs]",
                "BOY: Dude, classic. (SCHOOL BELL RINGING)"]:
        print(f"{cap:44} nsi={sk.nsi_skeletons(cap)}")
