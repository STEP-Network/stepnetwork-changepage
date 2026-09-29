# ADR-0003 — AY stays in Reset mode

**Status:** Accepted.

## Context
Harness results: Manual mode was worst on every measure, rendered fewer slots, never fired `afterPageChange`, and wiped page targeting. Reset outperformed Refresh and Incremental.

## Decision
The bus does not require Manual mode. `changePage()` is called explicitly alongside Reset.

## Open
Confirm with AY whether explicit calls plus automatic detection double-fire on one hop; if so, disable automatic detection per domain after cut-over.
