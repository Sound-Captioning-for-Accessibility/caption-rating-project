from datetime import datetime

from rgt.extensions import rgt_session
from rgt.models import (
    AdditionalConstruct,
    ConstructRating,
    OverallRating,
    RoundAssignment,
    StudySession,
)


# ── Overall ratings ──────────────────────────────────────────────────────────

def get_overall_ratings(session_id):
    rows = rgt_session.query(OverallRating).filter_by(session_id=session_id).all()
    return [r.to_dict() for r in rows]


def save_overall_ratings(session_id, ratings_data):
    """Create or update overall ratings for the session.

    *ratings_data* is a list of dicts: [{video_id, rating, revised_rating?}]
    """
    session = rgt_session.get(StudySession, session_id)
    if not session:
        return None, "Session not found"

    for item in ratings_data:
        video_id = item.get("video_id")
        if video_id is None:
            continue
        existing = (
            rgt_session.query(OverallRating)
            .filter_by(session_id=session_id, video_id=video_id)
            .first()
        )
        if existing:
            existing.rating = item["rating"]
            if "revised_rating" in item:
                existing.revised_rating = item["revised_rating"]
            existing.updated_at = datetime.utcnow()
        else:
            rating = OverallRating(
                session_id=session_id,
                video_id=video_id,
                rating=item["rating"],
            )
            rgt_session.add(rating)

    rgt_session.commit()
    return get_overall_ratings(session_id), None


# ── Construct ratings ────────────────────────────────────────────────────────

def get_construct_ratings(round_assignment_id):
    rows = (
        rgt_session.query(ConstructRating)
        .filter_by(round_assignment_id=round_assignment_id)
        .all()
    )
    return [r.to_dict() for r in rows]


def save_construct_ratings(round_assignment_id, ratings_data):
    """Create or update construct ratings for a round.

    *ratings_data* is a list of dicts: [{video_id, rating}]
    """
    assignment = rgt_session.get(RoundAssignment, round_assignment_id)
    if not assignment:
        return None, "Round assignment not found"

    for item in ratings_data:
        video_id = item.get("video_id")
        if video_id is None:
            continue
        existing = (
            rgt_session.query(ConstructRating)
            .filter_by(round_assignment_id=round_assignment_id, video_id=video_id)
            .first()
        )
        if existing:
            existing.rating = item["rating"]
            existing.updated_at = datetime.utcnow()
        else:
            cr = ConstructRating(
                round_assignment_id=round_assignment_id,
                video_id=video_id,
                rating=item["rating"],
            )
            rgt_session.add(cr)

    rgt_session.commit()
    return get_construct_ratings(round_assignment_id), None


# ── Additional constructs ────────────────────────────────────────────────────

def get_additional_constructs(session_id):
    rows = (
        rgt_session.query(AdditionalConstruct)
        .filter_by(session_id=session_id)
        .all()
    )
    return [c.to_dict() for c in rows]


def create_additional_construct(session_id, data):
    session = rgt_session.get(StudySession, session_id)
    if not session:
        return None, "Session not found"
    pole_one = data.get("pole_one")
    pole_two = data.get("pole_two")
    if not pole_one or not pole_two:
        return None, "pole_one and pole_two are required"

    ac = AdditionalConstruct(
        session_id=session_id,
        pole_one=pole_one,
        pole_two=pole_two,
        notes=data.get("notes"),
    )
    rgt_session.add(ac)
    rgt_session.commit()
    return ac.to_dict(), None


def update_additional_construct(construct_id, data):
    ac = rgt_session.get(AdditionalConstruct, construct_id)
    if not ac:
        return None, "Additional construct not found"
    if "pole_one" in data:
        ac.pole_one = data["pole_one"]
    if "pole_two" in data:
        ac.pole_two = data["pole_two"]
    if "notes" in data:
        ac.notes = data["notes"]
    rgt_session.commit()
    return ac.to_dict(), None


def delete_additional_construct(construct_id):
    ac = rgt_session.get(AdditionalConstruct, construct_id)
    if not ac:
        return "Additional construct not found"
    rgt_session.delete(ac)
    rgt_session.commit()
    return None
