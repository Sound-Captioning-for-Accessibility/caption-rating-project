from itertools import combinations

from rgt.extensions import rgt_session
from rgt.models import Triad, Video

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
