# Requirements: HH Job Agent
Defined: 2026-10-03
Core Value: relevant, truthful, non-duplicate automatic applications under the user's criteria.

## v1 Requirements
### Profile and interface
- [ ] **PROFILE-01**: User can inspect and save an editable profile based on supplied resume facts.
- [ ] **PROFILE-02**: Agreed roles, net salary, geography and employment criteria persist across restarts.
- [ ] **UI-01**: Responsive Russian browser UI shows honest connection states, navigation and actionable errors.
### Search and matching
- [ ] **SEARCH-01**: User can search current HH vacancies with pagination and fetch complete descriptions.
- [ ] **MATCH-01**: Each vacancy displays evidence-based fit, gaps and an explicit eligibility decision.
- [ ] **MATCH-02**: Office/hybrid outside Saint Petersburg and Tech Lead roles never receive automatic applications.
- [ ] **MATCH-03**: Net salary below threshold is rejected; missing salary is accepted; gross/ambiguous salary is flagged separately.
### Letters
- [ ] **LETTER-01**: User can generate, inspect and edit a vacancy-specific letter grounded in candidate facts.
- [ ] **LETTER-02**: Missing mandatory skills are not represented as experience; document/vacancy instructions do not override rules.
### Account and applications
- [ ] **AUTH-01**: User can configure HH OAuth locally and choose their existing HH resume.
- [ ] **APPLY-01**: Agent sends eligible applications with the selected resume and personalized message.
- [ ] **APPLY-02**: Durable duplicate protection and reconciliation prevent blind retries after uncertain network results.
- [ ] **APPLY-03**: Rate limits, required tests, CAPTCHA and expired authorization cause visible recoverable states.
### Operations
- [ ] **SCHEDULE-01**: User can enable, pause and configure local background runs while the server is running.
- [ ] **TRACK-01**: User can view durable application history and synchronize HH statuses.
- [ ] **OPS-01**: Preview mode works without credentials; live mode is never simulated as successful.

## v2 Requirements
None agreed.

## Out of Scope
Tech Lead jobs, public deployment, other job boards, invented experience, bypassing platform restrictions.

## Traceability
| Requirement | Phase | Status |
|---|---|---|
| PROFILE-01 | 1 | Pending |
| PROFILE-02 | 1 | Pending |
| UI-01 | 1 | Pending |
| SEARCH-01 | 2 | Pending |
| MATCH-01 | 2 | Pending |
| MATCH-02 | 2 | Pending |
| MATCH-03 | 2 | Pending |
| LETTER-01 | 3 | Pending |
| LETTER-02 | 3 | Pending |
| AUTH-01 | 4 | Pending |
| APPLY-01 | 4 | Pending |
| APPLY-02 | 4 | Pending |
| APPLY-03 | 4 | Pending |
| SCHEDULE-01 | 5 | Pending |
| TRACK-01 | 5 | Pending |
| OPS-01 | 5 | Pending |

Coverage: 16/16 requirements mapped exactly once.
