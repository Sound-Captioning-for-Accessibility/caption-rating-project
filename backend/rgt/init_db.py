import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import rgt.models  
from rgt.extensions import create_rgt_tables, init_rgt_standalone 


def main():
    engine = init_rgt_standalone()
    create_rgt_tables()
    db_url = str(engine.url)
    print(f"RGT tables created  ->  {db_url}")


if __name__ == "__main__":
    main()
