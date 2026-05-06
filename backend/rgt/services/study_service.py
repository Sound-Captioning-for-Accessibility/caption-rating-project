from datetime import datetime

from rgt.extensions import rgt_session
from rgt.models import Participant, StudySession, Video, OverallRating, RoundAssignment

PHASE_ORDER = [
    "overall_ratings",
    "triadic_elicitation",
    "review_ratings",
    "additional_constructs",
    "completed",
]


def get_session(session_id):
    session = rgt_session.get(StudySession, session_id)
    if not session:
        return None
    return session.to_dict()


def start_or_resume_session(token, total_rounds=7):
    participant = rgt_session.query(Participant).filter_by(token=token).first()
    if not participant:
        participant = Participant(token=token)
        rgt_session.add(participant)
        rgt_session.flush()

    active = (
        rgt_session.query(StudySession)
        .filter_by(participant_id=participant.id, status="active")
        .first()
    )
    if active:
        rgt_session.commit()
        return active.to_dict()

    session = StudySession(
        participant_id=participant.id,
        total_rounds=total_rounds,
        current_phase="overall_ratings",
        status="active",
    )
    rgt_session.add(session)
    rgt_session.commit()
    return session.to_dict()

# Move to next part of study
def advance_phase(session_id):
    session = rgt_session.get(StudySession, session_id)
    if not session:
        return None, "Session not found"
    if session.status == "completed":
        return None, "Session already completed"

    current_idx = PHASE_ORDER.index(session.current_phase)
    if current_idx >= len(PHASE_ORDER) - 1:
        return None, "Already at the final phase"

    # Prerequisite checks
    if session.current_phase == "overall_ratings":
        active_count = rgt_session.query(Video).filter_by(is_active=True).count()
        rated_count = (
            rgt_session.query(OverallRating)
            .filter_by(session_id=session_id)
            .count()
        )
        if rated_count < active_count:
            return None, f"All active videos must be rated ({rated_count}/{active_count})"

    elif session.current_phase == "triadic_elicitation":
        rounds = (
            rgt_session.query(RoundAssignment)
            .filter_by(session_id=session_id)
            .all()
        )
        incomplete = [r for r in rounds if r.status != "completed"]
        if incomplete:
            return None, f"{len(incomplete)} round(s) still incomplete"

    # Continue
    next_phase = PHASE_ORDER[current_idx + 1]
    session.current_phase = next_phase
    session.updated_at = datetime.utcnow()

    if next_phase == "completed":
        session.status = "completed"
        session.completed_at = datetime.utcnow()

    rgt_session.commit()
    return session.to_dict(), None
