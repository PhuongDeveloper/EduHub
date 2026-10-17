# EduHub product improvement tracker

Progress for the user's 100-feature improvement run. Each batch starts with a dedicated read-only reviewer proposing ten distinct ideas; implementation is counted only after the feature is connected to its UI and data flow.

## Batch 1 — reviewer ideas

| # | Improvement | Status |
|---|---|---|
| 1 | Community resource-needs board with voting and fulfillment status | Implemented |
| 2 | Structured lesson planner with reusable public/private plans | Implemented |
| 3 | Derivative resources linked back to source and creator | Implemented |
| 4 | Submission quality/readiness checklist | Implemented |
| 5 | Printable one-page resource handout | Implemented |
| 6 | Author-declared curriculum outcomes on resources | Implemented |
| 7 | Copyright, privacy, and classroom-safety declaration at submission | Implemented |
| 8 | Broken-link reporting integrated with the moderation queue | Implemented |
| 9 | Autosaved/restorable submission drafts | Implemented |
| 10 | Admin-managed teaching challenges with real entries and review | Implemented |

**Completed: 10/100.**

## Batch 2 — reviewer ideas

| # | Improvement | Status |
|---|---|---|
| 11 | Followed search alerts for new matching resources | Implemented |
| 12 | Private classroom schedule for lesson plans, with preparation/teaching status, filters, and deletion | Implemented |
| 13 | Teacher co-editors for lesson plans with viewer/editor roles and protected ownership | Implemented |
| 14 | Side-by-side resource comparison | Implemented |
| 15 | Safe in-page PDF/image preview for supported resources | Implemented |
| 16 | Video transcript and caption support | Implemented |
| 17 | Private creator analytics | Implemented |
| 18 | Searchable teacher directory by subject, grade, and province | Implemented |
| 19 | Review/appeal flow for rejected resources | Implemented |
| 20 | Exportable teacher contribution portfolio | Implemented |

**Completed: 20/100.**

## Batch 3 — reviewer ideas

| # | Improvement | Status |
|---|---|---|
| 21 | Ordered learning paths with per-teacher progress | Implemented |
| 22 | Editable Microsoft Word lesson-plan export | Implemented |
| 23 | Private school/subject groups with invite-only membership | Implemented |
| 24 | Private teacher messages with realtime updates | Implemented |
| 25 | Follow subject discussion channels and receive alerts | Implemented |
| 26 | Report discussion topics/replies with admin review queue | Implemented |
| 27 | Warn about possibly duplicate resources before submission | Implemented |
| 28 | Save project reading notes locally and cache the app shell for weak connections | Implemented |
| 29 | Download a personal JSON copy of profile, projects, and discussions | Implemented |
| 30 | Reading accessibility controls for text size, spacing, contrast, and motion | Implemented |

**Completed: 30/100.**

## Batch 4 — practical community workflows

| # | Improvement | Status |
|---|---|---|
| 31 | Teacher self-service verification requests with admin review of public evidence | Implemented |
| 32 | Teacher-facing display controls for school, location, and recent activity on profile surfaces | Implemented |
| 33 | Private subject-group discussion posts and replies, restricted to group members | Implemented |
| 34 | Image attachments on public discussions with size/type limits and student-privacy guidance | Implemented |
| 35 | Mention a teacher by selecting their account and create an in-app notification | Implemented |
| 36 | Publish professional learning events, register, and show an aggregate attendee count | Implemented |
| 37 | Show whether shared learning materials require an account, network, device, or software | Implemented |
| 38 | Mark outdated resources and link a replacement using an author/admin-checked database function | Implemented |
| 39 | Admin audit history for moderation, account verification/role, report, and support status changes | Implemented |
| 40 | Help center with guides, private support requests, admin replies, and teacher follow-up history | Implemented |

**Completed: 40/100.** The new Supabase objects and permissions are in `supabase_setup.sql`; apply that SQL before using these database-backed workflows. Profile visibility controls affect rendered profile/directory surfaces and are not a column-level data-access boundary.

## Batch 5 — project sharing and reuse (user correction applied)

| # | Improvement | Status |
|---|---|---|
| 41 | Generate a project-specific QR in the browser, copy the canonical URL, download PNG, and print a classroom-ready QR sheet | Implemented |
| 42 | Attach up to ten total teaching files to one project, with per-file size/type and total upload limits | Implemented |
| 43 | Private account history of project opens and downloads, with a quick way to reopen or download again | Implemented |
| 44 | Threaded Q&A replies under project comments, with database validation that replies stay on the same project | Implemented |
| 45 | Submit edits to an approved project for admin review while the current approved version remains available | Implemented |
| 46 | Keep numbered snapshots and release notes for approved project revisions | Implemented |
| 47 | Notify bookmarkers and followers when a project revision is approved | Implemented |
| 48 | Record admin link checks as working, unavailable, or not needed before project approval | Implemented |
| 49 | Download available files in a collection as a bounded ZIP, including a manifest of links that cannot be fetched | Implemented |
| 50 | Select and moderate multiple projects in one admin action with per-resource database moderation updates | Implemented |

**Completed: 50/100.** Database-backed parts in batches 4–5 require the SQL in `supabase_setup.sql` to be applied to Supabase before they work in production. ZIP export depends on each file host allowing browser fetches; blocked sources are listed in the ZIP manifest for manual download.

## Batch 6 — tìm đúng học liệu theo điều kiện sử dụng

| # | Improvement | Status |
|---|---|---|
| 51 | Filter resources verified as free | Implemented |
| 52 | Filter resources usable offline | Implemented |
| 53 | Filter resources marked as mobile friendly | Implemented |
| 54 | Filter resources that do not require a separate account | Implemented |
| 55 | Search with multiple Vietnamese keywords in any order, ignoring accents | Implemented |
| 56 | Remember the teacher's latest discovery filters on this device | Implemented |
| 57 | Save up to six named search presets for recurring classroom needs | Implemented |
| 58 | Restore a saved search preset in one action | Implemented |
| 59 | Remove an individual saved search preset | Implemented |
| 60 | Copy a shareable URL that restores the current search and filters | Implemented |

**Completed: 60/100.** The four availability filters rely on project details declared by the author and the platform's existing verified-free flag. The filter and preset state is stored locally in the browser; shared URLs carry only the search criteria.

## Batch 7 — trao đổi ngay trên trang dự án

| # | Improvement | Status |
|---|---|---|
| 61 | Stream project comments and replies live with Supabase Realtime | Implemented |
| 62 | Show whether the live comment connection is active | Implemented |
| 63 | Show when another teacher is typing in the project conversation | Implemented |
| 64 | Search project comments by content, author, or reply | Implemented |
| 65 | Sort conversation threads newest-first or oldest-first | Implemented |
| 66 | Collapse and expand reply threads | Implemented |
| 67 | Save an unfinished comment draft automatically | Implemented |
| 68 | Restore that draft for the same teacher and project | Implemented |
| 69 | Show the 4,000-character limit and current count before sending | Implemented |
| 70 | Send a comment or reply with Ctrl+Enter / Cmd+Enter | Implemented |

**Completed: 70/100.** Live typing and comments require the updated SQL publication block and Supabase Realtime to be enabled. Draft text remains in the current browser only.
