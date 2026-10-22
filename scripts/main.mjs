import { ID, ACTIVITY_ID, tr, get, num, registerSettings, isManaged, managedItem, charges,
  chargeCost, canUse, mirrorInspiration, useFromStar, log } from "./core.mjs";
import { SettingsWindow, ManagerWindow } from "./ui.mjs";

const activeUses=new Set();
const inFlight=new Set();
let manager;

function installActivityGate(){
  const clazz=game.dnd5e?.documents?.activity?.UtilityActivity;
  if(!clazz?.prototype?.use){console.warn(`[${ID}] Unable to wrap UtilityActivity use. Usage protection may be incomplete.`);return;}
  if(clazz.prototype.use._himWrapped)return;
  const original=clazz.prototype.use;
  async function himUse(...args){
    if(!isManaged(this.item) || this.id!==ACTIVITY_ID)return original.apply(this,args);
    const item=this.item;
    if(!canUse(item,{notify:true}))return;
    if(inFlight.has(item.uuid)){ui.notifications.warn(tr("Busy"));return;}
    inFlight.add(item.uuid);
    activeUses.add(item.uuid);
    const before=charges(item);
    try {
      // Deliberately retain the D&D5e native Activity pipeline for consumption + chat.
      const result=await original.apply(this,args);
      if(result && charges(item)===before)console.warn(`[${ID}] Activity returned without visible charge consumption`,item.uuid);
      return result;
    } finally {activeUses.delete(item.uuid);inFlight.delete(item.uuid);}
  }
  himUse._himWrapped=true;
  clazz.prototype.use=himUse;
}

function changeKeys(changes){
  return Object.keys(foundry.utils.flattenObject(changes)).filter(k=>k!=="_id");
}
function itemProtection(item,changes,options,userId){
  if(!isManaged(item)){
    // Protection against changing attunement on *any* item during running combat (player only).
    if(!get("attunementCombatLock") || game.users.get(userId)?.isGM)return;
    const keys=changeKeys(changes);
    if(!keys.includes("system.attuned") && !keys.includes("system.attunement"))return;
    const actor=item.parent;
    if(actor && isActorInActiveCombat(actor)){
      ui.notifications?.warn?.(tr("CombatAttunementBlocked"));return false;
    }
    return;
  }
  const user=game.users.get(userId);
  if(user?.isGM && (options?.himAuthorized || options?.isRest))return;
  if(user?.isGM) return get("gmDirectEdit")?undefined:false;
  if(!get("playerProtection"))return;
  const keys=changeKeys(changes);
  if(!keys.length)return;
  const allowed=new Set(["system.equipped","system.attuned"]);
  if(keys.every(k=>allowed.has(k))){
    if(keys.some(k=>k==="system.attuned") && get("attunementCombatLock") && isActorInActiveCombat(item.parent)){
      ui.notifications?.warn?.(tr("CombatAttunementBlocked"));return false;
    }
    return;
  }
  // Native Activity is permitted to advance spent by the *configured cost* only.
  if(activeUses.has(item.uuid) && keys.length===1 && keys[0]==="system.uses.spent"){
    const incoming=num(foundry.utils.getProperty(changes,"system.uses.spent") ?? changes["system.uses.spent"]);
    if(incoming===num(item.system.uses.spent)+chargeCost())return;
  }
  // The D&D5e long rest pipeline passes isRest=true to embedded item updates.
  if(options?.isRest && keys.length===1 && keys[0]==="system.uses.spent" && get("recovery")!=="none"){
    const incoming=num(foundry.utils.getProperty(changes,"system.uses.spent") ?? changes["system.uses.spent"]);
    if(incoming<=num(item.system.uses.spent))return;
  }
  ui.notifications?.warn?.(tr("Protected"));
  return false;
}
function isActorInActiveCombat(actor){
  if(!actor)return false;
  return game.combats?.contents?.some(combat => combat.started && !combat.ended &&
    combat.combatants.some(c=>c.actor?.id===actor.id)) ?? false;
}

function bindStar(sheet,html){
  const root=html instanceof HTMLElement?html:html?.[0];
  if(!root || !sheet?.actor || sheet.actor.type!=="character" || root.dataset.himStarBound)return;
  root.dataset.himStarBound="1";
  // Capturing listener runs before D&D5e ApplicationV2 action handler.
  root.addEventListener("click",evt=>{
    const target=evt.target.closest?.('[data-action="toggleInspiration"]');
    if(!target)return;
    evt.preventDefault();evt.stopImmediatePropagation();evt.stopPropagation();
    useFromStar(sheet.actor).catch(e=>ui.notifications.error(e.message));
  },true);
  const item=managedItem(sheet.actor);
  root.querySelectorAll('[data-action="toggleInspiration"]').forEach(el=>{
    el.title=tr("StarHint");
    el.classList.toggle("him-has-inspiration",Boolean(item && charges(item)>0));
  });
}

function addDirectoryButton(app,html){
  if(!game.user.isGM)return;
  const root=html instanceof HTMLElement?html:html?.[0];
  if(!root || root.querySelector(".him-directory-btn"))return;
  const anchor=root.querySelector(".directory-header .header-actions")
    ||root.querySelector(".directory-header")||root.querySelector("header")||root;
  const button=document.createElement("button");
  button.type="button";button.className="him-directory-btn";
  button.innerHTML=`<i class="fas fa-star"></i> ${tr("Manager")}`;
  button.addEventListener("click",()=>{manager??=new ManagerWindow();manager.render(true);});
  anchor.appendChild(button);
}

Hooks.once("init",()=>{
  if(game.system.id!=="dnd5e")return;
  registerSettings(SettingsWindow);
});
Hooks.once("ready",()=>{
  if(game.system.id!=="dnd5e")return;
  const v=game.system.version;
  const expected=foundry.utils.isNewerVersion(v,"6.0.0")?"D&D5e 6.x":"D&D5e 5.2.x";
  log(`v0.0.1 ready on Foundry ${game.version}, ${expected} (${v}).`);
  installActivityGate();
  Hooks.on("renderActorDirectory",addDirectoryButton);
  Hooks.on("renderActorDirectoryV2",addDirectoryButton);
  Hooks.on("renderActorSheetV2",bindStar);
  Hooks.on("renderActorSheet",bindStar);
  Hooks.on("preUpdateItem",itemProtection);
  Hooks.on("preDeleteItem",(item,options,userId)=>{
    if(!isManaged(item))return;
    if(!game.users.get(userId)?.isGM && get("playerProtection"))return false;
    if(game.users.get(userId)?.isGM && !get("gmDirectEdit") && !options?.himAuthorized)return false;
  });
  Hooks.on("updateItem",(item)=>{
    if(!isManaged(item) || !game.user.isGM)return;
    mirrorInspiration(item.parent,charges(item)>0).catch(console.warn);
  });
  Hooks.on("updateActor",(actor,change,options)=>{
    if(!game.user.isGM || options?.himMirror || actor.type!=="character")return;
    const changed=foundry.utils.getProperty(change,"system.attributes.inspiration") ?? change["system.attributes.inspiration"];
    if(changed===undefined)return;
    const item=managedItem(actor);
    if(!item)return;
    // Native grants from other system features while zero -> convert once into Item charge.
    if(changed===true && charges(item)===0) {
      import("./core.mjs").then(({adjust})=>adjust(actor,"grant",1)).catch(console.warn);
    } else if(changed===false && charges(item)>0)mirrorInspiration(actor,true).catch(console.warn);
  });
  // Expose a read-only integration point, without replacing the native resource model.
  game.modules.get(ID).api=Object.freeze({getItem:managedItem,getCharges:(actor)=>charges(managedItem(actor)),openManager:()=>{
    if(!game.user.isGM)return;manager??=new ManagerWindow();manager.render(true);
  }});
});
