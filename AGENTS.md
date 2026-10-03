# Project working instructions

## Development workflow
Use only the locally installed GSD Core workflows for this project. Read the relevant .codex/skills/gsd-*/SKILL.md before applying a workflow. Preserve the user-approved stack: TypeScript, HTML, Tailwind CSS, local browser application.

## Account usage reserve
The user requests monitoring usage so other tasks retain capacity.
- Read the account usage tool before substantial work, before every GSD phase or costly agent batch, after such batches, and approximately every 10 minutes during sustained work. Never poll in a tight loop.
- Interpret usedPercent as consumed usage; remaining is 100 minus usedPercent. These are shared Codex account limits, not an exact remaining token count or a ChatGPT message-limit reading.
- Default reserve: 30% remaining in each reported relevant usage window. This is a working policy, not a platform-enforced hard cap; the user can adjust it.
- At 40% remaining or less in any window, inform the user of the approaching reserve.
- At 30% remaining or less, stop initiating implementation or agent work. Save a brief continuation checkpoint and report remaining usage and reset times in Europe/Moscow. Wait for the user's explicit decision before consuming the reserve.
- If usage cannot be read, disclose that limitation and do not initiate a long autonomous batch until a reading or user direction is available.
- Checks cannot guarantee a hard cutoff; a running turn or other chats can consume usage between checks.
- Do not buy credits, use reset credits, change models, or create recurring monitoring automations without user authorization.
