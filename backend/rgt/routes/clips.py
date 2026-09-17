from flask import jsonify, request

from rgt.extensions import rgt_session
from rgt.models import ClipNote
from rgt.services.round_service import mark_clip_reviewed, save_clip_note


def register(bp):

    @bp.route("/rounds/<int:ra_id>/clips/<int:video_id>/review", methods=["POST"])
    def clips_review(ra_id, video_id):
        result, error = mark_clip_reviewed(ra_id, video_id)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"clip_review": result, **result}), 200

    @bp.route("/rounds/<int:ra_id>/clips/<int:video_id>/notes", methods=["GET"])
    def clips_get_notes(ra_id, video_id):
        note = (
            rgt_session.query(ClipNote)
            .filter_by(round_assignment_id=ra_id, video_id=video_id)
            .first()
        )
        return jsonify({"clip_note": note.to_dict() if note else None}), 200

    @bp.route("/rounds/<int:ra_id>/clips/<int:video_id>/notes", methods=["PUT"])
    def clips_save_notes(ra_id, video_id):
        data = request.get_json(silent=True) or {}
        result, error = save_clip_note(ra_id, video_id, data.get("note_text", ""))
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"clip_note": result, **result}), 200
