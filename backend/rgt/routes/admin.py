from flask import jsonify, request

from rgt.extensions import rgt_session
from rgt.models import (
    AdditionalConstruct,
    ComparisonAnswer,
    ComparisonResponse,
    ConstructRating,
    OverallRating,
    Participant,
    Triad,
    Video,
)
from rgt.services.triad_service import generate_triads_from_videos


def register(bp):
    # TODO: Add admin authentication

    # Videos CRUD

    @bp.route("/admin/videos", methods=["GET"])
    def admin_list_videos():
        videos = rgt_session.query(Video).all()
        return jsonify([v.to_dict() for v in videos]), 200

    @bp.route("/admin/videos", methods=["POST"])
    def admin_create_video():
        # TODO: require admin auth
        data = request.get_json(silent=True) or {}
        if not data.get("title"):
            return jsonify({"error": "title is required"}), 400
        video = Video(
            title=data["title"],
            youtube_id=data.get("youtube_id"),
            filename=data.get("filename"),
            caption_type=data.get("caption_type"),
            metadata_json=data.get("metadata_json"),
            is_active=data.get("is_active", True),
        )
        rgt_session.add(video)
        rgt_session.commit()
        return jsonify(video.to_dict()), 201

    @bp.route("/admin/videos/<int:video_id>", methods=["PUT"])
    def admin_update_video(video_id):
        # TODO: require admin auth
        video = rgt_session.get(Video, video_id)
        if not video:
            return jsonify({"error": "Video not found"}), 404
        data = request.get_json(silent=True) or {}
        for field in ("title", "youtube_id", "filename", "caption_type", "metadata_json", "is_active"):
            if field in data:
                setattr(video, field, data[field])
        rgt_session.commit()
        return jsonify(video.to_dict()), 200

    @bp.route("/admin/videos/<int:video_id>", methods=["DELETE"])
    def admin_delete_video(video_id):
        # TODO: require admin auth
        video = rgt_session.get(Video, video_id)
        if not video:
            return jsonify({"error": "Video not found"}), 404
        rgt_session.delete(video)
        rgt_session.commit()
        return jsonify({"message": "Video deleted"}), 200

    # Triads

    @bp.route("/admin/triads/generate", methods=["POST"])
    def admin_generate_triads():
        # TODO: require admin auth
        result, error = generate_triads_from_videos()
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"triads": result, "count": len(result)}), 201

    @bp.route("/admin/triads", methods=["GET"])
    def admin_list_triads():
        triads = rgt_session.query(Triad).all()
        return jsonify([t.to_dict() for t in triads]), 200

    # Participants

    @bp.route("/admin/participants", methods=["GET"])
    def admin_list_participants():
        # TODO: require admin auth
        participants = rgt_session.query(Participant).all()
        return jsonify([p.to_dict() for p in participants]), 200

    # Export

    @bp.route("/admin/export/responses", methods=["GET"])
    def admin_export_responses():
        # TODO: require admin auth
        responses = rgt_session.query(ComparisonResponse).all()
        data = []
        for r in responses:
            d = r.to_dict()
            d["answers"] = [
                a.to_dict()
                for a in rgt_session.query(ComparisonAnswer)
                .filter_by(comparison_response_id=r.id)
                .all()
            ]
            data.append(d)
        return jsonify(data), 200

    @bp.route("/admin/export/ratings", methods=["GET"])
    def admin_export_ratings():
        # TODO: require admin auth
        overall = rgt_session.query(OverallRating).all()
        construct = rgt_session.query(ConstructRating).all()
        return jsonify({
            "overall_ratings": [r.to_dict() for r in overall],
            "construct_ratings": [r.to_dict() for r in construct],
        }), 200

    @bp.route("/admin/export/constructs", methods=["GET"])
    def admin_export_constructs():
        # TODO: require admin auth
        constructs = rgt_session.query(AdditionalConstruct).all()
        return jsonify([c.to_dict() for c in constructs]), 200
