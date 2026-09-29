# Failure modes

The design goal: any dependency absent, late, or throwing costs nothing to the others and nothing to the publisher.

| Case | Naive behaviour | With the bus |
|---|---|---|
| AY absent (non-monetised, adblock) | Shim creates `ayManagerEnv.cmd`, grows all session | No AY subscriber exists; nothing queued |
| AY loads late | Replays every queued hop at once | Receives latest snapshot only, skips if older than its init |
| Tealium absent (adblock, CMP gate, not deployed) | `utag.data` undefined → throw in publisher's router; ads stop refreshing | No Tealium subscriber; AY leg unaffected |
| Tealium loads late | Hops lost or replayed | `utag.js` 4.52+ queue or bus replay-latest |
| A subscriber throws | Can break subsequent listeners | Caught, logged, counted; others run |
| Stub missing | Publisher call throws | Stub ships in publisher bundle; guard example in [10-publisher-integration.md](10-publisher-integration.md) |
| Publisher calls twice per hop | Double pageview, double auction | Dedup within 100 ms on url + content_id |
| Publisher calls before render | AY measures empty slots | Contract: call after commit. Framework examples show the right hook |
| Publisher never calls | No hops tracked | Fallback module during migration only (ADR-0004) |

## Freshness race

If AY reads `utag.data` while Tealium is still writing the new hop, AY sends the **previous hop's** page data. Nothing errors. Resolved by rule 4 in AGENTS.md: page data comes from the snapshot.
