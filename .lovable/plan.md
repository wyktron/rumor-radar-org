# Plan: Hackathon project description + calling feature schedule

## Deliverable
A single markdown document saved to `/mnt/documents/` containing:
1. **Rumor Radar — Hackathon pitch / project description** (elevator pitch, problem statement, solution, core features, target users, impact metrics, tech highlights).
2. **Calling feature schedule** (verification hotline flow, available time windows for loved-one outreach, AI voice + Twilio/ElevenLabs integration, privacy safeguards, current status/limitations).

## Approach
1. Use the codebase already explored (README, App.tsx, pages, i18n, components, types, constants) to extract the accurate feature set, brand voice, metrics, and hotline details.
2. Compose a concise, hackathon-ready narrative (problem → solution → demo flow → impact).
3. Document the calling/scheduling feature separately with the exact time ranges and workflow shown in `HelpLovedOneDialog.tsx` and `CallExplainerDialog.tsx`.
4. Save the final markdown to `/mnt/documents/rumor-radar-hackathon-description.md` and present it via `<presentation-artifact>`.

## Out of scope
- No code changes.
- No new integrations or deployments.
- No UI design work.