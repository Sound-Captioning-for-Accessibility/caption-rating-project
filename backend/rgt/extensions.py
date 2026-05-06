import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, scoped_session, sessionmaker

RGTBase = declarative_base()

_engine = None
_session_factory = sessionmaker()
rgt_session = scoped_session(_session_factory)


def init_rgt_db(app):
    global _engine
    os.makedirs(app.instance_path, exist_ok=True)
    db_path = os.path.join(app.instance_path, "rgt.db")
    _engine = create_engine(f"sqlite:///{db_path}", echo=False)
    _session_factory.configure(bind=_engine)

    @app.teardown_appcontext
    def _remove_rgt_session(exc=None):
        rgt_session.remove()


def init_rgt_standalone(db_path=None):
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
    if _engine is None:
        raise RuntimeError("RGT engine not initialised – call init_rgt_db or init_rgt_standalone first")
    RGTBase.metadata.create_all(_engine)


def get_rgt_engine():
    return _engine
