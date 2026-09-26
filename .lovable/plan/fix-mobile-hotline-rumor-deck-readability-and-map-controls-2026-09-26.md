# Fix mobile hotline, rumor deck readability, and map controls

## Changes
- Keep the mobile hotline inside the main header row instead of a separate strip. Show the full number only from 380px upward; narrower screens show the phone icon and Call button. The row will never wrap.
- Give the rumor deck a solid, high-contrast information surface and status treatment so every label remains readable regardless of the animated background.
- Anchor the rumor deck button to the filter button using one shared map control stack, preserving an 8px gap even when the filter panel opens.

## Verification
- Check the header at 320px, 360px, and 540px widths.
- Open the deck and confirm labels, status, body text, and actions are legible.
- Open and close filters on mobile and confirm both buttons remain attached without overlap.
- Check the latest build and runtime logs.
