# Assertive Yield facts used

Source: `STEP-Network/AY_setup_template` — `Third party documentations/` (Yield Manager, Tag Integration Guide).

- `ayManagerEnv.changePage([{ refresh, reset }])` — call only once the new page's DOM is fully inserted.
- Emits `beforePageChange` / `afterPageChange`.
- Automatic SPA modes detect `pushState` / `replaceState` / `popstate`. STEP runs **Reset** workspace-wide.
- `ayManagerEnv.cmd` queue for calls before the manager is ready.
- Per STEP: the wrapper already checks `utag.data` readiness before appending data.

Open with AY: per-domain SPA mode override; dedup between automatic detection and explicit `changePage()`.
