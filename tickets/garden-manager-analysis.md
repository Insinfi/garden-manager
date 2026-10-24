# Ticket: Beginner-friendly potager planner

## Status
- Current role: Testeur
- State: Implementation committed; independent validation pending.

## Request and context
Create a beginner-friendly garden app focused on a potager, with a garden map and a task-planning view. It should be comfortable to read on a phone and primarily used for editing on a PC, while still allowing edits on a phone. The user wants to grow fruit and vegetables despite having no farming experience.

## Product context
This initial product scope supports planning a garden, managing plants and trees, and providing beginner-friendly, locally relevant guidance. The user wants a personal garden synced across their own devices, with no recurring cost for personal use. Broader sharing, photos, and notes are not included in the agreed first-version scope.

## Requirements and constraints
- The interface should be in French initially.
- It should be responsive and readable on a phone. Editing should work on PC and remain possible on a phone; phone editing is not prohibited.
- Provide two core views: Planning and Plan.
- Planning should provide both a chronological to-do list and a calendar.
- Automatically suggest seasonal tasks based on the user's recorded plants, including actions such as planting, pruning, and harvesting. The user can edit suggested tasks and add personal tasks that are not tied to an automatically suggested plant task.
- Show crop and care recommendations only when the user asks; do not proactively interrupt the user with recommendations.
- Recommendations and seasonal task timing should be relevant to Tournai, Belgium. Gardening facts are context-dependent and should come from reliable, locally relevant sources; distinguish advice from user-entered observations and avoid presenting uncertain guidance as universal fact.
- The Plan view should let the user create simple garden areas and click/select them. Approximate real dimensions are required, using metric units; precise CAD-level accuracy is not required.
- The user should be able to create plant and tree records containing at least a name/type, location on the plan, and planting date.
- Changes made on the PC should sync to the user's phone over the internet.
- The first version is for the user's personal garden and own devices; multi-person sharing is out of scope.
- A free online storage option is required for personal use, with reasonable free-tier limits acceptable but no recurring cost.
- The user authorizes the implementation role to select a provider only after verifying privacy, free-tier limits, export/deletion, and zero-recurring-cost fit. This does not authorize public access or a recurring-cost provider.
- Repository audit: the repository currently contains workflow documentation, agent definitions, and skills, but no application source code, tests, or runtime configuration.

## Blocking questions
None currently. The user authorized the implementation role to select and verify a compliant provider.

## Acceptance criteria
- The application offers French-language Planning and Plan views, readable on phone and usable for editing on PC and phone.
- The user can create a simple garden map with clickable/selectable areas, approximate metric dimensions, and plant/tree records linked to an area and planting date.
- Planning presents both a to-do list and a calendar, generates editable seasonal tasks from recorded plants, and supports personal to-dos.
- Crop and care recommendations are provided on request, with locally relevant information for Tournai and no unsolicited recommendation interruptions.
- Personal garden data syncs between the user's own devices using a no-recurring-cost online storage option.
- No other-user sharing, photos, or notes are required for the first version.

## Architecture

### Proposed boundaries

The repository has no application code or runtime conventions to preserve. For the first version, use one responsive web application with a small client and a hosted persistence/authentication service. Do not introduce microservices, a generalized plant taxonomy, collaboration infrastructure, photo handling, or a separate recommendation service.

- **Presentation (Planning and Plan):** French-language views and reusable interface elements. The UI owns input/display state and invokes application operations; it does not embed horticultural rules or provider SDK calls.
- **Application operations:** focused use cases for editing garden areas and plant/tree records, listing/creating/editing tasks, and requesting recommendations. These coordinate validation and persistence without owning rendering or vendor-specific behavior.
- **Garden domain:** plain records and policies for the user's garden, areas, plant/tree instances, and tasks. A plant/tree instance is distinct from its name/type and links to one plan area and a planting date. Keep user-entered data separate from sourced guidance. Use stable IDs and explicit relationships; store approximate area geometry in metric units. Let UX settle the simplest appropriate area shape/interaction before locking its concrete geometry representation.
- **Persistence boundary:** a narrow repository interface for the personal garden and tasks, implemented by the selected hosted service. The first version needs one private owner and cross-device internet sync, not multi-user sharing or a generalized synchronization engine. Keep the provider SDK behind this boundary so domain and UI behavior do not depend on it.
- **Guidance catalog:** a versioned, read-only set of reviewed, locally relevant source facts and seasonal rules. A small in-process/catalog module is sufficient; it does not justify a separate service or runtime dependency on third-party APIs.

### Data and control flow

1. The user edits the plan or a plant/tree in the interface. A focused application operation validates the minimal agreed fields, associates the record with its garden/area, and saves through the persistence boundary. Subsequent reads on the user's other signed-in device load that same private garden from the hosted service.
2. The Planning view requests tasks for its selected period. The application operation combines the user's plant/tree instances with catalog rules scoped to Tournai/Belgium and the relevant season, then returns suggested tasks with source/provenance metadata. Personal tasks have no plant association; suggested tasks link to the triggering plant and rule.
3. Generated suggestions should have stable identity for a plant/rule/season so recalculation does not create duplicates. Persist them as editable user tasks with their source-rule identity; refreshes must preserve user edits rather than overwrite or duplicate tasks. Do not require additional task statuses beyond the approved scope.
4. The user explicitly opens/requests crop or care guidance. The application returns matching catalog entries with their source, applicable context, and uncertainty. Do not show unsolicited recommendation prompts, and do not represent user observations as verified facts.

### Storage and recommendation sourcing

- **Storage strategy:** private, single-owner hosted data with sign-in/authorization on every read and write; no public or unguessable-link access. A provider adapter/repository keeps data portable and limits vendor coupling. The user authorizes the implementation role to select a managed option only after confirming its current free-tier limits, retention/backup and export/deletion path, service availability/sleep behavior, authentication, and whether expected personal use can remain at zero recurring cost. Do not promise unlimited or permanent free storage. Provider selection still requires evidence and must be recorded before implementation relies on it.
- **Guidance strategy:** curate and version the small set of facts/rules needed for the first version from reliable Belgian or locally applicable horticultural sources. Store source name/URL, review date/version, regional/seasonal applicability, and any caveat alongside each rule. Keep the rule engine deterministic and independent of the presentation and persistence vendor. Avoid scraping or depending on a live external recommendation API in v1: that would add availability, licensing, freshness, and factual-quality failure modes without being required by the ticket. Do not ship unsupported universal advice; review/refresh catalog entries deliberately and omit facts that cannot be sourced confidently.

### Interfaces and failure/migration concerns

Keep application-facing interfaces small and semantic: garden/area/plant repositories; task read/write operations; a guidance catalog query; and use cases such as save plant, list tasks for a period, refresh seasonal suggestions, and request advice. Concrete method names and framework choices should follow the implementation environment once selected; avoid speculative generic abstractions.

- Surface save/sync failures and preserve the user's unsaved edits for retry; do not report a successful save until the hosted service confirms it. Offline editing and background conflict resolution are not acceptance requirements.
- Handle unavailable/expired authentication and provider limits as recoverable errors; never fall back to public access or silently discard user data. Define export/deletion and recovery capabilities when selecting the provider.
- Keep provider IDs out of domain identity where practical and include a schema/catalog version. If storage later changes, an explicit export/import migration can map garden, area, plant, and task records; do not build multi-provider migration tooling for v1.
- Catalog unavailability should not prevent viewing/editing saved garden data. If the curated catalog is bundled with the app, task generation/guidance uses the shipped version and displays its provenance; update content with app releases rather than silently changing advice remotely.

### Design tradeoffs and next-role guidance

This is a lightweight Clean Architecture boundary (presentation → application/domain → ports, with provider/catalog adapters), not a mandate for multiple deployables or layers per entity. It isolates the only substantial external dependency while keeping a small first-version app easy to implement. SOLID is applied chiefly through dependency inversion at persistence and guidance boundaries; additional abstractions would add ceremony without a second implementation. Atomic Design is appropriate within the UI for shared controls and composed views, but does not define backend or domain boundaries.

UI design applies: the Designer UX/UI should define the responsive French Planning/Plan flows, accessible PC and phone editing, map area creation/selection and metric sizing, task/calendar interactions, and the explicit request path for advice. Keep it to requirements already approved; do not add sharing, photos, notes, or proactive recommendations. Coordinate with the developer on minimal area geometry and task-edit/status behavior. Provider selection is delegated to the implementation role subject to the verification criteria above; no provider-specific interface is required at UX stage.

## UX/UI
### Navigation and responsive behavior

- Present two clearly named French-language destinations, **Planning** and **Plan**, with the current destination evident to sighted users and assistive technology. Use familiar, restrained controls and semantic headings/forms; the repository has no application UI or component system to extend.
- Keep both views readable on phone and PC. On PC, use the available width for the map and its selected-area details, and show the Planning calendar and chronological task list together where practical. On a phone, keep controls and text comfortably readable and avoid requiring horizontal scrolling; allow the calendar and list to be switched between or stacked, with the selected date and its tasks easy to find. All key editing remains possible on touch and with mouse/keyboard.
- Show a concise, non-color-only save/sync state. Do not claim success until the save is confirmed; on failure keep entered values visible and offer a clear retry.

### Plan flow

1. The Plan opens as a simple schematic of the garden, with existing areas visibly bounded and selectable. Areas use simple rectangles in v1; dimensions are approximate width and length in metres, not CAD precision. Provide a labelled **Ajouter une zone** action and a short form for the dimensions, then let the user place it on the plan by click/tap. Do not require drawing or dragging.
2. Selecting a zone highlights it with more than color alone and exposes its dimensions and plants/trees. The same areas must also be available as labelled, keyboard-operable controls outside the spatial surface, so selection does not depend on pointer precision.
3. Offer a keyboard placement alternative when adding/repositioning a zone: focus the plan, use arrow keys to move a visible placement marker, and confirm with Enter/Space; announce the current action/placement accessibly. Dimensions remain editable in labelled numeric fields. On touch, tap to place and use the fields—not pinch, drag, or precision gestures—to set size.
4. From a selected area, **Ajouter une plante ou un arbre** opens a labelled form with name/type, planting date, and area preselected (or explicitly selectable). Validate required fields inline, preserve values after validation/save errors, and on confirmed save show the new record in its area and a brief textual success state. No photo, notes, sharing, or generalized taxonomy controls.

### Planning flow

- Planning provides both a month-based calendar and a chronological task list. Selecting a day filters or focuses the list on that date; the list remains available independently of the calendar. Use text labels and accessible controls to move between months and dates; do not rely on color or calendar-cell position alone.
- Identify generated seasonal tasks as **Suggérée** and personal tasks as **Personnelle**. A task can be opened and edited, including its text and date; generated-task edits are retained on refresh as specified by the architecture. Provide **Ajouter une tâche personnelle** independently of plant suggestions. Do not imply unsupported completion/status behavior.
- If there are no tasks, explain the empty state and offer the in-scope actions to add a personal task or record plants/trees for seasonal suggestions. If there are no plants, do not manufacture suggestions. When loading tasks, show a non-blocking loading indicator; on load/save failure explain the problem, retain edits, and provide retry. Confirm successful task saves in text.
- Recommendations appear only after an explicit **Voir des conseils** / **Demander des conseils** action. Present relevant guidance with its source and applicable context/caveat, and distinguish it from user-entered information. Do not interrupt with unsolicited advice or recommendation prompts.

### Accessibility and visual behavior

- Use French labels, semantic landmarks/headings, correctly associated form labels and error descriptions, logical keyboard order, visible high-contrast focus, and accessible names/states for the selected view, area, date, and task type. Keep text and controls legible at narrow widths and browser zoom; never convey selection, task type, validation, or save state by color alone.
- Support keyboard and screen-reader operation for navigation, forms, calendar, area selection, and map placement; provide the non-gesture alternatives above. Respect reduced-motion preferences and do not make essential state changes depend on animation. Use clear, inline validation and announced save/error feedback without unexpectedly moving focus.
- Keep the map schematic and uncluttered; pair its spatial display with labelled controls/details so its information and actions remain available without visual interpretation of the map.

### Handoff notes

- Keep geometry to rectangular approximate metric areas; use the interaction above rather than a freehand/CAD editor. Keep task completion/status out of the first version unless the analyst confirms it as scope.
- No product decision remains blocking for UX/UI. The implementation role owns provider selection and must verify the ticket's privacy, free-tier, export/deletion, and zero-recurring-cost criteria; the interface remains provider-neutral.

## Implementation
### Développeur — implementation complete

- Added a responsive French React/TypeScript web app with **Planning** and **Plan** views. Planning combines a month calendar, selected-day list, and chronological all-task list; personal tasks can be added and existing tasks edited. Seasonal suggestions have stable plant/rule/season identities, retain edits on refresh, and are clearly labelled separately from personal tasks.
- Added a schematic garden plan with rectangular, approximate metric areas. A user can create, select, edit, and reposition a zone by map click/tap or accessible arrow-key placement with Enter/Space confirmation and Escape cancellation. Plant/tree records link a required name/type, planting date, and selected zone.
- Added explicit, on-demand plant advice with provenance and caveats, plus JSON export. Unknown plant names do not receive invented guidance. The plan is intentionally schematic and grows as needed; it does not establish a property boundary or compass orientation.
- Implemented provider-neutral garden records/use cases and a repository port. Without cloud configuration, the application clearly uses browser-local storage only. The optional Supabase adapter uses authenticated access and the included owner-only RLS migration; it stores one private garden JSON document per account. No service-role key or user data is in the repository.
- **Source limitation:** the bundled catalog contains only two regional signals from Velt (strawberries, April–August; asparagus, spring). They are observation/season reminders, not planting or harvest guarantees, and are not a Tournai-specific calendar. Further locally verified facts should be added before describing this as comprehensive local guidance. Source: [Velt seasonal calendar](https://velt.nu/seizoenskalender), reviewed 24 October 2026.
- **Provider evidence:** official Supabase Free/pricing, production checklist, backup, secure-data/RLS, authentication, region, privacy, and DPA pages are documented in `README.md` (reviewed 24 October 2026). The checked Free tier was advertised at $0/month with example quotas (500 MB database, 50,000 MAU, 5 GB egress, 1 GB file storage, two active Free projects); it can pause a project after a week inactive and does not provide downloadable daily Free backups. The app supports JSON export; the provider documents CLI database dumps and project/account deletion. Zero cost is conditional on staying on Free without paid add-ons and cannot be guaranteed against future provider changes. The privacy policy allows potential international processing; selecting an EU database region does not prove all processing stays in the EEA or establish regulatory compliance.
- **Not yet cleared for live use:** no Supabase account/project, credentials, real-data sync, or hosted application exists. The user must decide whether Supabase’s privacy/international-transfer caveats are acceptable, select the project region, and locally configure the project URL and publishable key (never `service_role`). Cross-device access also needs a separately selected and verified HTTPS static host. The app does not provide real-time push or automatic conflict merging; the latest saved garden loads on open/reload. Do not claim end-to-end sync is validated.

### Implementation handoff boundary

The local application is usable and validated, but production cloud activation is conditional on the user’s privacy/region decision, their own project configuration, and a separate hosting choice. Keep those decisions explicit; do not add sharing, photos, notes, task completion/status, or a broader plant taxonomy.

## Tests
### Développeur validation (24 October 2026)

- `npm run typecheck` — passed.
- `npm test` — passed: 5 test files, 14 tests. Includes garden record/use-case checks, seasonal suggestion stability, UI workflows, keyboard placement and repositioning, Escape cancellation, and persistence failure/retry.
- `npm run build` — passed with Vite 6.4.5.
- `npm audit` — passed, 0 vulnerabilities.
- `git diff --check` — passed.
- `npm run preview -- --host 127.0.0.1`, then an HTTP fetch of `/` — HTTP 200, `lang="fr"`, and a built JavaScript asset served successfully.
- No real Supabase project, credentials, database/RLS integration, multi-device sync, HTTPS host, or automated browser/accessibility audit was available. Those remain unverified; the independent Testeur role should exercise the local app and review the documented boundaries.

Independent Testeur validation pending.

## Review
Pending Relecteur-réfuteur.

## Handoffs and commits
- Analyste -> Architecte: requirements clarified; repository is a workflow scaffold with no app implementation. Define architecture and source strategy for locally relevant recommendations and seasonal tasks without expanding scope. Analyste requirements commit: e5055d4.
- Architecte -> User (blocked; no Designer UX/UI handoff yet): documented a provider-neutral first-version design and locally curated recommendation strategy. Architecture deliverable commit: 10110f28b76b7d3d3b0ac2df6ab364f3cd0b8e95.
- User decision: authorized the implementation role to choose and verify a provider against privacy, free-tier limits, export/deletion, and zero-recurring-cost requirements.
- Coordinator -> Designer UX/UI: unblock UX/UI; keep the interface provider-neutral. UX/UI deliverable should specify accessible responsive planning/map behavior within the approved scope.
- Designer UX/UI -> Développeur: implement the provider-neutral French Planning and Plan interactions, responsive behavior, states, and accessibility expectations documented above; preserve the approved scope and verify storage-provider criteria before relying on a provider. UX/UI deliverable commit: 259ae017533ac4c214ef89ee6f7b068a13a52113.
- Développeur -> Testeur: independently validate the committed local-first app against the approved acceptance criteria, run the relevant checks, and report uncovered gaps without configuring a cloud project or claiming cross-device sync. Implementation and initial validation commit: aaa23513589ad8030659910bdd70dac9cc7caaa0.
