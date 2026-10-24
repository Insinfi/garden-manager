# Ticket: Beginner-friendly potager planner

## Status
- Current role: Architecte
- State: Blocked — awaiting user decision on the online storage provider

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
- Repository audit: the repository currently contains workflow documentation, agent definitions, and skills, but no application source code, tests, or runtime configuration.

## Blocking questions
- Storage provider/selection authority: should the user name the provider, or authorize the implementation role to select and verify a compliant option? See the architecture decision below. UX/UI handoff is paused until resolved.

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

- **Storage strategy:** private, single-owner hosted data with sign-in/authorization on every read and write; no public or unguessable-link access. A provider adapter/repository keeps data portable and limits vendor coupling. Choose a managed option only after confirming its current free-tier limits, retention/backup and export/deletion path, service availability/sleep behavior, authentication, and whether expected personal use can remain at zero recurring cost. Do not promise unlimited or permanent free storage. No provider is selected in the approved ticket; selection affects privacy, auth, availability, migration, and ongoing-cost risk and is a material decision. The ticket is blocked pending the user's preference or explicit permission for the implementation role to select a compliant option after verification.
- **Guidance strategy:** curate and version the small set of facts/rules needed for the first version from reliable Belgian or locally applicable horticultural sources. Store source name/URL, review date/version, regional/seasonal applicability, and any caveat alongside each rule. Keep the rule engine deterministic and independent of the presentation and persistence vendor. Avoid scraping or depending on a live external recommendation API in v1: that would add availability, licensing, freshness, and factual-quality failure modes without being required by the ticket. Do not ship unsupported universal advice; review/refresh catalog entries deliberately and omit facts that cannot be sourced confidently.

### Interfaces and failure/migration concerns

Keep application-facing interfaces small and semantic: garden/area/plant repositories; task read/write operations; a guidance catalog query; and use cases such as save plant, list tasks for a period, refresh seasonal suggestions, and request advice. Concrete method names and framework choices should follow the implementation environment once selected; avoid speculative generic abstractions.

- Surface save/sync failures and preserve the user's unsaved edits for retry; do not report a successful save until the hosted service confirms it. Offline editing and background conflict resolution are not acceptance requirements.
- Handle unavailable/expired authentication and provider limits as recoverable errors; never fall back to public access or silently discard user data. Define export/deletion and recovery capabilities when selecting the provider.
- Keep provider IDs out of domain identity where practical and include a schema/catalog version. If storage later changes, an explicit export/import migration can map garden, area, plant, and task records; do not build multi-provider migration tooling for v1.
- Catalog unavailability should not prevent viewing/editing saved garden data. If the curated catalog is bundled with the app, task generation/guidance uses the shipped version and displays its provenance; update content with app releases rather than silently changing advice remotely.

### Design tradeoffs and next-role guidance

This is a lightweight Clean Architecture boundary (presentation → application/domain → ports, with provider/catalog adapters), not a mandate for multiple deployables or layers per entity. It isolates the only substantial external dependency while keeping a small first-version app easy to implement. SOLID is applied chiefly through dependency inversion at persistence and guidance boundaries; additional abstractions would add ceremony without a second implementation. Atomic Design is appropriate within the UI for shared controls and composed views, but does not define backend or domain boundaries.

UI design applies: the Designer UX/UI should define the responsive French Planning/Plan flows, accessible PC and phone editing, map area creation/selection and metric sizing, task/calendar interactions, and the explicit request path for advice. Keep it to requirements already approved; do not add sharing, photos, notes, or proactive recommendations. Coordinate with the developer on minimal area geometry and task-edit/status behavior. **Do not advance to UX/UI until the storage-provider blocker below is resolved.**

### Blocking decision for user

The ticket requires private personal cross-device sync at no recurring cost, but does not name a hosted provider or authorize the team to choose one. Which should we do?
1. Use a provider you name (please specify it); or
2. Authorize the implementation role to select and verify a provider that meets the ticket's privacy, free-tier, export/deletion, and zero-recurring-cost constraints.

Until answered, no provider-specific architecture or next-role handoff is approved.

## UX/UI
Pending Designer UX/UI.

## Implementation
Pending Développeur.

## Tests
Pending Testeur.

## Review
Pending Relecteur-réfuteur.

## Handoffs and commits
- Analyste -> Architecte: requirements clarified; repository is a workflow scaffold with no app implementation. Define architecture and source strategy for locally relevant recommendations and seasonal tasks without expanding scope. Analyste requirements commit: e5055d4.
- Architecte -> User (blocked; no Designer UX/UI handoff yet): documented a provider-neutral first-version design and locally curated recommendation strategy. Await a decision on the hosted storage provider/selection authority before advancing. Architecture deliverable commit hash will be recorded in the follow-up handoff bookkeeping commit.
