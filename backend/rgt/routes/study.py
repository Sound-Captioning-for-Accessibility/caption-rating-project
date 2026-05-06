from flask import jsonify, request

from rgt.services.round_service import get_current_round, pick_triad_for_session
from rgt.services.study_service import advance_phase, get_session, start_or_resume_session


def register(bp):

    @bp.route("/study/start", methods=["POST"])
    def study_start():
        data = request.get_json(silent=True) or {}
        token = data.get("token")
        if not token:
            return jsonify({"error": "token is required"}), 400
        total_rounds = data.get("total_rounds", 7)
        try:
            result = start_or_resume_session(token, total_rounds)
            return jsonify(result), 200
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

    @bp.route("/study/sessions/<int:session_id>", methods=["GET"])
    def study_get_session(session_id):
        result = get_session(session_id)
        if not result:
            return jsonify({"error": "Session not found"}), 404
        return jsonify(result), 200

    @bp.route("/study/sessions/<int:session_id>/advance-phase", methods=["POST"])
    def study_advance_phase(session_id):
        result, error = advance_phase(session_id)
        if error:
            return jsonify({"error": error}), 400
        return jsonify(result), 200

    @bp.route("/study/sessions/<int:session_id>/rounds/current", methods=["GET"])
    def study_current_round(session_id):
        result = get_current_round(session_id)
        if result is None:
            return jsonify({"error": "No current round found"}), 404
        return jsonify(result), 200

    @bp.route("/study/sessions/<int:session_id>/rounds/assign", methods=["POST"])
    def study_assign_round(session_id):
        result, error = pick_triad_for_session(session_id)
        if error:
            return jsonify({"error": error}), 400
        return jsonify(result), 201
