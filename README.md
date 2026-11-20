# Heroic Inspiration Manager

**[Guia em português](README.ptbr.md) · [Release history](CHANGELOG.md) · [Report an issue](https://github.com/hammer-PvP/Heroic-Inspiration-Manager/issues)**

## Heroic Inspiration under the GM's control — using native D&D5e resources

**Heroic Inspiration Manager (HIM)** gives GMs a practical way to award, accumulate, spend, recover and monitor Heroic Inspiration in Foundry VTT. The module creates a managed **Equipment/Trinket Item** on a character, and that Item's native **D&D5e Item Uses** are the single authoritative charge balance.

The module does not decide when a hero *deserves* Inspiration, rewrite D&D5e rules, or maintain a hidden second resource. It handles the logistics around a resource that the GM and the game rules already award.

### Design philosophy

- **One source of truth.** The character-sheet Inspiration star and the managed Item's Utility Activity spend the same charges.
- **GM-defined policy.** The GM configures charge capacity, use cost, recovery, attunement and grants.
- **Use native documents.** Prefer D&D5e Item Uses and Activities over a parallel resource system.
- **Interoperate without hidden privileges.** Importers and character builders should be able to coexist with managed Items, but no external module earns GM authority by setting a flag or naming itself.
- **FX are optional.** Animations and sounds celebrate a grant; they do not govern it.
- **Protect character integrity.** External rebuild operations must preserve Item IDs, charge balances and states; HIM cannot guarantee the transaction behavior of other modules.

## What HIM solves

| Table problem | HIM's answer |
| --- | --- |
| Tracking awards for multiple characters | GM **Manager** to grant, revoke and set exact balances, individually or in bulk |
| Accumulating more than one Inspiration | Configurable fixed maximum or unbounded accumulation, with real per-use cost |
| Inconsistent star and resource states | The native star acts as a shortcut to the managed Item Activity |
| Announcing use without editing counters | Native **Utility Activity** consumption and a Chat declaration |
| Awarding groups of characters | Actor type, folder source, native Group membership and name filters |
| Species features that award Inspiration after a Long Rest | Configurable structured `system.identifier` matching (default `resourceful`) |
| Distinct visual presentation | Optional sound, Token Magic FX or Sequencer with JB2A Free, including class FX |
| Level-up or importer Item reconstruction | **Sheet Only** lets programmatic deletion proceed instead of globally vetoing it; see trade-off below |

## Installation and compatibility

Install with the stable Foundry manifest URL:

`https://github.com/hammer-PvP/Heroic-Inspiration-Manager/releases/latest/download/module.json`

Enable the module in a D&D5e world. The manifest targets **Foundry 13.351–14.369** and **D&D5e 5.2.5–6.0.6**. Validate each integration in the actual world where it will be used. Character Builder, Plutonium, Sequencer and Token Magic FX are **not dependencies** for the core resource manager.

For optional visuals, install **Token Magic FX** or **Sequencer together with JB2A – Free Content**. HIM does not bundle third-party animations.

## Getting started: GM

1. Open **Module Settings → Heroic Inspiration → Settings**. Configure Item name and image, maximum charge mode, charges per use, attunement and Long Rest recovery.
2. Under **Editing restrictions**, enable Player protection and choose **Sheet Only** (interoperability, default) or **Strict** (stronger deletion blocking).
3. Optionally configure award sound and visuals, including Global FX and overrides per class.
4. Use **Save and create/sync items** to install missing managed Items and update their configuration without resetting balances. This action covers eligible world Actors independently of Manager scope.
5. Open the **Heroic Inspiration Manager** above the Actors Directory search control, or from Settings.
6. Filter Actors, select one or many, then use **Apply Item**, **Grant**, **Revoke** or **Set Exact**. The last action is useful for balance migration.

**Manager source versus global sync.** Settings can limit the Manager grid to all Actors, an Actor Directory folder (optionally including children), or a native D&D5e Group. Grid filters further narrow the visible selection; changing filters clears selection to avoid accidental bulk actions. The global sync action is not constrained by this Manager source setting.

## Playing with Heroic Inspiration

The GM creates a managed Heroic Inspiration Item. The character must have it **Equipped** and, if configured, **Attuned** to use it. Players can spend Inspiration using either the **sheet Inspiration star** or the Item's **Utility Activity**. Both use the same Item Uses balance and post a Chat declaration; neither is a manual charge-editing workflow.

The use cost is configurable. The module does not automate advantage or a reroll: apply the normal table rule after declaring the use.

**Fixed maximum** caps charge accumulation. **Unlimited accumulation** removes the fixed cap, *not the charge cost*. Long Rest Item Uses recovery can be None, All or Formula. Independently, a feature Item with a configured `system.identifier` (default `resourceful`) awards +1 Heroic Inspiration on a Long Rest, within the configured cap. This uses structured identifiers rather than species names or descriptions. A GM must be online for player-initiated grant processing.

## Protection and interoperability

The **Block players from editing managed charges and properties** toggle protects direct modifications to the managed Item. Players can normally update its Equipped and Attuned **state**, subject to the combat lock; the GM alone configures whether attunement is **required**.

### Item deletion protection

| Mode | Behavior | Trade-off |
| --- | --- | --- |
| **Sheet Only (default)** | Hides/intercepts the native D&D5e sheet Delete action, without globally vetoing Player-initiated `deleteEmbeddedDocuments` | Actor owners can also delete via macros, console or unsupported custom sheets |
| **Strict** | Blocks all Player-initiated deletion of the managed Item, including scripts | Can conflict with importers and Level Up flows that delete/recreate an inventory |

The separate **Allow GM direct editing** setting remains in effect. The `preUpdateItem` protection still governs Player edits to charges and managed Item configuration. No-op updates are not treated as modifications; harmless sort metadata and other modules' flag namespaces can coexist without modifying HIM's own management flag.

**Sheet Only is a user-interface convenience, not server-enforced security.** Choose it for trusted groups that prioritize compatibility; use Strict where the more restrictive trade-off is required. Passing `characterBuilderLevelUp`, `sourceModule` or similar options is not proof of authority.

### Guidance for developers of external modules

- Prefer **differential Item updates**. Leave unchanged documents intact rather than deleting and recreating the entire collection.
- When rebuilding a managed Item, preserve `_id`, HIM management flags, `system.uses`, Equipped, Attuned and native Activities. Never create a document with an ID still present in the same Actor collection.
- Treat rollback as part of the transaction: capture a trusted snapshot, validate the result and restore safely on failure.
- Avoid editing protected HIM Item properties unnecessarily; Sheet Only permits **deletion**, not unrestricted charge edits.
- An outside importer or level-up module remains responsible for its own transaction and data integrity; HIM does not claim to make arbitrary third-party Item rebuilding atomic.

A read-only integration API is available at `game.modules.get("heroic-inspiration-manager").api`, with `getItem(actor)`, `getCharges(actor)` and `openManager()`. There is no Player API to grant arbitrary charges.

## Optional sound and visual effects

The GM can enable award sound independently of visual FX. Select **None**, **Token Magic FX**, or **Sequencer + JB2A Free** as the visual engine. FX only accompany successful GM grants; FX failures cannot undo a charge grant.

With Sequencer and JB2A Free installed, **Browse** opens the installed `jb2a.*` database effect browser. It searches all indexed paths and combines five optional facets — **Category, Color, Shape, Variation, Distance** — initially set to **All**. Results appear 100 per page with direct navigation. Selecting an effect shows a **local animated preview**, without running FX on the Canvas. **Confirm** copies the path; **Cancel** retains the prior choice. The GM saves Settings separately.

Global FX provides a fallback; each of twelve standard classes may have an override. The class section starts collapsed. For multiclass characters, the compact **Efx from :** selector chooses **Highest Class Level** (default) or **Starting Class**. One class is resolved first, and missing/invalid override falls directly back to Global. **Test FX** runs on the selected Canvas Token without granting charges; it is separate from the browser preview.

## Troubleshooting and responsible operation

- **Item missing:** GM should run **Save and create/sync items**. A same-name unmanaged Item is not silently replaced.
- **Star does nothing:** check Equipped, Attuned (if required), and charge balance.
- **Resourceful award missing:** check the feature's actual structured `system.identifier`, configured identifier list and online GM presence.
- **JB2A animation missing:** verify Sequencer and JB2A Free, use a valid installed `jb2a.*` path and select a Token for Test FX.
- **`_id already exists` during import or Level Up:** a third-party transaction may be rebuilding an Item that remains in the Actor. Check deletion mode and the external transaction; do not discard safety backups or clear another module's safety locks without verifying character integrity.
- **Before upgrading or changing integrations:** back up your world and test with a real Player account, not only a GM session.

HIM does not include JB2A assets, change Character Builder or Plutonium, replace D&D5e Inspiration rules, or provide a generic GM-authorized socket transaction layer. Compatibility with any particular external workflow must be validated in practice.

**Repository:** https://github.com/hammer-PvP/Heroic-Inspiration-Manager  
**Issues:** https://github.com/hammer-PvP/Heroic-Inspiration-Manager/issues  
**Version changes:** [CHANGELOG.md](CHANGELOG.md) (all release changes belong there, not in this guide)  
**License:** [MIT](LICENSE)

Submission to Foundry's official module catalogue, including appropriate review of descriptions and other materials, is the author's responsibility.
