# Payload schema

Status: **draft** — field names to be confirmed against the AUD data layer standard (see ADR-0006).

## Snapshot (built by the stub)

```js
{
  v: 0,                  // contract version
  seq: 3,                // hop counter in this document, starts at 1
  ts: 1727600000000,     // Date.now() at call
  url: "https://…",      // location.href at call
  path: "/erhverv/…",    // location.pathname
  referrer: "https://…", // previous hop's url, or document.referrer on hop 1
  data: { … }            // publisher payload, frozen copy
}
```

## Publisher payload (`data`)

Fields chosen from keys the profile already reads in load rules and extensions.

| Key | Required | Notes |
|---|---|---|
| `page_type` | yes | Template identity. Drives load rules and ad config. |
| `page_name` | yes | Human-readable view name. |
| `section_name` | where known | Editorial reporting and ad targeting. |
| `content_id` | articles | Also used for dedup. |
| `article_status` | articles | Paywall state. |
| `tealium_event` | no | Defaults to `page_view` in the Tealium leg. |

Unknown keys are passed through untouched.

## Not in the payload

Computed by the profile and never sent by publishers: `neuwo_iab`, `digiseg_*`, `step_contextual`, consent labels, `isSpaSite`.

`isSpaSite` becomes derivable: a document where `seq >= 1` is an SPA session.

## Added by subscribers

The Tealium leg adds `virtual_pageview: true` and `pageview_sequence: seq` to what it sends, so EventStream can separate hops from cold loads.
