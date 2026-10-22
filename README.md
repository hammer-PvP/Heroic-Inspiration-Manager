# Heroic Inspiration Manager

**Version 0.0.2**

Heroic Inspiration charges managed through a D&D5e Equipment/Trinket, native Item Uses and a Utility Activity.

## Supported target configurations

- Foundry VTT 13.351 / D&D5e 5.2.5
- Foundry VTT 14.369 / D&D5e 6.0.6

Token Magic FX is optional. The module does not depend on the Character Builder.

## Install

Use the GitHub release manifest, once published:

`https://github.com/hammer-PvP/Heroic-Inspiration-Manager/releases/latest/download/module.json`

For manual installation, extract the ZIP's contents into:

`Data/modules/heroic-inspiration-manager/`

Enable the module in your World.

## GM setup

1. Open **Configure Settings → Heroic Inspiration → Settings**.
2. Choose a fixed maximum or **no accumulation limit**. Configure cost, attunement, rest recovery, and optional audio/FX.
3. Choose **Save and create/sync items**. This creates absent managed items for Characters and updates existing ones; **Include NPCs** is optional. Existing balances are preserved or capped to a reduced configured maximum.
4. Open the **Heroic Inspiration Manager** using the Actors Directory button or **Open Manager** from Settings.
5. Select Characters/NPCs and use **Apply item**, **Grant**, **Revoke**, or **Set exact**.
6. Characters can consume charges using the native Item Activity or their sheet's Inspiration star.

The Inspiration star is an alternative use control, not an independent pool. Usage publishes the native Activity message in chat.

## Notes

- Unlimited accumulation does **not** mean unlimited free use: available charges are tracked in the native Item Uses fields. The GM may grant additional charges without a configured cap.
- The module uses an identifying Item flag. A non-managed Item with the same name will not be silently replaced.
- Players are restricted from editing managed properties through normal interface updates. This is a client-side restriction and does not provide an authoritative server-side security boundary against modified clients.
- Existing native Inspiration should be migrated deliberately through **Set exact**. A native boolean cannot represent several accumulated charges.
- Optional FX is temporary, uses the configured preset and duration, and does not touch unrelated token filters.

## v0.0.2

- Improved Actor Directory button insertion in V13/V14 and added direct access through Settings.
- Settings synchronization now creates missing Items and reports created, updated and failed counts.
- Added explicit NPC inclusion for Settings synchronization; Characters remain the default.
- Preserved balances on reconciliation and prevented duplicate managed Items.
- Kept valid Activity consumption available to GMs when direct editing is disabled.

Repository: https://github.com/hammer-PvP/Heroic-Inspiration-Manager
