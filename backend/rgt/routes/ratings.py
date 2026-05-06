from flask import jsonify, request

from rgt.services.rating_service import (
    create_additional_construct,
    delete_additional_construct,
    get_additional_constructs,
    get_construct_ratings,
    get_overall_ratings,
    save_construct_ratings,
    save_overall_ratings,
    update_additional_construct,
)


def register(bp):

    # ── Overall ratings ──────────────────────────────────────────────────

    @bp.route("/sessions/<int:session_id>/overall-ratings", methods=["GET"])
    def ratings_overall_get(session_id):
        return jsonify(get_overall_ratings(session_id)), 200

    @bp.route("/sessions/<int:session_id>/overall-ratings", methods=["PUT"])
    def ratings_overall_save(session_id):
        data = request.get_json(silent=True) or {}
        result, error = save_overall_ratings(session_id, data.get("ratings", []))
        if error:
            return jsonify({"error": error}), 400
        return jsonify(result), 200

    # ── Construct ratings ────────────────────────────────────────────────

    @bp.route("/rounds/<int:ra_id>/construct-ratings", methods=["GET"])
    def ratings_construct_get(ra_id):
        return jsonify(get_construct_ratings(ra_id)), 200

    @bp.route("/rounds/<int:ra_id>/construct-ratings", methods=["PUT"])
    def ratings_construct_save(ra_id):
        data = request.get_json(silent=True) or {}
        result, error = save_construct_ratings(ra_id, data.get("ratings", []))
        if error:
            return jsonify({"error": error}), 400
        return jsonify(result), 200

    # ── Additional constructs ────────────────────────────────────────────

    @bp.route("/sessions/<int:session_id>/additional-constructs", methods=["GET"])
    def additional_constructs_list(session_id):
        return jsonify(get_additional_constructs(session_id)), 200

    @bp.route("/sessions/<int:session_id>/additional-constructs", methods=["POST"])
    def additional_constructs_create(session_id):
        data = request.get_json(silent=True) or {}
        result, error = create_additional_construct(session_id, data)
        if error:
            return jsonify({"error": error}), 400
        return jsonify(result), 201

    @bp.route("/additional-constructs/<int:construct_id>", methods=["PUT"])
    def additional_constructs_update(construct_id):
        data = request.get_json(silent=True) or {}
        result, error = update_additional_construct(construct_id, data)
        if error:
            return jsonify({"error": error}), 400
        return jsonify(result), 200

    @bp.route("/additional-constructs/<int:construct_id>", methods=["DELETE"])
    def additional_constructs_delete(construct_id):
        error = delete_additional_construct(construct_id)
        if error:
            return jsonify({"error": error}), 404
        return jsonify({"message": "Deleted"}), 200
