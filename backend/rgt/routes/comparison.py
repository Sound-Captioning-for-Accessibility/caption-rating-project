from flask import jsonify, request

from rgt.extensions import rgt_session
from rgt.models import ComparisonAnswer, ComparisonResponse, RoundAssignment


def register(bp):

    @bp.route("/rounds/<int:ra_id>/comparison", methods=["GET"])
    def comparison_get(ra_id):
        resp = (
            rgt_session.query(ComparisonResponse)
            .filter_by(round_assignment_id=ra_id)
            .first()
        )
        if not resp:
            return jsonify({"error": "No comparison response found"}), 404
        return jsonify(resp.to_dict()), 200

    @bp.route("/rounds/<int:ra_id>/comparison", methods=["PUT"])
    def comparison_save(ra_id):
        assignment = rgt_session.get(RoundAssignment, ra_id)
        if not assignment:
            return jsonify({"error": "Round assignment not found"}), 404

        data = request.get_json(silent=True) or {}
        v1 = data.get("selected_video_one_id")
        v2 = data.get("selected_video_two_id")
        if v1 is None or v2 is None:
            return jsonify({"error": "selected_video_one_id and selected_video_two_id are required"}), 400

        resp = (
            rgt_session.query(ComparisonResponse)
            .filter_by(round_assignment_id=ra_id)
            .first()
        )
        if resp:
            resp.selected_video_one_id = v1
            resp.selected_video_two_id = v2
        else:
            resp = ComparisonResponse(
                round_assignment_id=ra_id,
                selected_video_one_id=v1,
                selected_video_two_id=v2,
            )
            rgt_session.add(resp)
        rgt_session.commit()
        return jsonify(resp.to_dict()), 200

    @bp.route("/rounds/<int:ra_id>/answers", methods=["GET"])
    def answers_get(ra_id):
        resp = (
            rgt_session.query(ComparisonResponse)
            .filter_by(round_assignment_id=ra_id)
            .first()
        )
        if not resp:
            return jsonify([]), 200
        answers = (
            rgt_session.query(ComparisonAnswer)
            .filter_by(comparison_response_id=resp.id)
            .all()
        )
        return jsonify([a.to_dict() for a in answers]), 200

    @bp.route("/rounds/<int:ra_id>/answers", methods=["PUT"])
    def answers_save(ra_id):
        resp = (
            rgt_session.query(ComparisonResponse)
            .filter_by(round_assignment_id=ra_id)
            .first()
        )
        if not resp:
            return jsonify({"error": "Create the comparison response first"}), 400

        data = request.get_json(silent=True) or {}
        items = data.get("answers", [])

        rgt_session.query(ComparisonAnswer).filter_by(
            comparison_response_id=resp.id
        ).delete()

        for item in items:
            qk = item.get("question_key")
            at = item.get("answer_text")
            if not qk or at is None:
                continue
            answer = ComparisonAnswer(
                comparison_response_id=resp.id,
                question_key=qk,
                answer_text=at,
            )
            rgt_session.add(answer)

        rgt_session.commit()

        answers = (
            rgt_session.query(ComparisonAnswer)
            .filter_by(comparison_response_id=resp.id)
            .all()
        )
        return jsonify([a.to_dict() for a in answers]), 200
