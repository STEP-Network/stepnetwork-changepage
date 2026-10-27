# `stepnetwork.changePage()`

On a single-page app we cannot reliably tell when one page ends and the next begins. So we don't
guess — you tell us, and that call is what we count as a pageview.

The function is already on your page. There is nothing to install.

## 1. What counts as a pageview

Call it **once per client-side route change**, **after** the new view is in the DOM.

Do **not** call it:

- on the initial page load — that is already handled
- for in-page state that is not a new page: tab switches, filters, sorting, modals — unless your
  product counts those as pageviews

Timing matters. We look for the new page's ad placements at the moment you call, so calling before
the new view has rendered means we find nothing.

## 2. How to invoke it

```js
window.stepnetwork?.changePage();
```

Use `?.` so the call is a no-op, not an error, if our script has not loaded.

### The three forms

| Call | Use for |
|---|---|
| `window.stepnetwork?.changePage()` | A normal route change. Replaces the page's ads. **Use this unless you have a reason not to.** |
| `window.stepnetwork?.changePage({})` | Infinite scroll. Keeps the ads already on screen and adds the new ones. |
| `window.stepnetwork?.changePage({ refresh: true })` | Keeps the ads already on screen but re-runs them. Rarely needed. |

### Framework examples

**Next.js — app router**

```jsx
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ChangePage() {
  const pathname = usePathname();
  useEffect(() => { window.stepnetwork?.changePage(); }, [pathname]);
  return null;
}
```

**Next.js — pages router**

```js
router.events.on('routeChangeComplete', () => {
  window.stepnetwork?.changePage();
});
```

**Vue Router / Nuxt**

```js
import { nextTick } from 'vue';

router.afterEach(() => {
  nextTick(() => window.stepnetwork?.changePage());
});
```

**SvelteKit**

```js
import { afterNavigate } from '$app/navigation';
import { tick } from 'svelte';

afterNavigate(async () => {
  await tick();
  window.stepnetwork?.changePage();
});
```

**Hash router / plain JS**

```js
window.addEventListener('hashchange', function () {
  requestAnimationFrame(function () {
    if (window.stepnetwork) window.stepnetwork.changePage();
  });
});
```

### One thing to avoid

Do not pass the function straight to a router hook.

```js
router.afterEach(window.stepnetwork.changePage);           // wrong
router.afterEach(() => window.stepnetwork?.changePage());  // correct
```

The first form passes the router's route object as `options`, and fails silently.

Questions: STEP Network AdTech.
