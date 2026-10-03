# Roadmap: HH Job Agent

## Phases

- [x] **Phase 1: Interface and profile** — local browser app with persistent profile. (completed 2026-10-03)
- [ ] **Phase 2: HH search and matching** — live discovery and explainable decisions.
- [ ] **Phase 3: Personalized cover letters** — factual vacancy-specific drafts.
- [ ] **Phase 4: HH authorization and automatic applications** — account integration and durable send protection.
- [ ] **Phase 5: Scheduling and tracking** — local background operation and history.

### Phase 1: Interface and profile

**Goal:** User opens a local Russian UI and saves their candidate profile.
**Mode:** mvp
**Depends on:** Nothing
**Requirements:** PROFILE-01, PROFILE-02, UI-01
**UI hint:** yes
**Success Criteria:**
1. Application runs locally on loopback using TypeScript, HTML and Tailwind.
2. Candidate profile and approved filters are visible and survive restart.
3. Invalid input and unavailable backend produce actionable UI errors.

**Plans:** 1/1 plans complete

### Phase 2: HH search and matching

**Goal:** User receives HH vacancies with explainable matching against saved criteria.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** SEARCH-01, MATCH-01, MATCH-02, MATCH-03
**Success Criteria:**
1. Public HH search and detail calls are implemented with pagination and bounded retries.
2. Tests prove net-pay, missing salary, Tech Lead and city/work-format decisions.
3. Remote, hybrid and office semantics remain distinct and source salary values are shown.

**Plans:** 1 plan

### Phase 3: Personalized cover letters

**Goal:** User can inspect and edit truthful letters tailored to a selected vacancy.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** LETTER-01, LETTER-02
**Success Criteria:**
1. Letters reference the vacancy and confirmed relevant skills.
2. Unsupported skills and numerical claims are not invented.
3. User edits persist before submission.

**Plans:** 1 plan

### Phase 4: HH authorization and automatic applications

**Goal:** Configured account can send eligible applications reliably.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** AUTH-01, APPLY-01, APPLY-02, APPLY-03
**Success Criteria:**
1. OAuth uses state validation, server-only tokens and resume selection.
2. Duplicate and uncertain-result tests prevent duplicate sends.
3. Missing credentials and HH restrictions block sending with visible reason.
4. Live send is verified only after the user configures their HH account.

**Plans:** 1 plan

### Phase 5: Scheduling and tracking

**Goal:** User controls background search/application runs and sees outcomes.
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** SCHEDULE-01, TRACK-01, OPS-01
**Success Criteria:**
1. Scheduler is persistent, pausable and cannot overlap runs.
2. History survives restart and HH status sync is available.
3. Preview mode never sends applications or claims real outcomes.

**Plans:** 1 plan

## Progress

| Phase | Plans Complete | Status | Completed |
|---|---|---|---|
| 1. Interface and profile | 1/1 | Complete    | 2026-10-03 |
| 2. HH search and matching | 0/1 | Not started | - |
| 3. Personalized cover letters | 0/1 | Not started | - |
| 4. HH authorization and automatic applications | 0/1 | Not started | - |
| 5. Scheduling and tracking | 0/1 | Not started | - |
