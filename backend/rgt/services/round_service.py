from datetime import datetime

from rgt.extensions import rgt_session
from rgt.models import (
    ClipNote,
    ClipReview,
    ComparisonAnswer,
    ComparisonResponse,
    ConstructRating,
    RoundAssignment,
    StudySession,
    Video,
)
from rgt.services.triad_service import pick_triad_for_session


def get_current_round(session_id):
    session = rgt_session.get(StudySession, session_id)
    if not session:
        return None
    return get_round_detail(session_id, session.current_round)


def get_round_detail(session_id, round_number):
    assignment = (
        rgt_session.query(RoundAssignment)
        .filter_by(session_id=session_id, round_number=round_number, skipped=False)
        .order_by(RoundAssignment.id.desc())
        .first()
    )
    if not assignment:
        return None

    triad_video_ids = [video.id for video in assignment.triad.videos]
    reviews = {
        review.video_id: review.to_dict()
        for review in rgt_session.query(ClipReview)
        .filter_by(round_assignment_id=assignment.id)
        .all()
    }
    notes = {
        note.video_id: note.to_dict()
        for note in rgt_session.query(ClipNote)
        .filter_by(round_assignment_id=assignment.id)
        .all()
    }
    comparison = (
        rgt_session.query(ComparisonResponse)
        .filter_by(round_assignment_id=assignment.id)
        .first()
    )
    answers = []
    if comparison:
        answers = (
            rgt_session.query(ComparisonAnswer)
            .filter_by(comparison_response_id=comparison.id)
            .all()
        )
    construct_ratings = (
        rgt_session.query(ConstructRating)
        .filter_by(round_assignment_id=assignment.id)
        .all()
    )

    return {
        "round_assignment": assignment.to_dict(),
        "clip_reviews": {
            str(video_id): reviews.get(video_id)
            for video_id in triad_video_ids
        },
        "clip_notes": {
            str(video_id): notes.get(video_id)
            for video_id in triad_video_ids
        },
        "comparison": comparison.to_dict() if comparison else None,
        "answers": [answer.to_dict() for answer in answers],
        "construct_ratings": {
            str(rating.video_id): rating.to_dict()
            for rating in construct_ratings
        },
    }


def pick_triad_for_session_assignment(session_id):
    session = rgt_session.get(StudySession, session_id)
    if not session:
        return None, "Session not found"

    existing = (
        rgt_session.query(RoundAssignment)
        .filter_by(
            session_id=session_id,
            round_number=session.current_round,
            skipped=False,
        )
        .first()
    )
    if existing:
        return existing.to_dict(), None

    triad = pick_triad_for_session(session)
    if triad is None:
        return None, "No available triads"

    triad.times_used += 1
    assignment = RoundAssignment(
        session_id=session_id,
        round_number=session.current_round,
        triad_id=triad.id,
        status="pending",
    )
    rgt_session.add(assignment)
    rgt_session.commit()
    return assignment.to_dict(), None


def mark_clip_reviewed(round_assignment_id, video_id):
    assignment = rgt_session.get(RoundAssignment, round_assignment_id)
    if not assignment:
        return None, "Round assignment not found"

    if video_id not in {video.id for video in assignment.triad.videos}:
        return None, "Video does not belong to this round's triad"

    existing = (
        rgt_session.query(ClipReview)
        .filter_by(round_assignment_id=round_assignment_id, video_id=video_id)
        .first()
    )
    if existing:
        return existing.to_dict(), None

    if assignment.status == "pending":
        assignment.status = "in_progress"

    review = ClipReview(
        round_assignment_id=round_assignment_id,
        video_id=video_id,
        reviewed=True,
    )
    rgt_session.add(review)
    rgt_session.commit()
    return review.to_dict(), None


def save_clip_note(round_assignment_id, video_id, note_text):
    assignment = rgt_session.get(RoundAssignment, round_assignment_id)
    if not assignment:
        return None, "Round assignment not found"
    if assignment.status == "completed":
        return None, "Round is already completed"
    if video_id not in {video.id for video in assignment.triad.videos}:
        return None, "Video does not belong to this round's triad"

    note = (
        rgt_session.query(ClipNote)
        .filter_by(round_assignment_id=round_assignment_id, video_id=video_id)
        .first()
    )
    if note:
        note.note_text = note_text
        note.updated_at = datetime.utcnow()
    else:
        note = ClipNote(
            round_assignment_id=round_assignment_id,
            video_id=video_id,
            note_text=note_text,
        )
        rgt_session.add(note)

    if assignment.status == "pending":
        assignment.status = "in_progress"

    rgt_session.commit()
    return note.to_dict(), None


def complete_round(session_id, round_number):
    assignment = (
        rgt_session.query(RoundAssignment)
        .filter_by(session_id=session_id, round_number=round_number, skipped=False)
        .order_by(RoundAssignment.id.desc())
        .first()
    )
    if not assignment:
        return None, "Round assignment not found"
    if assignment.status == "completed":
        return None, "Round is already completed"

    session = rgt_session.get(StudySession, session_id)
    if not session:
        return None, "Session not found"
    if session.current_round != round_number:
        return None, "Can only complete the current round"

    triad_video_ids = {video.id for video in assignment.triad.videos}
    reviewed_ids = {
        review.video_id
        for review in rgt_session.query(ClipReview)
        .filter_by(round_assignment_id=assignment.id)
        .all()
    }
    if not triad_video_ids.issubset(reviewed_ids):
        return None, "All three clips must be reviewed before completing the round"

    comparison = (
        rgt_session.query(ComparisonResponse)
        .filter_by(round_assignment_id=assignment.id)
        .first()
    )
    if not comparison:
        return None, "A comparison selection is required before completing the round"

    answer_count = (
        rgt_session.query(ComparisonAnswer)
        .filter_by(comparison_response_id=comparison.id)
        .count()
    )
    if answer_count == 0:
        return None, "At least one follow-up answer is required before completing the round"

    total_active = rgt_session.query(Video).filter_by(is_active=True).count()
    rated_ids = {
        rating.video_id
        for rating in rgt_session.query(ConstructRating)
        .filter_by(round_assignment_id=assignment.id)
        .all()
    }
    if len(rated_ids) < total_active:
        return None, f"All clips must be rated on the construct before completing ({len(rated_ids)}/{total_active})"

    assignment.status = "completed"
    assignment.completed_at = datetime.utcnow()

    if round_number < session.total_rounds:
        session.current_round = round_number + 1
        next_triad = pick_triad_for_session(session)
        if next_triad is None:
            return None, "No available triads for the next round"
        next_triad.times_used += 1
        rgt_session.add(
            RoundAssignment(
                session_id=session.id,
                round_number=session.current_round,
                triad_id=next_triad.id,
                status="pending",
            )
        )

    session.updated_at = datetime.utcnow()
    rgt_session.commit()
    return session.to_dict(), None
