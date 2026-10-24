---
name: garden-records
description: Shape useful, extensible records for garden plants, trees, notes, and photos.
---

# Garden records

- Keep the user's garden entity distinct from the plant or tree identity: one species or cultivar may have multiple individual instances in a garden.
- Only collect fields that support an agreed user task. Potential fields include user-facing name, optional botanical identification, location in the plan, planting date, and user-maintained notes; confirm scope before adding them.
- Preserve user-authored notes and observations as user content, not verified horticultural recommendations.
- Treat photos as user-owned content. Consider upload size, supported formats, loading and failure states, deletion, and any metadata or privacy implications when the ticket touches images.
- Use stable identity and clear relationships between garden plans, locations, individual plants, notes, and photos when required by the agreed feature.
- Keep the model extensible without preemptively building a generalized taxonomy or inventory system.
