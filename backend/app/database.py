import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from uuid import uuid4

from app.schemas import LeadCreate

ActivepiecesStatus = Literal["not_configured", "accepted", "failed"]
SheetsSyncStatus = Literal["pending", "failed", "synced"]


class DemoDailyLimitReached(Exception):
    """Raised when the configured global daily demo limit is reached."""


class DemoMinimumIntervalNotElapsed(Exception):
    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__("The minimum interval between demo requests has not elapsed.")
        self.retry_after_seconds = retry_after_seconds


class LeadDatabase:
    def __init__(self, path: Path) -> None:
        self.path = path

    def initialize(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.path) as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS leads (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    submitted_at TEXT,
                    full_name TEXT NOT NULL,
                    company_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    website TEXT NOT NULL DEFAULT '',
                    selected_package TEXT NOT NULL,
                    requirements TEXT NOT NULL,
                    activepieces_status TEXT NOT NULL
                        CHECK (activepieces_status IN ('not_configured', 'accepted', 'failed')),
                    google_sheets_sync_status TEXT NOT NULL
                        CHECK (google_sheets_sync_status IN ('pending', 'failed', 'synced'))
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS demo_generation_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_demo_usage_created_at
                ON demo_generation_usage(created_at)
                """
            )
            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_demo_usage_client_created_at
                ON demo_generation_usage(client_hash, created_at)
                """
            )

    def reserve_demo_generation(
        self,
        client_hash: str,
        daily_limit: int,
        minimum_interval_seconds: float,
        now: datetime | None = None,
    ) -> None:
        current_time = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
        day_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)

        with sqlite3.connect(self.path, timeout=10) as connection:
            connection.execute("BEGIN IMMEDIATE")
            daily_count = connection.execute(
                """
                SELECT COUNT(*) FROM demo_generation_usage
                WHERE created_at >= ?
                """,
                (day_start.isoformat(),),
            ).fetchone()[0]
            if daily_count >= daily_limit:
                raise DemoDailyLimitReached

            last_request = connection.execute(
                """
                SELECT created_at FROM demo_generation_usage
                WHERE client_hash = ?
                ORDER BY created_at DESC
                LIMIT 1
                """,
                (client_hash,),
            ).fetchone()
            if last_request is not None and minimum_interval_seconds > 0:
                last_time = datetime.fromisoformat(last_request[0])
                elapsed_seconds = (current_time - last_time).total_seconds()
                if elapsed_seconds < minimum_interval_seconds:
                    retry_after = int(minimum_interval_seconds - elapsed_seconds)
                    raise DemoMinimumIntervalNotElapsed(max(1, retry_after))

            connection.execute(
                """
                INSERT INTO demo_generation_usage (client_hash, created_at)
                VALUES (?, ?)
                """,
                (client_hash, current_time.isoformat()),
            )

    def insert_lead(self, lead: LeadCreate) -> dict[str, object]:
        lead_id = str(uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        submitted_at = (
            lead.submitted_at.isoformat() if lead.submitted_at is not None else None
        )

        with sqlite3.connect(self.path) as connection:
            connection.execute(
                """
                INSERT INTO leads (
                    id, created_at, submitted_at, full_name, company_name, email,
                    phone, website, selected_package, requirements,
                    activepieces_status, google_sheets_sync_status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_configured', 'pending')
                """,
                (
                    lead_id,
                    created_at,
                    submitted_at,
                    lead.full_name,
                    lead.company_name,
                    str(lead.email),
                    lead.phone,
                    str(lead.website) if lead.website is not None else "",
                    lead.selected_package,
                    lead.requirements,
                ),
            )

        saved_lead = self.get_lead(lead_id)
        if saved_lead is None:
            raise RuntimeError("The lead was not available after being saved.")
        return saved_lead

    def update_delivery_status(
        self,
        lead_id: str,
        activepieces_status: ActivepiecesStatus,
        google_sheets_sync_status: SheetsSyncStatus,
    ) -> None:
        with sqlite3.connect(self.path) as connection:
            cursor = connection.execute(
                """
                UPDATE leads
                SET activepieces_status = ?, google_sheets_sync_status = ?
                WHERE id = ?
                """,
                (activepieces_status, google_sheets_sync_status, lead_id),
            )
            if cursor.rowcount != 1:
                raise LookupError("The lead to update was not found.")

    def get_lead(self, lead_id: str) -> dict[str, object] | None:
        with sqlite3.connect(self.path) as connection:
            connection.row_factory = sqlite3.Row
            row = connection.execute(
                "SELECT * FROM leads WHERE id = ?", (lead_id,)
            ).fetchone()
        return dict(row) if row is not None else None

    def count_leads(self) -> int:
        with sqlite3.connect(self.path) as connection:
            result = connection.execute("SELECT COUNT(*) FROM leads").fetchone()
        return int(result[0])
