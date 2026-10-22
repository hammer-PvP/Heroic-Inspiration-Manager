/** Heroic Inspiration Manager v0.0.3 — system-agnostic UI, D&D5e-native item uses. */
export const ID = "heroic-inspiration-manager";
export const ACTIVITY_ID = "himInspireUse001";
export const log = (...args) => console.log(`[${ID}]`, ...args);
export const tr = (key) => game.i18n.localize(`${ID}.${key}`);
export const get = (key) => game.settings.get(ID, key);
export const num = (v, fallback=0) => Number.isFinite(Number(v)) ? Math.max(0, Math.trunc(Number(v))) : fallback;
export const isUnlimited = () => get("maxMode") === "unlimited";
export const configuredMax = () => Math.max(1, num(get("maxCharges"), 4));
export const chargeCost = () => Math.max(1, num(get("cost"), 1));
export const isManaged = (item) => Boolean(item?.getFlag?.(ID,"managed"));
export const eligibleActors = () => game.actors.contents.filter(a => ["character","npc"].includes(a.type));
export const managedItem = (actor) => actor?.items?.find(isManaged) ?? null;

/** Read native D&D5e Group membership. No directory-folder membership or name matching. */
export function groupActors() {
  return game.actors.contents.filter(a => a.type === "group");
}
export function groupMemberIds(group) {
  const raw = group?.system?.members;
  if (!raw) return new Set();
  const entries = Array.isArray(raw) ? raw : typeof raw.values === "function" ? [...raw.values()] : Object.values(raw);
  const ids = new Set();
  for (const m of entries) {
    // Actor documents, embedded member objects, IDs and UUIDs may differ by version.
    const candidates = [m?.actor?.id, m?.actor?._id, m?.actor?.uuid, m?.actorId, m?.id,
      m?.uuid, m?.actor, m?.actorUuid, m?.reference, typeof m === "string" ? m : null];
    for (const c of candidates) {
      const id = typeof c === "string" ? c.split(".").at(-1) : null;
      if (id && game.actors.get(id)?.id === id) ids.add(id);
    }
  }
  return ids;
}
/** Structured Item identifier only; never infer grants from race names or descriptions. */
export function restGrantSources(actor) {
  const configured = String(get("longRestFeatureIds") || "").split(/[,;\n]/)
    .map(v => v.trim().toLowerCase()).filter(Boolean);
  if (!configured.length || actor?.type !== "character") return [];
  return actor.items.filter(item => {
    const identifier = String(item.system?.identifier || "").trim().toLowerCase();
    return identifier && configured.includes(identifier);
  });
}

export const charges = (item) => !item ? 0 : Math.max(0, num(item.system?.uses?.max) - num(item.system?.uses?.spent));
export const capacity = () => isUnlimited() ? Infinity : configuredMax();
export const escapeHTML = (v) => foundry.utils.escapeHTML(String(v ?? ""));
export const findTMFX = () => Boolean(game.modules.get("tokenmagic")?.active && globalThis.TokenMagic?.getPresets);

export function registerSettings(menuApp) {
  const fields = {
    itemName: [String,"Heroic Inspiration"], icon: [String,"systems/dnd5e/ui/inspiration.webp"],
    maxMode: [String,"fixed"], maxCharges: [Number,4], cost: [Number,1], attunement: [Boolean,false],
    recovery: [String,"none"], recoveryFormula: [String,"1d2"], playerProtection: [Boolean,true],
    gmDirectEdit: [Boolean,true], soundEnabled: [Boolean,false], soundFile: [String,""], volume: [Number,0.7],
    fxEnabled: [Boolean,false], fxPreset: [String,""], fxSeconds: [Number,5],
    chatFlavor: [String,"A determinação desafia o destino. Uma nova chance surge quando tudo parecia perdido."],
    longRestFeatureIds: [String,"resourceful"],
    attunementCombatLock: [Boolean,true]
  };
  for (const [key,[type,def]] of Object.entries(fields)) {
    game.settings.register(ID,key,{scope:"world", config:false, type, default:def});
  }
  game.settings.registerMenu(ID,"configuration",{
    name:"Heroic Inspiration", label:tr("Settings"), hint:tr("SettingsHint"), icon:"fas fa-star",
    type:menuApp, restricted:true
  });
}

function activitySource() {
  return {
    _id:ACTIVITY_ID, type:"utility", name:"Use Heroic Inspiration",
    activation:{type:"special",value:1,condition:""},
    consumption:{targets:[{type:"itemUses",target:"",value:String(chargeCost())}],scaling:{allowed:false}},
    description:{chatFlavor:get("chatFlavor")},
    roll:{formula:"",name:"",prompt:false,visible:false},
    visibility:{requireAttunement:get("attunement")}
  };
}
function desiredItemData(balance=0) {
  const max = isUnlimited() ? Math.max(1,balance) : configuredMax();
  const spent = Math.max(0,max-Math.min(balance,max));
  const recovery = get("recovery") === "all" ? [{period:"lr",type:"recoverAll"}]
    : get("recovery") === "formula" ? [{period:"lr",type:"formula",formula:get("recoveryFormula")}]
    : [];
  return {
    name:get("itemName") || "Heroic Inspiration", type:"equipment", img:get("icon") || "systems/dnd5e/ui/inspiration.webp",
    system:{quantity:1,type:{value:"trinket"},equipped:true,
      attunement:get("attunement") ? "required" : "",attuned:false,
      properties:get("attunement") ? ["mgc"] : [],
      uses:{max:String(max),spent,recovery},activities:{[ACTIVITY_ID]:activitySource()},
      description:{value:`<p>${escapeHTML(tr("ItemDescription"))}</p>`}},
    flags:{[ID]:{managed:true,version:"0.0.3"}}
  };
}

const actorLocks = new Set();
async function lockedActor(actor, fn) {
  if (actorLocks.has(actor.uuid)) throw new Error(tr("Busy"));
  actorLocks.add(actor.uuid);
  try { return await fn(); } finally { actorLocks.delete(actor.uuid); }
}

/** idempotent: retain spent/max balance; save structural fields without replacing current charges. */
export async function reconcile(actor,{create=true, initial=0}={}) {
  if (!game.user.isGM) throw new Error(tr("GMOnly"));
  if (!["character","npc"].includes(actor?.type)) return null;
  return lockedActor(actor,async () => {
    let item=managedItem(actor);
    if (!item) {
      if(!create) return null;
      const name=get("itemName");
      if(actor.items.some(i=>i.name===name && !isManaged(i))) throw new Error(`${actor.name}: ${tr("NameConflict")}`);
      const [created]=await actor.createEmbeddedDocuments("Item",[desiredItemData(num(initial))],{himAuthorized:true});
      return created;
    }
    const balance=charges(item);
    const source=desiredItemData(balance);
    // preserve player-controlled equipped & attuned state
    const patch={name:source.name,img:source.img,"system.quantity":1,
      "system.type":{value:"trinket"},
      "system.attunement":source.system.attunement,
      "system.properties":source.system.properties,
      "system.uses.recovery":source.system.uses.recovery,
      [`system.activities.${ACTIVITY_ID}`]:source.system.activities[ACTIVITY_ID],
      [`flags.${ID}.managed`]:true};
    if(isUnlimited()) {
      // Preserve the existing total minted credits and spent history when in unlimited mode.
      const minted = Math.max(num(item.system.uses.max),balance,1);
      patch["system.uses.max"]=String(minted);
      patch["system.uses.spent"]=minted-balance;
    } else {
      const max=configuredMax();
      patch["system.uses.max"]=String(max);
      patch["system.uses.spent"]=max-Math.min(balance,max);
    }
    await item.update(patch,{himAuthorized:true});
    return item;
  });
}

async function balanceUpdate(item,next) {
  const current=charges(item);
  const target=Math.max(0,Math.trunc(next));
  if(isUnlimited()) {
    const max=num(item.system.uses.max);
    const spent=num(item.system.uses.spent);
    if(target>=current) await item.update({"system.uses.max":String(Math.max(1,max+target-current))},{himAuthorized:true});
    else await item.update({"system.uses.spent":spent+(current-target)},{himAuthorized:true});
  } else {
    const max=configuredMax();
    await item.update({"system.uses.max":String(max),"system.uses.spent":max-Math.min(target,max)},{himAuthorized:true});
  }
  return {before:current,after:Math.min(target,capacity())};
}

export async function adjust(actor,action,amount=1) {
  if(!game.user.isGM) throw new Error(tr("GMOnly"));
  const item = managedItem(actor) || await reconcile(actor,{create:true});
  if(!item) return null;
  return lockedActor(actor,async () => {
    const before=charges(item);
    let after= action==="set" ? num(amount) : action==="grant" ? before+num(amount,1) : Math.max(0,before-num(amount,1));
    after=Math.min(after,capacity());
    await balanceUpdate(item,after);
    await mirrorInspiration(actor, after>0);
    return {actor,item,before,after,added:Math.max(0,after-before)};
  });
}

export async function mirrorInspiration(actor,on) {
  if (actor.type!=="character") return;
  const curr=Boolean(actor.system.attributes?.inspiration);
  if(curr!==on) await actor.update({"system.attributes.inspiration":on},{himMirror:true});
}

export function canUse(item,{notify=false}={}) {
  let reason="";
  if(!item?.parent) reason=tr("MissingItem");
  else if(!item.system.equipped) reason=tr("MustEquip");
  else if(get("attunement")&&!item.system.attuned) reason=tr("MustAttune");
  else if(charges(item)<chargeCost()) reason=tr("Insufficient");
  if(notify && reason) ui.notifications.warn(reason);
  return !reason;
}

export async function useFromStar(actor) {
  const item=managedItem(actor);
  if(!canUse(item,{notify:true}))return;
  const activity=item.system.activities.get(ACTIVITY_ID);
  if(!activity){ui.notifications.error(tr("MissingActivity"));return;}
  return activity.use({}, {configure:false});
}

/** TokenMagic integration is self-contained, does not touch unrelated filters. */
export async function celebrate(results) {
  if (!game.user.isGM || !results.some(r=>r?.added>0)) return;
  if(get("soundEnabled") && get("soundFile")) {
    try { await foundry.audio.AudioHelper.play({src:get("soundFile"),volume:Number(get("volume")),autoplay:true,loop:false},true); }
    catch(err){console.warn(`[${ID}] Optional audio failed:`,err);}
  }
  if(!get("fxEnabled") || !findTMFX() || !get("fxPreset")) return;
  const preset=get("fxPreset");
  const seconds=Math.max(.1,Math.min(3600,Number(get("fxSeconds"))||5));
  for(const r of results) {
    if(!r?.added) continue;
    const tokens=canvas?.tokens?.placeables?.filter(t=>t.actor?.id===r.actor.id)??[];
    for(const token of tokens){
      try {
        const uniqueID=`him-${r.actor.id}-${foundry.utils.randomID()}`;
        const data=globalThis.TokenMagic.getPreset(preset);
        if(!Array.isArray(data)||!data.length)continue;
        const filters=foundry.utils.deepClone(data).map(f=>({...f,filterId:uniqueID}));
        await globalThis.TokenMagic.addUpdateFilters(token,filters);
        // Temporary namespace owns only the filters created in this call.
        setTimeout(()=>{globalThis.TokenMagic?.deleteFilters?.(token,uniqueID)?.catch?.(()=>{});},seconds*1000);
      } catch(err){console.warn(`[${ID}] Optional FX failed:`,err);}
    }
  }
}

export function snapshot(actor) {
  const item=managedItem(actor);
  return {actor,item,balance:charges(item),max:isUnlimited()?"∞":configuredMax(),
    status:!item?tr("MissingItem"):!item.system.equipped?tr("Unequipped")
      :get("attunement")&&!item.system.attuned?tr("Unattuned"):charges(item)<=0?tr("Empty"):tr("Ready")};
}
