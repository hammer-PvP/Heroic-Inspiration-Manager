# Heroic Inspiration Manager

**Version 0.0.3** — An independent D&D5e Foundry VTT module for managing Heroic Inspiration charges through a managed Equipment/Trinket Item, native Item Uses, and a Utility Activity.

## Supported target installations

- Foundry VTT 13.351 / D&D5e 5.2.5 — **targeted; pending real-world QA**
- Foundry VTT 14.369 / D&D5e 6.0.6 — tested by the author during the 0.0.2 series; new 0.0.3 changes require validation

Token Magic FX is entirely optional. The module does not require Character Builder.

## Installation

Paste the stable manifest URL in **Install Module** (after the release has been published):

`https://github.com/hammer-PvP/Heroic-Inspiration-Manager/releases/latest/download/module.json`

For manual installation, copy the release ZIP's contents into `Data/modules/heroic-inspiration-manager/`.

## GM setup

1. Enable Heroic Inspiration Manager in the World.
2. Open its **Settings**, set Item name, maximum charges (fixed or unlimited accumulation), cost per use, Equipped/Attunement requirements, and optional Long Rest recovery, sound, or Token Magic FX.
3. Choose an Item image with the built-in **Browse / Upload** button, or **Restore Default**.
4. Click **Save and create/sync items** to install missing managed Items for Characters (NPCs optional) and update existing Items without clearing balances.
5. Open **Heroic Inspiration Manager** from the Actors Directory (above Search Actors) or the Settings button.
6. Filter by Actor Type and/or native D&D5e **Group Actor**, then Apply Item, Grant, Revoke, or Set Exact. Selection is cleared on filter changes to prevent unintended batch edits.
7. Players may consume via the Item Activity or via the character sheet Inspiration star. Both refer to the same Item Uses balance. Native Activity use posts a chat declaration.

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
- Optional token filters are temporary and use their own IDs. Token Magic FX is never a hard dependency.
- Group filters read D&D5e Group Actor membership, **not Actor Directory folders**.
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
