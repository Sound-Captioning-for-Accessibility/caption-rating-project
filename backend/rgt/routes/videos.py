from flask import jsonify

from rgt.extensions import rgt_session
from rgt.models import ComparisonAnswer, RoundAssignment, StudySession, Video


def register(bp):

    @bp.route("/videos", methods=["GET"])
    def list_active_videos():
        videos = (
            rgt_session.query(Video)
            .filter_by(is_active=True)
            .order_by(Video.id.asc())
            .all()
        )
        return jsonify({"videos": [video.to_dict() for video in videos]}), 200

    @bp.route("/sessions/<int:session_id>/elicited-constructs", methods=["GET"])
    def elicited_constructs(session_id):
        session = rgt_session.get(StudySession, session_id)
        if not session:
            return jsonify({"error": "Session not found"}), 404

        rounds = (
            rgt_session.query(RoundAssignment)
            .filter_by(session_id=session_id, status="completed")
            .order_by(RoundAssignment.round_number.asc())
            .all()
        )

        constructs = []
        for assignment in rounds:
            response = assignment.comparison_responses[0] if assignment.comparison_responses else None
            answers = {}
            if response:
                rows = (
                    rgt_session.query(ComparisonAnswer)
                    .filter_by(comparison_response_id=response.id)
                    .all()
                )
                answers = {answer.question_key: answer.answer_text for answer in rows}

            pole_one = answers.get("alike_phrase", "")
            pole_two = answers.get("contrast_phrase", "")
            if pole_one or pole_two:
                constructs.append({
                    "round_number": assignment.round_number,
                    "pole_one": pole_one,
                    "pole_two": pole_two,
                })

        return jsonify({"constructs": constructs}), 200
