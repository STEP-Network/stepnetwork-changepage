# ADR-0007 — changePage on hops only

**Status:** Proposed.

## Decision
Publishers call `changePage()` on client-side navigations only. The cold-load pageview is handled by each system's bootstrap as today.

## Why
Avoids a double pageview and double auction on first load, and keeps the CMP chain untouched.

## Open
On SPA sites with `noview = true`, AUD to confirm how the cold-load `utag.view()` is fired today and whether it stays profile-owned.
