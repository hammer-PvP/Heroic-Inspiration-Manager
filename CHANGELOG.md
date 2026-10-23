# Changelog

## v0.0.4 (2026-10-23)

- Add optional **Sequencer + free JB2A** visual effects for GM-granted Heroic Inspiration, with a dynamically discovered, searchable list of installed free JB2A database animations, scale and duration controls, and test playback.
- Keep Token Magic FX as an alternative visual engine; only one engine is selected at a time, or disable visuals entirely. Grant sound remains independent.
- Add GM configuration for the Manager's Actor population: all eligible Actors, a specified Actor Directory folder (optionally including subfolders), or a specified native D&D5e Group.
- Preserve type and Group filters inside the Manager, add a name search, and keep bulk operations restricted to currently visible, selected Actors.
- Preserve existing Item Uses, star, Activities, Resourceful, FX and settings behavior; do not bundle third-party media.
- Add collapsible Class-specific FX for 12 standard classes, with per-class animation previews, a global fallback, and deterministic multiclass priority.
- Use fully qualified Sequencer database paths and omit known Patreon-only assets from the free list.

## v0.0.3 (2026-10-22)

- Move Actor Directory control into the header above the search field.
- Filter Manager actors by native D&D5e Group membership, combined with Actor Type; clear selection when changing filters.
- Select/upload/reset managed Item icon through Foundry FilePicker.
- Add Long Rest +1 Heroic Inspiration for actors with configured structured feature identifiers (default `resourceful`) using D&D5e rest hooks, routed via active GM when needed.
- Add MIT license, publication metadata, and documentation.
- Preserve optional Token Magic FX behavior.

## v0.0.2 (2026-10-22)

- Repair manager access from Actor Directory; provide access in Settings.
- Create absent managed Items during synchronization; preserve balances.
- Count synchronization outcomes; optional NPC inclusion.

## v0.0.1 (2026-10-22)

- Initial experimental release.

