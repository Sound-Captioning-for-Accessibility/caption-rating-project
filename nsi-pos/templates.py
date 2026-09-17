import re
import pandas as pd
import spacy

df = pd.read_csv("annotations.csv")

nlp = spacy.load("en_core_web_sm")

nsi = df[df["general_nsi"] == 1].copy()

def extract_nsi(caption):
    caption = str(caption)

    matches = re.findall(r"\[(.*?)\]|\((.*?)\)", caption)

    extracted = []
    for bracket, paren in matches:
        text = bracket if bracket else paren
        text = text.strip()

        if text:
            extracted.append(text)

    return " ".join(extracted)

def coarse_template(text):
    doc = nlp(text.lower())
    tags = []

    for token in doc:
        if not token.is_punct and not token.is_space:
            tags.append(token.pos_)
    
    return " + ".join(tags)

def fine_template(text):
    doc = nlp(text.lower())
    tags = []

    for token in doc:
        if not token.is_punct and not token.is_space:
            tags.append(token.tag_)

    return " + ".join(tags)

nsi["nsi_text"] = nsi["caption"].apply(extract_nsi)

nsi = nsi[nsi["nsi_text"].str.len() > 0].copy()

nsi["coarse_template"] = nsi["nsi_text"].apply(coarse_template)
nsi["fine_template"] = nsi["nsi_text"].apply(fine_template)

coarse_count = nsi["coarse_template"].value_counts().reset_index()
coarse_count.columns = ["coarse_template", "count"]

fine_count = nsi["fine_template"].value_counts().reset_index()
fine_count.columns =["fine_template", "count"]

nsi.to_csv("nsi_with_pos_templates.csv", index=False)
coarse_count.to_csv("coarse_template_counts.csv", index=False)
fine_count.to_csv("fine_template_counts.csv", index=False)

