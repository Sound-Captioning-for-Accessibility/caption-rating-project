import random
from datetime import datetime

from rgt.extensions import rgt_session
from rgt.models import (
    ClipReview,
    ComparisonAnswer,
    ComparisonResponse,
    ConstructRating,
    RoundAssignment,
    StudySession,
    Triad,
)

# Return most recent round for session
def get_current_round(session_id):
    assignment = (
        rgt_session.query(RoundAssignment)
        .filter_by(session_id=session_id, status="in_progress")
        .order_by(RoundAssignment.round_number.desc())
        .first()
    )
    if not assignment:
        return None
    return assignment.to_dict()

# Assign triad
def pick_triad_for_session(session_id):
    session = rgt_session.get(StudySession, session_id)
    if not session:
        return None, "Session not found"

    used_triad_ids = [
        r.triad_id
        for r in rgt_session.query(RoundAssignment)
        .filter_by(session_id=session_id)
        .all()
    ]

    query = rgt_session.query(Triad)
    if used_triad_ids:
        query = query.filter(~Triad.id.in_(used_triad_ids))
    available = query.order_by(Triad.times_used.asc()).all()

    if not available:
        return None, "No available triads"

    min_used = available[0].times_used
    candidates = [t for t in available if t.times_used == min_used]
    selected = random.choice(candidates)

    round_number = len(used_triad_ids) + 1
    assignment = RoundAssignment(
        session_id=session_id,
        round_number=round_number,
        triad_id=selected.id,
    )
    selected.times_used += 1
    rgt_session.add(assignment)
    rgt_session.commit()
    return assignment.to_dict(), None

# Check for completeness
def complete_round(round_assignment_id):
    assignment = rgt_session.get(RoundAssignment, round_assignment_id)
    if not assignment:
        return None, "Round assignment not found"
    if assignment.status == "completed":
        return None, "Round already completed"

    reviews = (
        rgt_session.query(ClipReview)
        .filter_by(round_assignment_id=round_assignment_id)
        .count()
    )
    if reviews < 3:
        return None, f"Only {reviews}/3 clips reviewed"

    comparison = (
        rgt_session.query(ComparisonResponse)
        .filter_by(round_assignment_id=round_assignment_id)
        .first()
    )
    if not comparison:
        return None, "Comparison response missing"

    answers = (
        rgt_session.query(ComparisonAnswer)
        .filter_by(comparison_response_id=comparison.id)
        .count()
    )
    if answers == 0:
        return None, "Comparison answers missing"

    construct_count = (
        rgt_session.query(ConstructRating)
        .filter_by(round_assignment_id=round_assignment_id)
        .count()
    )
    if construct_count < 3:
        return None, f"Only {construct_count}/3 construct ratings"

    assignment.status = "completed"
    assignment.completed_at = datetime.utcnow()

    session = rgt_session.get(StudySession, assignment.session_id)
    completed_count = (
        rgt_session.query(RoundAssignment)
        .filter_by(session_id=session.id, status="completed")
        .count()
    ) + 1  # include this one being completed now

    if completed_count < session.total_rounds:
        session.current_round = completed_count + 1

    session.updated_at = datetime.utcnow()
    rgt_session.commit()
    return assignment.to_dict(), None
