# Agent team workflow

This repository uses six role-specific agents in a ticket-driven, sequential workflow. The primary agent coordinates the handoffs; the role agents do not run concurrently on the same ticket.

## Product context

Garden Manager is intended to help people plan and manage a garden. The product direction includes drawing a garden plan, adding and managing individual trees and plants, attaching photos and notes, and sharing plans between users. Plans should be saveable using a free storage option. The design should remain open to additional capabilities as needs emerge.

This is product context, not a complete feature specification or a commitment to a particular framework, storage provider, pricing model, or sharing permission scheme. For each ticket, Analyste clarifies the decisions that affect its scope; do not silently turn this vision into assumptions.

## Ticket workflow

1. Create `tickets/<short-topic>.md` from `tickets/TEMPLATE.md`. Keep requirements, decisions, progress, and handoffs in that ticket.
2. Run **Analyste** first. It identifies missing information and asks the user for every decision that materially affects scope or acceptance. Do not proceed until blocking questions are answered.
3. Hand the ticket to **Architecte**, then **Designer UX/UI**, **Développeur**, **Testeur**, and **Relecteur-réfuteur**, in that order. A role may mark its section not applicable with a reason; do not silently skip it.
4. Each role reads the ticket and preceding decisions before acting, updates its section and the handoff record, and leaves the ticket ready for the next role. The coordinator communicates blockers and user questions instead of guessing.
5. Each role commits its completed deliverables on the ticket's branch using a message that includes the ticket slug and role. Include the ticket update in that commit. Record the completed commit in the next handoff entry; a commit cannot record its own hash in its contents.
6. If **Relecteur-réfuteur** finds a blocking issue, return the ticket to the responsible role, record the reason and findings, and repeat the affected handoffs and review. Do not mark the ticket complete while blocking findings remain.

Keep changes within the agreed ticket scope. The architect documents relevant boundaries and tradeoffs; SOLID, Clean Architecture, and Atomic Design are applied where they fit, not imposed where they do not. The designer records interface behavior and accessibility expectations when a UI is involved. The developer follows those decisions and notes any necessary deviation in the ticket. The tester adds and runs feature-appropriate tests. The reviewer independently checks behavior, tests, and alignment with the ticket and recorded design decisions.

## Reusable skills

Read the relevant skill before working in its area; skills provide domain guidance and do not replace ticket decisions or role responsibilities.

- `garden-domain` for plant and garden concepts, especially Analyste, Architecte, and Relecteur-réfuteur.
- `garden-planning-ux` for drawing and navigating a garden plan, especially Designer UX/UI and Développeur.
- `garden-records` for plant/tree records, notes, and photos, especially Architecte, Développeur, and Testeur.
- `sharing-and-storage` for saved plans, sharing, access, and storage tradeoffs, especially Analyste and Architecte.
- `accessible-interface` for accessible interaction and visual interface behavior, especially Designer UX/UI, Développeur, Testeur, and Relecteur-réfuteur.

## Role profiles

- [Analyste](.github/agents/analyste.agent.md)
- [Architecte](.github/agents/architecte.agent.md)
- [Designer UX/UI](.github/agents/designer-ux-ui.agent.md)
- [Développeur](.github/agents/developpeur.agent.md)
- [Testeur](.github/agents/testeur.agent.md)
- [Relecteur-réfuteur](.github/agents/relecteur-refuteur.agent.md)
