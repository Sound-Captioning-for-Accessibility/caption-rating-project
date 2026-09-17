"""
Seed the RGT database with sample videos and generate triads.

Usage (from the backend directory):
    python -m rgt.seed
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import rgt.models
from rgt.extensions import (
    create_rgt_tables,
    init_rgt_standalone,
    rgt_session,
)
from rgt.models import Video
from rgt.services.triad_service import generate_triads_from_videos

def _youtube_clip(title, youtube_id):
    return {
        "title": title,
        "youtube_id": youtube_id,
        "filename": youtube_id,
        "url": f"https://www.youtube.com/embed/{youtube_id}",
        "is_active": True,
    }


SAMPLE_VIDEOS = [
    _youtube_clip("Clip 1", "-2U0Ivkn2Ds"),
    _youtube_clip("Clip 2", "-E7K5D_OGvU"),
    _youtube_clip("Clip 3", "-JgRD66yB5w"),
    _youtube_clip("Clip 4", "-TFK1_cD35k"),
    _youtube_clip("Clip 5", "-VS2g39-9qc"),
    _youtube_clip("Clip 6", "-gN42l7BAjY"),
    _youtube_clip("Clip 7", "-qCanuYrR0g"),
    _youtube_clip("Clip 8", "0HNL0ebtt94"),
    _youtube_clip("Clip 9", "0O4NGKHyW90"),
    _youtube_clip("Clip 10", "0imbM1PHlxM"),
    _youtube_clip("Clip 11", "0s4e037VTFI"),
    _youtube_clip("Clip 12", "0uFvZJvmOvQ"),
]


def seed(clear=False):
    init_rgt_standalone()
    create_rgt_tables()

    if clear:
        from rgt.models import (
            AdditionalConstruct, ComparisonAnswer, ComparisonResponse,
            ConstructRating, ClipNote, ClipReview, OverallRating,
            RoundAssignment, StudySession, Participant, Triad, triad_videos,
        )
        print("Clearing existing data...")
        rgt_session.query(AdditionalConstruct).delete()
        rgt_session.query(ComparisonAnswer).delete()
        rgt_session.query(ComparisonResponse).delete()
        rgt_session.query(ConstructRating).delete()
        rgt_session.query(ClipNote).delete()
        rgt_session.query(ClipReview).delete()
        rgt_session.query(OverallRating).delete()
        rgt_session.query(RoundAssignment).delete()
        rgt_session.query(StudySession).delete()
        rgt_session.query(Participant).delete()
        rgt_session.execute(triad_videos.delete())
        rgt_session.query(Triad).delete()
        rgt_session.query(Video).delete()
        rgt_session.commit()
        print("All data cleared.")

    added = 0
    for v in SAMPLE_VIDEOS:
        exists = rgt_session.query(Video).filter_by(youtube_id=v["youtube_id"]).first()
        if not exists:
            rgt_session.add(Video(**v))
            added += 1
        else:
            for field, value in v.items():
                setattr(exists, field, value)
    rgt_session.commit()
    print(f"Videos: {added} added, {len(SAMPLE_VIDEOS) - added} already existed")

    total_videos = rgt_session.query(Video).filter_by(is_active=True).count()
    print(f"Active videos in DB: {total_videos}")

    new_triads, error = generate_triads_from_videos()
    if error:
        print(f"Triad generation skipped: {error}")
    else:
        print(f"Triads generated: {len(new_triads)}")

    total_triads = rgt_session.query(Triad).count()
    print(f"Total triads in DB: {total_triads}")
    print("Seed complete.")


if __name__ == "__main__":
    clear = "--clear" in sys.argv
    seed(clear)
