from flask import jsonify, request

from rgt.services.rating_service import (
    create_additional_construct,
    delete_additional_construct,
    get_additional_constructs,
    get_construct_ratings,
    get_overall_ratings,
    save_construct_rating,
    save_construct_ratings,
    save_overall_rating,
    save_overall_ratings,
    update_additional_construct,
)


def register(bp):

    # Overall ratings

    @bp.route("/sessions/<int:session_id>/overall-ratings", methods=["GET"])
    def ratings_overall_get(session_id):
        from rgt.extensions import rgt_session
        from rgt.models import StudySession, Video

        if not rgt_session.get(StudySession, session_id):
            return jsonify({"error": "Session not found"}), 404
        ratings = get_overall_ratings(session_id)

        total = rgt_session.query(Video).filter_by(is_active=True).count()
        return jsonify({
            "ratings": ratings,
            "rated_count": len(ratings),
            "total_clips": total,
            "all_rated": len(ratings) >= total,
        }), 200

    @bp.route("/sessions/<int:session_id>/overall-ratings", methods=["PUT"])
    def ratings_overall_save(session_id):
        data = request.get_json(silent=True) or {}
        if "ratings" in data:
            result, error = save_overall_ratings(session_id, data.get("ratings", []))
            response = {"ratings": result}
        else:
            result, error = save_overall_rating(
                session_id,
                data.get("video_id"),
                data.get("rating"),
                data.get("revised_rating"),
            )
            response = {"overall_rating": result}
        if error:
            return jsonify({"error": error}), 400
        return jsonify(response), 200

    # Construct ratings

    @bp.route("/rounds/<int:ra_id>/construct-ratings", methods=["GET"])
    def ratings_construct_get(ra_id):
        return jsonify({"ratings": get_construct_ratings(ra_id)}), 200

    @bp.route("/rounds/<int:ra_id>/construct-ratings", methods=["PUT"])
    def ratings_construct_save(ra_id):
        data = request.get_json(silent=True) or {}
        if "ratings" in data:
            result, error = save_construct_ratings(ra_id, data.get("ratings", []))
            response = {"ratings": result}
        else:
            result, error = save_construct_rating(
                ra_id,
                data.get("video_id"),
                data.get("rating"),
            )
            response = {"construct_rating": result}
        if error:
            return jsonify({"error": error}), 400
        return jsonify(response), 200

    # Additional constructs

    @bp.route("/sessions/<int:session_id>/additional-constructs", methods=["GET"])
    def additional_constructs_list(session_id):
        return jsonify({"constructs": get_additional_constructs(session_id)}), 200

    @bp.route("/sessions/<int:session_id>/additional-constructs", methods=["POST"])
    def additional_constructs_create(session_id):
        data = request.get_json(silent=True) or {}
        result, error = create_additional_construct(session_id, data)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"construct": result, **result}), 201

    @bp.route("/additional-constructs/<int:construct_id>", methods=["PUT"])
    def additional_constructs_update(construct_id):
        data = request.get_json(silent=True) or {}
        result, error = update_additional_construct(construct_id, data)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"construct": result, **result}), 200

    @bp.route("/additional-constructs/<int:construct_id>", methods=["DELETE"])
    @bp.route("/sessions/<int:session_id>/additional-constructs/<int:construct_id>", methods=["DELETE"])
    def additional_constructs_delete(construct_id, session_id=None):
        error = delete_additional_construct(construct_id)
        if error:
            return jsonify({"error": error}), 404
        return jsonify({"deleted": True}), 200
