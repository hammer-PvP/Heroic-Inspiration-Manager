import { ID, ACTIVITY_ID, tr, get, num, registerSettings, isManaged, managedItem, charges,
  chargeCost, canUse, mirrorInspiration, useFromStar, restGrantSources, adjust, log } from "./core.mjs";
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
  const keys=changeKeys(changes);
  // A legitimate native Activity must be allowed for both GM and players,
  // regardless of whether direct item editing is permitted.
  if(activeUses.has(item.uuid) && keys.length===1 && keys[0]==="system.uses.spent"){
    const incoming=num(foundry.utils.getProperty(changes,"system.uses.spent") ?? changes["system.uses.spent"]);
    if(incoming===num(item.system.uses.spent)+chargeCost())return;
  }
  if(user?.isGM) return get("gmDirectEdit")?undefined:false;
  if(!get("playerProtection"))return;
  if(!keys.length)return;
  const allowed=new Set(["system.equipped","system.attuned"]);
  if(keys.every(k=>allowed.has(k))){
    if(keys.some(k=>k==="system.attuned") && get("attunementCombatLock") && isActorInActiveCombat(item.parent)){
      ui.notifications?.warn?.(tr("CombatAttunementBlocked"));return false;
    }
    return;
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

// ActorDirectory is a nested ApplicationV2 tab in Foundry V13/V14. It may
// render before `ready`, so attach using early hooks AND the already-rendered tab.
function openManager(){
  if(!game.user.isGM)return;
  manager??=new ManagerWindow();
  return manager.render(true);
}
function elementOf(value){
  return value instanceof HTMLElement ? value : value?.[0] instanceof HTMLElement ? value[0] : null;
}
function isActorDirectory(app){
  return app===game.actors?.directory || app===ui.actors ||
    app?.tabName==="actors" || app?.options?.id==="actors" ||
    app?.constructor?.name==="ActorDirectory";
}
function addDirectoryButton(root){
  if(!game.user?.isGM || !root || root.querySelector(".him-directory-btn"))return;
  const header=root.matches?.(".directory-header") ? root :
    root.querySelector(".directory-header, [data-part='header'], .directory-header-buttons, .header-actions");
  const button=document.createElement("button");
  button.type="button";
  button.className="him-directory-btn";
  button.innerHTML=`<i class="fas fa-star"></i> ${tr("Manager")}`;
  button.addEventListener("click",event=>{event.preventDefault();openManager();});
  // Place before the search control, not between search and the folders.
  const searchInput=root.querySelector('input[type="search"], input[name="search"], input[placeholder*="Search"], input[placeholder*="Buscar"]');
  const searchContainer=searchInput?.closest(".header-search, .directory-search, .search, .search-bar, form") || searchInput?.parentElement;
  const searchArea=root.querySelector(".header-search, .directory-search, .search-bar");
  const anchor=searchContainer || searchArea;
  if(anchor?.parentElement && root.contains(anchor)) anchor.insertAdjacentElement("beforebegin",button);
  else if(header) header.prepend(button);
  else root.prepend(button);
}

function directoryRoots(){
  const candidates=[game.actors?.directory?.element,ui.actors?.element,
    document.querySelector("#actors"),document.querySelector("#sidebar-tab-actors"),
    document.querySelector('.sidebar-tab[data-tab="actors"]')];
  return [...new Set(candidates.map(elementOf).filter(Boolean))];
}
function refreshDirectoryButton(){
  if(!game.user?.isGM)return;
  for(const root of directoryRoots())addDirectoryButton(root);
}
function directoryRenderHook(app,html){
  if(!game.user?.isGM)return;
  if(isActorDirectory(app)){
    addDirectoryButton(elementOf(html));
    refreshDirectoryButton();
  } else if(app?.constructor?.name==="Sidebar") {
    const root=elementOf(html);
    for(const child of root?.querySelectorAll?.('#actors, #sidebar-tab-actors, .sidebar-tab[data-tab="actors"]')??[])
      addDirectoryButton(child);
  }
}
let directoryRefreshQueued=false;
function observeActorDirectory(){
  if(!game.user?.isGM)return;
  refreshDirectoryButton();
  const target=document.querySelector("#sidebar") || document.body;
  if(!target)return;
  const observer=new MutationObserver(()=>{
    if(directoryRefreshQueued)return;
    directoryRefreshQueued=true;
    queueMicrotask(()=>{directoryRefreshQueued=false;refreshDirectoryButton();});
  });
  observer.observe(target,{childList:true,subtree:true});
}
// Register before the first render, not after the system has reached `ready`.
Hooks.on("renderActorDirectory",directoryRenderHook);
Hooks.on("renderActorDirectoryV2",directoryRenderHook);
Hooks.on("renderApplicationV2",(app,html)=>{
  directoryRenderHook(app,html);
  if(app?.actor?.type==="character")bindStar(app,html);
});


// Rest grants use feature identifiers (not species names or HTML descriptions).
// Route player-initiated rest completion to the active GM for an authorized Item update.
const pendingLongRests=new Map();
const handledRestMessages=new Set();
function checkLongRest(actor,result,config){
  const data=[config?.type,config?.restType,result?.type,result?.restType]
    .map(x=>String(x??"").toLowerCase());
  if(data.some(x=>["long","longrest","long-rest","lr"].includes(x)))return true;
  if(config?.longRest===true || result?.longRest===true || result?.isLongRest===true)return true;
  return (pendingLongRests.get(actor.uuid) || 0)>Date.now()-3600000;
}
async function processRestGrant({actorUuid,nonce}){
  if(!game.user.isGM || (game.users.activeGM && game.users.activeGM.id!==game.user.id))return;
  if(!nonce || handledRestMessages.has(nonce))return;
  handledRestMessages.add(nonce);
  if(handledRestMessages.size>500)handledRestMessages.clear();
  const actor=await fromUuid(actorUuid);
  if(!actor || actor.type!=="character" || !restGrantSources(actor).length)return;
  try{
    const result=await adjust(actor,"grant",1);
    if(result?.added>0) console.info(`[${ID}] Long Rest feature granted Heroic Inspiration:`,actor.name,result.after);
  }catch(e){console.warn(`[${ID}] Unable to apply Long Rest inspiration:`,e);}
}
function setupRestGrants(){
  const channel=`module.${ID}`;
  game.socket?.on(channel,message=>{
    if(message?.kind!=="longRestFeatureGrant" || !game.user.isGM)return;
    processRestGrant(message).catch(console.warn);
  });
  Hooks.on("dnd5e.preLongRest",actor=>{
    if(actor?.uuid)pendingLongRests.set(actor.uuid,Date.now());
  });
  Hooks.on("dnd5e.preShortRest",actor=>{
    if(actor?.uuid)pendingLongRests.delete(actor.uuid);
  });
  Hooks.on("dnd5e.restCompleted",(actor,result,config)=>{
    if(!actor?.uuid)return;
    const longRest=checkLongRest(actor,result,config);
    pendingLongRests.delete(actor.uuid);
    if(!longRest || !restGrantSources(actor).length)return;
    const message={kind:"longRestFeatureGrant",actorUuid:actor.uuid,nonce:foundry.utils.randomID()};
    if(game.user.isGM && (!game.users.activeGM || game.users.activeGM.id===game.user.id)){
      processRestGrant(message).catch(console.warn);
    } else game.socket?.emit(channel,message);
  });
}
Hooks.once("init",()=>{
  if(game.system.id!=="dnd5e")return;
  registerSettings(SettingsWindow);
});
Hooks.once("ready",()=>{
  if(game.system.id!=="dnd5e")return;
  const v=game.system.version;
  const expected=foundry.utils.isNewerVersion(v,"6.0.0")?"D&D5e 6.x":"D&D5e 5.2.x";
  log(`v0.0.3 ready on Foundry ${game.version}, ${expected} (${v}).`);
  installActivityGate();
  setupRestGrants();
  observeActorDirectory();
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
  game.modules.get(ID).api=Object.freeze({getItem:managedItem,getCharges:(actor)=>charges(managedItem(actor)),openManager});
});
