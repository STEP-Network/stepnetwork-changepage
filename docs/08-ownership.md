# Ownership

| Piece | Owner | Ships as |
|---|---|---|
| Contract, schema, versioning, this repo | Joint (STEP + AUD) | This repo |
| Stub (`src/stub.js`) | Authored jointly, installed by publisher | npm package + inline snippet |
| AY subscriber, GPT page KVs, AY mode | STEP | AY Yield Manager |
| Tealium subscriber, extension scoping, EventStream mapping | AUD | Tealium iQ profile |
| Retiring history shim and exception lists | AUD, per domain, on STEP sign-off | Profile republish |
| Publisher integration docs | Joint | [10-publisher-integration.md](10-publisher-integration.md) |

Contract changes require an ADR approved by both teams.
