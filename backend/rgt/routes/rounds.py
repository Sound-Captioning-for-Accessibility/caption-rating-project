from flask import jsonify

from rgt.services.round_service import complete_round, get_round_detail


def register(bp):

    @bp.route("/study/sessions/<int:session_id>/rounds/<int:round_number>", methods=["GET"])
    def rounds_detail(session_id, round_number):
        result = get_round_detail(session_id, round_number)
        if result is None:
            return jsonify({"error": "Round not found"}), 404
        return jsonify(result), 200

    @bp.route("/study/sessions/<int:session_id>/rounds/<int:round_number>/complete", methods=["POST"])
    def rounds_complete_by_number(session_id, round_number):
        result, error = complete_round(session_id, round_number)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"session": result, **result}), 200

    @bp.route("/rounds/<int:round_assignment_id>/complete", methods=["POST"])
    def rounds_complete(round_assignment_id):
        detail = None
        # Backward-compatible endpoint for the old JSX flow.
        from rgt.extensions import rgt_session
        from rgt.models import RoundAssignment

        assignment = rgt_session.get(RoundAssignment, round_assignment_id)
        if assignment:
            detail = (assignment.session_id, assignment.round_number)
        if not detail:
            return jsonify({"error": "Round assignment not found"}), 404

        result, error = complete_round(*detail)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"session": result, **result}), 200
