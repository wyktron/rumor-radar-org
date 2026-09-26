# Fix: hotline strip wrapping to a second row on mobile

## Problem
On the user's phone the "+40-800-476-674 · Call" strip drops to its own row instead of sitting neatly in one centered line. The current fix relies on JavaScript measurement (ResizeObserver + scrollWidth checks) which is fragile: it runs after first paint, can misfire while fonts load, and the number can still overflow before the measurement kicks in.

## Fix (CSS-only, no JS measurement)
Rework the mobile hotline strip in `src/components/Header.tsx`:

1. **Remove the measurement logic** — delete `compactHotline` state, the refs, and the ResizeObserver effect entirely.
2. **Single non-wrapping row** — keep the strip as one flex row, centered, `flex-nowrap`, with `overflow-hidden` so nothing can ever spill to a second line.
3. **Pure-CSS compact mode** — show the full number "+40-800-476-674" only when there is comfortably enough room (`hidden min-[380px]:inline` on the number span); below that width only the phone icon + Call button render. No JS, no flicker, no wrap possible at any width.
4. **Tighten spacing** — slightly smaller horizontal padding/gap so the full number + Call button fit centered on typical phones (360px+).

## Verification
- Playwright at 320px, 360px, 540px widths: confirm the strip is always exactly one row, centered, icon-only below 380px, full number at/above 380px.
- Confirm the Call button and icon still open the call explainer dialog.
- Check build log for errors.
