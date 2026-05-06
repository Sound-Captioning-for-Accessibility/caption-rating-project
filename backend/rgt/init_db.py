"""
Create the RGT database and all tables.

Usage (from the backend directory):
    python -m rgt.init_db
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import rgt.models  # noqa: E402, F401  – registers tables on RGTBase
from rgt.extensions import create_rgt_tables, init_rgt_standalone  # noqa: E402


def main():
    engine = init_rgt_standalone()
    create_rgt_tables()
    db_url = str(engine.url)
    print(f"RGT tables created  ->  {db_url}")


if __name__ == "__main__":
    main()
