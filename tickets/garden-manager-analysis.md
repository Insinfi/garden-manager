# Ticket: Beginner-friendly potager planner

## Status
- Current role: Architecte
- State: Ready for architecture

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
None currently. The user has clarified the product scope and key behavioral decisions.

## Acceptance criteria
- The application offers French-language Planning and Plan views, readable on phone and usable for editing on PC and phone.
- The user can create a simple garden map with clickable/selectable areas, approximate metric dimensions, and plant/tree records linked to an area and planting date.
- Planning presents both a to-do list and a calendar, generates editable seasonal tasks from recorded plants, and supports personal to-dos.
- Crop and care recommendations are provided on request, with locally relevant information for Tournai and no unsolicited recommendation interruptions.
- Personal garden data syncs between the user's own devices using a no-recurring-cost online storage option.
- No other-user sharing, photos, or notes are required for the first version.

## Architecture
Pending Architecte.

## UX/UI
Pending Designer UX/UI.

## Implementation
Pending Développeur.

## Tests
Pending Testeur.

## Review
Pending Relecteur-réfuteur.

## Handoffs and commits
- Analyste -> Architecte: requirements clarified; repository is a workflow scaffold with no app implementation. Define architecture and source strategy for locally relevant recommendations and seasonal tasks without expanding scope. Analysis commit recorded in the subsequent handoff update.
