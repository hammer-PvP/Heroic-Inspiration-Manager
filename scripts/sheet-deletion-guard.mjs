/**
 * Heroic Inspiration Manager — Sheet Only deletion guard.
 *
 * This is a UI convenience restriction, NOT a security boundary: an Actor OWNER
 * can still request Item deletion using scripts or another module's API.
 * No preDeleteItem options, module names or remote transaction flags are trusted.
 * Keep Item update/charge protection in main.mjs independent of this guard.
 */
import { get, isManaged, tr } from "./core.mjs";

const DELETE_ACTIONS = new Set(["delete", "deleteDocument", "deleteItem", "removeItem"]);
const DELETE_CONTEXT_NAMES = new Set(["DND5E.ContextMenuActionDelete"]);
const BOUND = new WeakMap();

function enabled() {
  return !game.user?.isGM && get("playerProtection") && get("deletionProtection") === "sheet";
}

function elementOf(html) {
  if (typeof HTMLElement === "undefined") return null;
  return html instanceof HTMLElement ? html : html?.[0] instanceof HTMLElement ? html[0] : null;
}

function actorAndItem(app) {
  const document = app?.document ?? null;
  if (document?.documentName === "Item" && document?.parent?.documentName === "Actor") {
    return { actor: document.parent, standaloneItem: document };
  }
  const item = app?.item;
  if (item?.documentName === "Item" && item?.parent?.documentName === "Actor" && app?.documentName !== "Actor") {
    return { actor: item.parent, standaloneItem: item };
  }
  const actor = document?.documentName === "Actor" ? document
    : app?.actor?.documentName === "Actor" ? app.actor : null;
  return { actor, standaloneItem: null };
}

function itemFromNode(actor, node) {
  if (!actor?.items || !node) return null;
  let element = node;
  while (element?.nodeType === 1) {
    const dataset = element.dataset ?? {};
    for (const id of [dataset.itemId, dataset.documentId, dataset.entryId]) {
      if (id && actor.items.get(id)) return actor.items.get(id);
    }
    const uuid = dataset.uuid ?? dataset.documentUuid;
    if (typeof uuid === "string" && uuid.startsWith(`${actor.uuid}.Item.`)) {
      const id = uuid.slice(`${actor.uuid}.Item.`.length).split(".")[0];
      if (actor.items.get(id)) return actor.items.get(id);
    }
    element = element.parentElement;
  }
  return null;
}

function targetItem(actor, standaloneItem, action) {
  // On an embedded Item sheet, the Item itself is the target of its header
  // Delete action. On an Actor sheet, require a precise Item row reference.
  return itemFromNode(actor, action) ?? standaloneItem;
}

function blockedAction(actor, standaloneItem, button) {
  if (!enabled()) return false;
  if (!DELETE_ACTIONS.has(String(button?.dataset?.action ?? ""))) return false;
  return isManaged(targetItem(actor, standaloneItem, button));
}

function prevent(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();
  ui.notifications?.warn?.(tr("Protected"));
}

function hideDeleteControls(root, actor, standaloneItem) {
  if (!enabled()) return;
  for (const button of root.querySelectorAll("[data-action]")) {
    if (!blockedAction(actor, standaloneItem, button)) continue;
    button.hidden = true;
    button.setAttribute("aria-hidden", "true");
  }
}

function protectRenderedSheet(app, html) {
  // ApplicationV2.element includes window header controls that may sit outside
  // the rendered content passed as `html`. Prefer the complete window.
  const root = elementOf(app?.element) ?? elementOf(html);
  if (!root) return;
  const { actor, standaloneItem } = actorAndItem(app);
  if (!actor?.items || !actor.isOwner) return;
  // Bind only when the setting applies and to the correct sheet root. Re-render
  // refreshes the controls without duplicating capturing listeners.
  if (!enabled()) return;
  const stored = BOUND.get(root);
  if (!stored || stored.actor !== actor || stored.standaloneItem !== standaloneItem) {
    if (stored) root.removeEventListener("click", stored.listener, true);
    const listener = event => {
      const button = event.target?.closest?.("[data-action]");
      if (button && blockedAction(actor, standaloneItem, button)) prevent(event);
    };
    root.addEventListener("click", listener, true);
    BOUND.set(root, { actor, standaloneItem, listener });
  }
  hideDeleteControls(root, actor, standaloneItem);
}

function guardNativeItemContext(item, options) {
  if (!enabled() || !isManaged(item) || !Array.isArray(options)) return;
  for (let i = options.length - 1; i >= 0; i--) {
    const option = options[i] ?? {};
    const name = String(option.name ?? "");
    const action = String(option.action ?? option.id ?? "");
    if (DELETE_CONTEXT_NAMES.has(name) || DELETE_ACTIONS.has(action)) options.splice(i, 1);
  }
}

export function installSheetDeletionGuard() {
  // V13/V14 ApplicationV2 and legacy actor/item sheet hooks may overlap;
  // WeakMap guards prevent duplicate event registration on the same root.
  Hooks.on("renderApplicationV2", protectRenderedSheet);
  Hooks.on("renderActorSheetV2", protectRenderedSheet);
  Hooks.on("renderItemSheetV2", protectRenderedSheet);
  Hooks.on("renderActorSheet", protectRenderedSheet);
  Hooks.on("renderItemSheet", protectRenderedSheet);
  Hooks.on("dnd5e.getItemContextOptions", guardNativeItemContext);
}

// Deliberately exported for offline non-Foundry regression tests.
export const sheetDeletionInternals = Object.freeze({
  enabled, actorAndItem, itemFromNode, blockedAction, guardNativeItemContext, protectRenderedSheet
});
