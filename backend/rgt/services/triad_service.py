import random
from itertools import combinations

from rgt.extensions import rgt_session
from rgt.models import RoundAssignment, Triad, Video

# Creates video triads
def generate_triads_from_videos():
    videos = rgt_session.query(Video).filter_by(is_active=True).all()
    if len(videos) < 3:
        return [], "Need at least 3 active videos to generate triads"

    existing_triads = rgt_session.query(Triad).all()
    existing_combos = set()
    for t in existing_triads:
        key = tuple(sorted(v.id for v in t.videos))
        existing_combos.add(key)

    new_triads = []
    for combo in combinations(videos, 3):
        key = tuple(sorted(v.id for v in combo))
        if key not in existing_combos:
            triad = Triad()
            triad.videos = list(combo)
            rgt_session.add(triad)
            new_triads.append(triad)

    rgt_session.commit()

    # Refresh to get ids
    return [t.to_dict() for t in new_triads], None


def pick_triad_for_session(session):
    assignments = (
        rgt_session.query(RoundAssignment)
        .filter_by(session_id=session.id)
        .all()
    )
    used_triad_ids = [row.triad_id for row in assignments]
    seen_video_ids = {
        video.id
        for assignment in assignments
        if not assignment.skipped and assignment.triad
        for video in assignment.triad.videos
    }
    active_video_ids = {
        video.id
        for video in rgt_session.query(Video).filter_by(is_active=True).all()
    }
    unseen_video_ids = active_video_ids - seen_video_ids

    query = rgt_session.query(Triad)
    if used_triad_ids:
        query = query.filter(~Triad.id.in_(used_triad_ids))

    available = query.all()
    if not available:
        return None

    # Prefer triads that cover the most clips this participant has not seen yet.
    # Randomize within the best coverage/usage group so early rounds do not
    # always start with the first generated combination.
    scored = [
        (len({video.id for video in triad.videos} & unseen_video_ids), triad)
        for triad in available
    ]
    best_coverage = max(score for score, _ in scored)
    coverage_candidates = [
        triad for score, triad in scored if score == best_coverage
    ]
    min_used = min(triad.times_used or 0 for triad in coverage_candidates)
    candidates = [
        triad for triad in coverage_candidates if (triad.times_used or 0) == min_used
    ]
    return random.choice(candidates)
