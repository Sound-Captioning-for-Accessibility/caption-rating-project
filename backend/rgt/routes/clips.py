from flask import jsonify, request

from rgt.extensions import rgt_session
from rgt.models import ClipNote, ClipReview, RoundAssignment


def register(bp):

    @bp.route("/rounds/<int:ra_id>/clips/<int:video_id>/review", methods=["POST"])
    def clips_review(ra_id, video_id):
        assignment = rgt_session.get(RoundAssignment, ra_id)
        if not assignment:
            return jsonify({"error": "Round assignment not found"}), 404

        existing = (
            rgt_session.query(ClipReview)
            .filter_by(round_assignment_id=ra_id, video_id=video_id)
            .first()
        )
        if existing:
            return jsonify(existing.to_dict()), 200

        review = ClipReview(
            round_assignment_id=ra_id,
            video_id=video_id,
            reviewed=True,
        )
        rgt_session.add(review)
        rgt_session.commit()
        return jsonify(review.to_dict()), 201

    @bp.route("/rounds/<int:ra_id>/clips/<int:video_id>/notes", methods=["GET"])
    def clips_get_notes(ra_id, video_id):
        note = (
            rgt_session.query(ClipNote)
            .filter_by(round_assignment_id=ra_id, video_id=video_id)
            .first()
        )
        if not note:
            return jsonify({
                "note_text": "",
                "round_assignment_id": ra_id,
                "video_id": video_id,
            }), 200
        return jsonify(note.to_dict()), 200

    @bp.route("/rounds/<int:ra_id>/clips/<int:video_id>/notes", methods=["PUT"])
    def clips_save_notes(ra_id, video_id):
        data = request.get_json(silent=True) or {}
        note_text = data.get("note_text", "")

        note = (
            rgt_session.query(ClipNote)
            .filter_by(round_assignment_id=ra_id, video_id=video_id)
            .first()
        )
        if note:
            note.note_text = note_text
        else:
            note = ClipNote(
                round_assignment_id=ra_id,
                video_id=video_id,
                note_text=note_text,
            )
            rgt_session.add(note)
        rgt_session.commit()
        return jsonify(note.to_dict()), 200
