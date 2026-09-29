# ADR-0005 — Global name

**Status:** Open.

## Context
`window.stepnetwork` matches existing STEP system naming. Tealium runs on all JFM-owned properties, including ones not monetised by STEP. The profile already uses an AUD namespace, `window.aud_utils`.

## Options
- `window.stepnetwork.changePage()`
- A neutral or JFM-level namespace
- Both: one canonical, one alias

## Constraint
Renaming after publishers ship is expensive. Register the canonical name and one alias in v0.
