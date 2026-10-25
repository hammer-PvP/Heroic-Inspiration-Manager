# Heroic Inspiration Manager

**Version 0.1.0** — An independent D&D5e Foundry VTT module for managing Heroic Inspiration charges through a managed Equipment/Trinket Item, native Item Uses, and a Utility Activity.

## Supported target installations

- Foundry VTT 13.351 / D&D5e 5.2.5 — confirmed working by the author in v0.0.3
- Foundry VTT 14.369 / D&D5e 6.0.6 — confirmed working by the author in v0.0.3; v0.1.0 additions require validation

Token Magic FX and Sequencer + free JB2A are entirely optional. The module does not require Character Builder.

## Installation

Paste the stable manifest URL in **Install Module** (after the release has been published):

`https://github.com/hammer-PvP/Heroic-Inspiration-Manager/releases/latest/download/module.json`

For manual installation, copy the release ZIP's contents into `Data/modules/heroic-inspiration-manager/`.

## GM setup

1. Enable Heroic Inspiration Manager in the World.
2. Open its **Settings**, set Item name, maximum charges (fixed or unlimited accumulation), cost per use, Equipped/Attunement requirements, and optional Long Rest recovery, sound, or Token Magic FX.
3. Choose an Item image with the built-in **Browse / Upload** button, or **Restore Default**.
4. Set the **Manager Actor Source** to All, an Actor Directory folder (with optional subfolders), or a native D&D5e Group Actor. These settings constrain only the Manager grid, not world-wide Item synchronization.
5. Optionally select a visual FX engine: **None**, **Token Magic FX**, or **Sequencer + JB2A Free**. If using Sequencer, install both the Sequencer module and **JB2A - Free Content**, then use **Browse** to search the entire installed free JB2A library, filter, preview and confirm a Database path. Choose scale and duration, and test playback on a selected canvas Token. No animations are included in this ZIP.
6. Click **Save and create/sync items** to install missing managed Items for Characters (NPCs optional) and update existing Items without clearing balances.
7. Open **Heroic Inspiration Manager** from the Actors Directory (above Search Actors) or the Settings button.
8. Filter by Actor Type, native D&D5e **Group Actor**, and/or Actor name within the chosen source, then Apply Item, Grant, Revoke, or Set Exact. Selection is cleared on filter changes to prevent unintended batch edits.
9. Players may consume via the Item Activity or via the character sheet Inspiration star. Both refer to the same Item Uses balance. Native Activity use posts a chat declaration.

### JB2A effect browser and multiclass selection

The **Browse** button on the Global FX field and on each of the twelve class rows opens the same standalone JB2A browser based on the approved CTN v1.1.15 selector. This changes only effect selection, not grants, FX timing, or playback.

- The browser retrieves actual installed **free** `jb2a.*` Sequencer Database paths, searches all of them and combines five facets: Category, Color, Shape, Variation and Distance. Each facet defaults to **All**, retaining entries with unknown attributes.
- The filtered results paginate at **100 per page**, with first/previous/next/last controls and a 48 px direct page field.
- Selecting a row plays a **local animated preview within the browser** when a compatible media URL is available. A preview failure does not prevent confirming the database path.
- **Confirm** copies only the selected `jb2a.*` path into the appropriate settings field. **Cancel** does not change that field. Persist settings with the usual **Save** button; no Token, Scene, socket or grant is used by the browser.
- The Global field is the fallback. Each class has its own Browse, clear-to-Global and Test FX controls. The twelve-class section stays **collapsed by default**.
- The compact **Efx from :** selector chooses `Highest Class Level` (default) or `Starting Class`. The latter uses D&D5e `actor.system.details.originalClass` (an embedded class Item ID). Highest Class Level compares class levels; ties prefer the original class, then alphabetical order. **One class** is chosen before looking up an effect; an absent/unrecognized class, missing override or unavailable asset falls directly back to the Global FX (not another class).

**Test FX** (outside the browser) plays on the GM's selected Token, without granting charges, playing reward audio or updating Item Uses. This is separate from the browser's private media preview. Neither the free JB2A assets nor CTN Tile functionality are embedded in this module.

## Human 2024 Resourceful / Long Rest

With the default setting **Long Rest feature identifiers: `resourceful`**, after a successful Long Rest the module grants +1 Heroic Inspiration to a Character owning an Item whose **structured `system.identifier` equals `resourceful`**. This is independent of Item Uses Long Rest recovery and obeys the maximum or unlimited mode.

- This feature does **not** guess based on species name, free-text descriptions, or chat message text.
- If an imported or translated feature does not expose a matching identifier, add its structured Item identifier to the comma-separated setting; do not use its display name. A GM can inspect the identifier on the Item.
- Grant processing runs on the active GM (or asks the active GM over Foundry's module socket when the player completes the rest). A GM must be online for player-initiated grants.
- The D&D5e `restCompleted` / `preLongRest` hooks are used; restoration through nonstandard third-party rest replacements requires an integration test.
- Granting does not play the GM's manual-grant sound/FX.

## Safety and limitations

- Fixed maximum caps the resource; unlimited mode allows the GM to mint additional available charges and **does not grant unlimited free uses**.
- The module marks its own Items with a namespace flag; same-name unmanaged Items are never silently replaced.
- Player Item editing protection is best effort inside normal Foundry clients, **not a server-enforced security boundary against malicious clients**.
- Optional Token Magic FX filters use their own IDs; Sequencer animations are **nonpersistent** and end after their configured duration. Neither engine is required; failures cannot roll back a successful grant.
- The JB2A free library is large and must be installed separately. Assets are not shipped, mirrored, or relicensed with this module.
- The Actor population can be restricted by either a native Actor Directory folder or a D&D5e Group. The in-grid Group filter continues to use Group membership, **not** directory folders.
- Actor management source configuration does not change the explicit **Save and create/sync items** world-wide synchronization behavior.
- A `system.identifier` based Long Rest award is **not guaranteed for unmarked/imported Human features**; test on your actual Character before relying on it.
- Native star reroll automation is not included; players declare use and roll as usual.

## Publishing and community support

- Software license: MIT — see [LICENSE](LICENSE).
- Release history: [CHANGELOG.md](CHANGELOG.md).
- Issues: https://github.com/hammer-PvP/Heroic-Inspiration-Manager/issues
- Repository: https://github.com/hammer-PvP/Heroic-Inspiration-Manager
- Manifest (always latest): https://github.com/hammer-PvP/Heroic-Inspiration-Manager/releases/latest/download/module.json
- Release ZIP filename (always unversioned): `heroic-inspiration-manager.zip`.

For the Foundry official package catalogue, the **author** must review and approve the submitted user-facing strings, description, localization and any promotional materials for compliance with the applicable Foundry AI Content Policy. A technically valid manifest is not approval from the Foundry team. The author remains responsible for understanding the code and meeting the published terms of submission.
