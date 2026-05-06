from flask import jsonify

from rgt.services.round_service import complete_round


def register(bp):

    @bp.route("/rounds/<int:round_assignment_id>/complete", methods=["POST"])
    def rounds_complete(round_assignment_id):
        result, error = complete_round(round_assignment_id)
        if error:
            return jsonify({"error": error}), 400
        return jsonify(result), 200
