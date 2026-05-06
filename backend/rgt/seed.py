"""
Seed the RGT database with sample videos and generate triads.

Usage (from the backend directory):
    python -m rgt.seed
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import rgt.models  # noqa: E402, F401
from rgt.extensions import (  # noqa: E402
    create_rgt_tables,
    init_rgt_standalone,
    rgt_session,
)
from rgt.models import Video  # noqa: E402
from rgt.services.triad_service import generate_triads_from_videos  # noqa: E402

SAMPLE_VIDEOS = [
    {
        "title": "Introduction to Web Accessibility",
        "youtube_id": "20SHvU2PKsM",
        "caption_type": "professional",
    },
    {
        "title": "Understanding Screen Readers",
        "youtube_id": "dEbl5jvLKGQ",
        "caption_type": "auto",
    },
    {
        "title": "Captioning Best Practices",
        "youtube_id": "RaSCH3yU5pU",
        "caption_type": "professional",
    },
    {
        "title": "Audio Description Fundamentals",
        "youtube_id": "O7j4_aP8dWA",
        "caption_type": "auto",
    },
    {
        "title": "Sign Language Interpreting in Media",
        "youtube_id": "fNkSJiQ0_ZY",
        "caption_type": "community",
    },
    {
        "title": "Real-Time Captioning Demo",
        "youtube_id": "3GGt-DVJjmk",
        "caption_type": "auto",
    },
]


def seed():
    init_rgt_standalone()
    create_rgt_tables()

    added = 0
    for v in SAMPLE_VIDEOS:
        exists = rgt_session.query(Video).filter_by(title=v["title"]).first()
        if not exists:
            rgt_session.add(Video(**v))
            added += 1
    rgt_session.commit()
    print(f"Videos: {added} added, {len(SAMPLE_VIDEOS) - added} already existed")

    total_videos = rgt_session.query(Video).filter_by(is_active=True).count()
    print(f"Active videos in DB: {total_videos}")

    new_triads, error = generate_triads_from_videos()
    if error:
        print(f"Triad generation skipped: {error}")
    else:
        print(f"Triads generated: {len(new_triads)}")

    from rgt.models import Triad
    total_triads = rgt_session.query(Triad).count()
    print(f"Total triads in DB: {total_triads}")
    print("Seed complete.")


if __name__ == "__main__":
    seed()
