"""
Standalone SQLAlchemy engine and session for the RGT database.

Uses raw SQLAlchemy (not Flask-SQLAlchemy) so the RGT database is fully
isolated from the CaptionCommons database.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, scoped_session, sessionmaker

RGTBase = declarative_base()

_engine = None
_session_factory = sessionmaker()
rgt_session = scoped_session(_session_factory)


def init_rgt_db(app):
    """Bind the RGT engine to instance/rgt.db using the Flask app's instance path."""
    global _engine
    os.makedirs(app.instance_path, exist_ok=True)
    db_path = os.path.join(app.instance_path, "rgt.db")
    _engine = create_engine(f"sqlite:///{db_path}", echo=False)
    _session_factory.configure(bind=_engine)

    @app.teardown_appcontext
    def _remove_rgt_session(exc=None):
        rgt_session.remove()


def init_rgt_standalone(db_path=None):
    """Initialise for standalone scripts (no Flask app required)."""
    global _engine
    if db_path is None:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        instance_dir = os.path.join(backend_dir, "instance")
        os.makedirs(instance_dir, exist_ok=True)
        db_path = os.path.join(instance_dir, "rgt.db")
    _engine = create_engine(f"sqlite:///{db_path}", echo=False)
    _session_factory.configure(bind=_engine)
    return _engine


def create_rgt_tables():
    """Create all tables registered on RGTBase.metadata."""
    if _engine is None:
        raise RuntimeError("RGT engine not initialised – call init_rgt_db or init_rgt_standalone first")
    RGTBase.metadata.create_all(_engine)


def get_rgt_engine():
    return _engine
