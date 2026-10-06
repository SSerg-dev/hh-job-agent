---
status: passed
verification_type: agent_browser
checked_at: 2026-10-06T17:47:04Z
environment: http://127.0.0.1:4311
data_dir: .runtime/uat-261006-s8o
---

# Isolated local UI checks

These are direct browser observations by the agent, not user-reported acceptance and not completion of Phase 2 or Phase 3. The personal database data/agent.sqlite was not used by this server. No real submissions occurred.

| Check | Expected | Observed | Result |
|---|---|---|---|
| Start regeneration | Inline confirmation, no native dialog | Warning and Confirm/Cancel buttons displayed; original card actions disabled | Pass |
| Cancel | Unsaved textarea value preserved, actions restored | "Пересоздание отменено. Текст не изменён."; exact UAT marker remained | Pass |
| Save/reload | Edited draft survives reload | Saved marker remained in textarea after reload | Pass |
| Confirm | New draft replaces text and is saved | "Письмо пересоздано и сохранено. Предыдущий текст заменён."; generated draft displayed | Pass |
| Stale second tab | Newer saved draft cannot be regenerated from stale snapshot | Visible conflict warning; first-tab saved marker remained after reload | Pass |
| Optional skills | Missing optional Python/PyTorch do not block a .NET vacancy | Test card displayed "Соответствует критериям", C#/.NET matches and a separate nonblocking Python/PyTorch note | Pass |
| Existing real-vacancy source | Language alternative is explained without fabricating Python | Napoleon IT card displayed satisfied alternative; unrelated unknown tags retained "Нужна проверка" | Pass |

The isolated database has no private candidate-source catalog; the UI therefore truthfully displayed short-profile fallback/source warnings. Personal document-content review is not claimed. A screenshot was inspected in the browser tool for the optional-skills card. No new live HH API search was performed.

All 32 behavior tests were rerun and passed. No code changes were needed during these UI checks. Earlier typecheck/build results remain applicable. Test server stopped after verification; disposable test cards remain only in the ignored test database. Formal phase acceptance and the original live API-search requirement remain open.
