"""
RGT experiment platform – isolated Flask blueprint.

Uses its own SQLAlchemy engine pointing at instance/rgt.db so that the
CaptionCommons database is completely untouched.
"""
from flask import Blueprint


def init_rgt(app):
    """Call once from the main Flask app to wire up the RGT subsystem."""
    from rgt.extensions import init_rgt_db, create_rgt_tables

    init_rgt_db(app)

    # Import models so RGTBase.metadata knows every table before create_all
    import rgt.models  # noqa: F401

    create_rgt_tables()

    # Build blueprint and register every route module
    bp = Blueprint("rgt", __name__, url_prefix="/api/rgt")

    from rgt.routes.health import register as reg_health
    from rgt.routes.study import register as reg_study
    from rgt.routes.rounds import register as reg_rounds
    from rgt.routes.clips import register as reg_clips
    from rgt.routes.comparison import register as reg_comparison
    from rgt.routes.ratings import register as reg_ratings
    from rgt.routes.admin import register as reg_admin

    reg_health(bp)
    reg_study(bp)
    reg_rounds(bp)
    reg_clips(bp)
    reg_comparison(bp)
    reg_ratings(bp)
    reg_admin(bp)

    # TODO: Add CORS configuration for RGT routes here if needed
    app.register_blueprint(bp)
