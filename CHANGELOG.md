# Changelog

## v0.1.1 (2026-11-02)

- Add a compact, GM-configurable **Item deletion protection** policy: **Sheet Only** (default) or **Strict** (prior behavior). The existing `playerProtection` toggle continues to control whether Player protection is enabled.
- In Sheet Only mode, hide and intercept native D&D5e Actor/Item-sheet deletion actions and remove the managed Item's native Delete context menu option. Remove the global `preDeleteItem` veto only for Player deletion; module-driven Item reconstruction no longer encounters the HIM deletion block.
- Preserve `preUpdateItem` charge/property safeguards, GM direct-edit policy, equipped/attuned behavior, native Activities, Manager, rest, FX and JB2A browser.
- Explicitly document the UI-only protection trade-off: Player macros, console calls and third-party interfaces may still delete the Item. This mode is intended for trusted tables prioritizing interoperability; Strict is available for more restrictive use.
- Fix the startup log to report the installed version instead of the former hard-coded `v0.0.4` label.

## v0.1.0 (2026-10-24)

- Replace limited JB2A selects with the approved CTN-style independent effect browser: full text search, Category/Color/Shape/Variation/Distance facets (All by default), 100-per-page pagination, direct page access and private animated preview.
- Add an explicit **Confirm / Cancel** selection step for both Global FX and each of the 12 class overrides. The picker returns only an installed free JB2A Database path; no Tile or Canvas logic is imported.
- Add compact **Efx from :** selector with `Highest Class Level` as default and `Starting Class` as an option, reading the D&D5e original-class Item ID; apply a strict Global fallback after choosing a single class.
- Preserve the original Sequencer playback, class FX testing, Token Magic FX, sound, Actor management and Item/Long Rest behavior.
- Keep optional FX modules optional, include no third-party animation assets, and maintain stable GitHub latest release filenames.

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

