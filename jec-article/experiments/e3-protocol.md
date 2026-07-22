# E3 — Central-registry outage tolerance protocol (to run on the deployment)

Goal: demonstrate empirically that all core functions (curriculum versioning, load
generation, confirmation) remain fully operational while the EDBO link is absent,
and measure reconciliation cost after connectivity returns.

Grounding in code (verified):
- `src/edbo/sync/edbo-sync.service.ts`: `SYNC_OVERLAP_MS = 10 * 60 * 1000`; the
  incremental window start = persisted cursor − overlap; cursors
  (`students_last_sync_at`, `staff_last_sync_at` in `SyncState`) are written
  ONLY after a fully successful pass.
- Daily cron `EVERY_DAY_AT_2AM`; weekly university sync Mon 03:00.

Procedure (per outage length k ∈ {1, 3, 7, 30} days):
1. Snapshot `SELECT * FROM sync_states;` and row counts of students/teachers.
2. Simulate outage of length k: block outbound EDBO host at the firewall
   (or set an invalid EDBO base URL), keep the app running.
3. During "outage": execute the functional checklist — create curriculum version,
   publish, create working curriculum, generate load, assign teachers, confirm by
   order, revoke — record HTTP statuses (expected: all 2xx; sync job logs errors only).
4. Restore connectivity. Trigger manual sync endpoint (admin). Measure:
   wall-clock reconciliation time, number of records pulled, cursor advancement.
5. Verify no-loss property: for a record modified in EDBO exactly at
   (cursor − overlap + ε), confirm it is re-fetched (overlap window guarantee).
6. Repeat ×3 per k; report mean ± SD and records/second.

Output CSV columns: k_days, run, functional_checks_passed, reconcile_s, records_pulled.
