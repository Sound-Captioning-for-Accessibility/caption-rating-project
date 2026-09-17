from datetime import datetime

from rgt.extensions import rgt_session
from rgt.models import (
    OverallRating,
    Participant,
    PHASES,
    RoundAssignment,
    StudySession,
    Video,
)
from rgt.services.triad_service import pick_triad_for_session


def get_session(session_id):
    return get_session_status(session_id)


def get_session_status(session_id):
    session = rgt_session.get(StudySession, session_id)
    if not session:
        return None

    rounds = (
        rgt_session.query(RoundAssignment)
        .filter_by(session_id=session_id)
        .order_by(RoundAssignment.round_number.asc(), RoundAssignment.id.asc())
        .all()
    )
    overall = rgt_session.query(OverallRating).filter_by(session_id=session_id).all()

    return {
        **session.to_dict(),
        "rounds": [r.to_dict() for r in rounds],
        "overall_ratings": [r.to_dict() for r in overall],
    }


def start_or_resume_session(token, total_rounds=8):
    try:
        participant = rgt_session.query(Participant).filter_by(token=token).first()
        if not participant:
            participant = Participant(token=token)
            rgt_session.add(participant)
            rgt_session.flush()
    except Exception:
        rgt_session.rollback()
        participant = rgt_session.query(Participant).filter_by(token=token).first()
        if not participant:
            raise

    active = (
        rgt_session.query(StudySession)
        .filter_by(participant_id=participant.id, status="active")
        .first()
    )
    if active:
        if active.current_phase == "triadic_elicitation":
            _ensure_current_round_assigned(active)
        rgt_session.commit()
        return active.to_dict()

    session = StudySession(
        participant_id=participant.id,
        total_rounds=total_rounds,
        current_round=1,
        current_phase="overall_ratings",
        status="active",
    )
    rgt_session.add(session)
    rgt_session.commit()
    return session.to_dict()


def advance_phase(session_id):
    session = rgt_session.get(StudySession, session_id)
    if not session:
        return None, "Session not found"
    if session.status == "completed":
        return None, "Session already completed"
    if session.current_phase not in PHASES:
        return None, f"Unknown phase: {session.current_phase}"

    current_idx = PHASES.index(session.current_phase)
    if current_idx >= len(PHASES) - 1:
        return None, "Study is already completed"

    if session.current_phase == "overall_ratings":
        rated_count = (
            rgt_session.query(OverallRating)
            .filter_by(session_id=session_id)
            .count()
        )
        if rated_count < 3:
            return None, f"Please rate at least 3 clips before continuing ({rated_count}/3)"

    if session.current_phase == "review_ratings":
        total_active = rgt_session.query(Video).filter_by(is_active=True).count()
        rated_count = (
            rgt_session.query(OverallRating)
            .filter_by(session_id=session_id)
            .count()
        )
        if rated_count < total_active:
            return None, f"All clips must be rated before completing ({rated_count}/{total_active})"

    next_phase = PHASES[current_idx + 1]
    session.current_phase = next_phase
    session.updated_at = datetime.utcnow()

    if next_phase == "triadic_elicitation":
        _ensure_current_round_assigned(session)

    if next_phase == "completed":
        session.status = "completed"
        session.completed_at = datetime.utcnow()

    rgt_session.commit()
    return session.to_dict(), None


def skip_triad(session_id, round_number):
    session = rgt_session.get(StudySession, session_id)
    if not session:
        return None, "Session not found"
    if session.current_phase != "triadic_elicitation":
        return None, "Triads can only be skipped during triadic elicitation"
    if session.current_round != round_number:
        return None, "Can only skip the current round"

    assignment = (
        rgt_session.query(RoundAssignment)
        .filter_by(session_id=session_id, round_number=round_number, skipped=False)
        .first()
    )
    if not assignment:
        return None, "Round assignment not found"
    if assignment.status == "completed":
        return None, "Cannot skip a completed round"

    assignment.skipped = True
    assignment.status = "skipped"
    rgt_session.flush()

    replacement_triad = pick_triad_for_session(session)
    if replacement_triad is None:
        rgt_session.commit()
        return None, "No alternative triads available"

    replacement = RoundAssignment(
        session_id=session.id,
        round_number=round_number,
        triad_id=replacement_triad.id,
        status="pending",
    )
    replacement_triad.times_used += 1
    rgt_session.add(replacement)
    rgt_session.commit()
    return replacement.to_dict(), None


def _ensure_current_round_assigned(session):
    existing = (
        rgt_session.query(RoundAssignment)
        .filter_by(
            session_id=session.id,
            round_number=session.current_round,
            skipped=False,
        )
        .first()
    )
    if not existing:
        _assign_round(session, session.current_round)


def _assign_round(session, round_number):
    triad = pick_triad_for_session(session)
    if triad is None:
        raise ValueError("No available triads to assign. Ensure videos and triads are seeded.")

    triad.times_used += 1
    assignment = RoundAssignment(
        session_id=session.id,
        round_number=round_number,
        triad_id=triad.id,
        status="pending",
    )
    rgt_session.add(assignment)
    rgt_session.flush()
    return assignment
