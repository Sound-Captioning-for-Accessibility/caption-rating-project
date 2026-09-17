from datetime import datetime

from flask import jsonify, request

from rgt.extensions import rgt_session
from rgt.models import ComparisonAnswer, ComparisonResponse, RoundAssignment


def register(bp):

    @bp.route("/rounds/<int:ra_id>/comparison", methods=["GET"])
    def comparison_get(ra_id):
        response = (
            rgt_session.query(ComparisonResponse)
            .filter_by(round_assignment_id=ra_id)
            .first()
        )
        answers = []
        if response:
            answers = (
                rgt_session.query(ComparisonAnswer)
                .filter_by(comparison_response_id=response.id)
                .all()
            )
        return jsonify({
            "comparison": response.to_dict() if response else None,
            "answers": [answer.to_dict() for answer in answers],
        }), 200

    @bp.route("/rounds/<int:ra_id>/comparison", methods=["PUT"])
    def comparison_save(ra_id):
        assignment = rgt_session.get(RoundAssignment, ra_id)
        if not assignment:
            return jsonify({"error": "Round assignment not found"}), 404
        if assignment.status == "completed":
            return jsonify({"error": "Round is already completed"}), 400

        data = request.get_json(silent=True) or {}
        v1 = data.get("video_a_id", data.get("selected_video_one_id"))
        v2 = data.get("video_b_id", data.get("selected_video_two_id"))
        if v1 is None or v2 is None:
            return jsonify({"error": "video_a_id and video_b_id are required"}), 400
        if v1 == v2:
            return jsonify({"error": "Must select two different videos"}), 400

        triad_video_ids = {video.id for video in assignment.triad.videos}
        if v1 not in triad_video_ids or v2 not in triad_video_ids:
            return jsonify({"error": "Both videos must belong to this round's triad"}), 400

        v1, v2 = sorted([v1, v2])
        response = (
            rgt_session.query(ComparisonResponse)
            .filter_by(round_assignment_id=ra_id)
            .first()
        )
        if response:
            response.selected_video_one_id = v1
            response.selected_video_two_id = v2
            response.updated_at = datetime.utcnow()
        else:
            response = ComparisonResponse(
                round_assignment_id=ra_id,
                selected_video_one_id=v1,
                selected_video_two_id=v2,
            )
            rgt_session.add(response)

        if assignment.status == "pending":
            assignment.status = "in_progress"

        rgt_session.commit()
        return jsonify({"comparison": response.to_dict(), **response.to_dict()}), 200

    @bp.route("/rounds/<int:ra_id>/answers", methods=["GET"])
    def answers_get(ra_id):
        response = (
            rgt_session.query(ComparisonResponse)
            .filter_by(round_assignment_id=ra_id)
            .first()
        )
        if not response:
            return jsonify({"answers": []}), 200
        answers = (
            rgt_session.query(ComparisonAnswer)
            .filter_by(comparison_response_id=response.id)
            .all()
        )
        return jsonify({"answers": [answer.to_dict() for answer in answers]}), 200

    @bp.route("/rounds/<int:ra_id>/answers", methods=["PUT"])
    def answers_save(ra_id):
        response = (
            rgt_session.query(ComparisonResponse)
            .filter_by(round_assignment_id=ra_id)
            .first()
        )
        if not response:
            return jsonify({"error": "Create the comparison response first"}), 400

        data = request.get_json(silent=True) or {}
        if "answers" in data:
            rgt_session.query(ComparisonAnswer).filter_by(
                comparison_response_id=response.id
            ).delete()
            for item in data.get("answers", []):
                question_key = item.get("question_key")
                answer_text = item.get("answer_text")
                if question_key and answer_text is not None:
                    rgt_session.add(ComparisonAnswer(
                        comparison_response_id=response.id,
                        question_key=question_key,
                        answer_text=answer_text,
                    ))
        else:
            question_key = data.get("question_key")
            answer_text = data.get("answer_text")
            if not question_key or answer_text is None:
                return jsonify({"error": "question_key and answer_text are required"}), 400
            answer = (
                rgt_session.query(ComparisonAnswer)
                .filter_by(
                    comparison_response_id=response.id,
                    question_key=question_key,
                )
                .first()
            )
            if answer:
                answer.answer_text = answer_text
                answer.updated_at = datetime.utcnow()
            else:
                answer = ComparisonAnswer(
                    comparison_response_id=response.id,
                    question_key=question_key,
                    answer_text=answer_text,
                )
                rgt_session.add(answer)

        rgt_session.commit()
        answers = (
            rgt_session.query(ComparisonAnswer)
            .filter_by(comparison_response_id=response.id)
            .all()
        )
        payload = [answer.to_dict() for answer in answers]
        return jsonify({"answers": payload, "answer": payload[-1] if payload else None}), 200
