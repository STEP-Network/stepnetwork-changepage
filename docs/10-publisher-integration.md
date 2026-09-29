# Publisher integration

What we send to a publisher's developers. Keep this page short; it is forwarded.

## 1. Install the stub

Before any other tag, in the document head or as the first import in your app entry:

```html
<script>/* contents of stub.min.js */</script>
```

or

```js
import "@stepnetwork/changepage"; // TBD package name
```

## 2. Call on each client-side navigation

After the new page has rendered. Not on the initial load.

```js
window.stepnetwork.changePage({
  page_type: "article",
  page_name: "…",
  section_name: "…",
  content_id: "…"
});
```

Framework-specific hooks: [examples/](../examples/).

## 3. That's it

Do not call Tealium or ad-server functions yourself on navigation. Do not add history listeners for us.

## Checklist

- [ ] Stub loads before `utag.js` and the ad wrapper
- [ ] One call per navigation, after render
- [ ] No call on initial page load
- [ ] Full payload passed every time
