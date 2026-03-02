"""
Add Google identity columns to user_model: googleSub, displayName, avatarUrl.
Run once from backend directory: python migrate_user_google_fields.py
"""
import sqlite3
from pathlib import Path

COLUMNS = [
    ('googleSub', 'TEXT'),
    ('displayName', 'TEXT'),
    ('avatarUrl', 'TEXT'),
]

def main():
    backend_dir = Path(__file__).resolve().parent
    for db_path in [backend_dir / 'instance' / 'captionratings.db',
                    backend_dir / 'captionratings.db']:
        if db_path.exists():
            break
    else:
        print('No database file found.')
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(user_model)")
    existing = [row[1] for row in cur.fetchall()]

    for col_name, col_type in COLUMNS:
        if col_name not in existing:
            cur.execute(f"ALTER TABLE user_model ADD COLUMN {col_name} {col_type}")
            print(f'Added {col_name} to user_model.')

    cur.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_user_googleSub "
        "ON user_model (googleSub)"
    )

    conn.commit()
    conn.close()
    print('Done.')

if __name__ == '__main__':
    main()