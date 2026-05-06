from flask import jsonify


def register(bp):
    @bp.route("/health")
    def rgt_health():
        return jsonify({"status": "ok", "service": "rgt"})
