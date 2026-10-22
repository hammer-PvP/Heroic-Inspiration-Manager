# Heroic Inspiration Manager

**Version 0.0.1 — initial testing release**

An independent Foundry VTT module for tracking Heroic Inspiration as a managed D&D5e Equipment / Trinket with native Item Uses and a Utility Activity.

## Compatibility

- Foundry VTT **13.351** with D&D5e **5.2.5** (target configuration).
- Foundry VTT **14.369** with D&D5e **6.0.6** (target configuration).
- Token Magic FX is **optional**; absence does not disable the item, manager or audio.

This release was source-inspected and statically checked; it has **not** been tested inside a live Foundry installation. Back up your world before installing on an existing campaign.

## Installing

Install via the official manifest URL after the GitHub release is published:

`https://github.com/hammer-PvP/Heroic-Inspiration-Manager/releases/latest/download/module.json`

For manual installation, place the package contents (including `module.json` at the package root) in `Data/modules/heroic-inspiration-manager/` and enable the module in the World.

## First use

1. As GM, open **Configure Settings → Heroic Inspiration → Settings**.
2. Set fixed or unlimited accumulation, per-use cost, Long Rest recovery and optional sound/FX.
3. Open the **Actors** directory and click **Heroic Inspiration**.
4. Select individual, multiple or all eligible actors, and choose **Apply item**.
5. Use **Grant**, **Revoke** or **Set exact** for starting balances or migrations.
6. Equip the item; optionally attune if that rule is enabled.
7. Use the star on the character sheet or the Item Utility Activity to consume charges and announce usage in chat.

### Unlimited accumulation

Unlimited means **no accumulation cap**, not free/infinite spending. The D&D5e `UsesField` requires a numeric maximum. The module tracks total allocated charges in `uses.max` and total spent charges in `uses.spent`, so **available = max − spent** and grants may increase `max` without a cap. The native Item sheet will display its technical totals. The Manager shows the balance with an unlimited-cap indicator.

### Attunement

D&D5e disables attunement on nonmagical equipment. To make optional native attunement work, enabling **Require Attunement** also marks the managed Trinket as magical (`mgc`). The item has no extra magical bonuses or effects from this property.

### Player protection

The module blocks normal player edits to managed item properties while still permitting native Activity consumption and legitimate rest recovery. This is **client-side protection**, not a security boundary against modified client code. GM discretion and Foundry document permissions remain essential.

### Existing inspiration

Existing native inspiration should be manually converted by the GM using **Set exact**. External features that toggle the native inspiration flag from false to true can be converted when no managed charge is present. A native boolean cannot reliably signal additional grants while already true; the GM should use Grant in those cases.

### FX & audio

FX/sound run only for successful **GM Grant** actions. Token Magic FX requires a matching installed and enabled module. Effects are temporary and cleaned up using filter IDs specific to each grant. The sound plays once per bulk grant. Missing tokens, sound assets or Token Magic FX do not invalidate a grant.

## Version and release files

- Module ID: `heroic-inspiration-manager`
- Repository: https://github.com/hammer-PvP/Heroic-Inspiration-Manager
- Tag: `v0.0.1`
- Release ZIP: `heroic-inspiration-manager.zip`
- Release manifest: `module.json`

