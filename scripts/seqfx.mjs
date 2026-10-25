/** Optional Sequencer + JB2A Free adapter. No animations bundled or redistributed. */
import {ID,tr,get} from "./core.mjs";

// D&D5e stores native classes as embedded class Items. Their structured
// identifiers are used instead of display names or species descriptions.
const CLASS_IDS = Object.freeze([
  "barbarian", "bard", "cleric", "druid", "fighter", "monk",
  "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"
]);
export const classIds=()=>[...CLASS_IDS];
export const freeJB2AAvailable=()=>Boolean(game.modules.get("sequencer")?.active &&
  game.modules.get("JB2A_DnD5e")?.active &&
  globalThis.Sequencer?.Database?.getPathsUnder && globalThis.Sequence);

function isFreeAsset(entry) {
  const files=Array.isArray(entry)?entry.flatMap(e=>e?.getAllFiles?.()??[]):entry?.getAllFiles?.()??[];
  // The free module can use Forge or configured remote storage. Only reject
  // a known Patreon installation, never guess access from a path's hostname.
  return files.length>0 && files.some(x=>typeof x==="string" &&
    !/\bjb2a_patreon\b/i.test(x) && /\.(webm|webp|png|jpg|jpeg)(?:[?#]|$)/i.test(x));
}

/** Return actual fully-qualified database leaf keys, NOT top-level categories. */
let cachedDatabase=null, cachedSize=-1, cachedPaths=[];
export function freeJB2APaths(){
  if(!freeJB2AAvailable())return [];
  const db=globalThis.Sequencer.Database;
  const dbSize=db.flattenedEntries?.length ?? -1;
  if(cachedDatabase===db && dbSize===cachedSize)return [...cachedPaths];
  try {
    const candidates=db.getPathsUnder("jb2a",{fullyQualified:true,arrays:false,ranges:false});
    if(!Array.isArray(candidates))return [];
    const paths=[...new Set(candidates.filter(x=>typeof x==="string" && x.startsWith("jb2a.")).filter(x=>
      isFreeAsset(db.getEntry(x,{softFail:true}))))].sort();
    cachedDatabase=db;cachedSize=dbSize;cachedPaths=paths;
    return [...paths];
  }catch(e){console.warn(`[${ID}] JB2A Free database enumeration failed`,e);return [];}
}

const VFX_WORDS=/(aura|bless|healing|heal|inspiration|divine|smite|cast_shape|cast\.shape|magic_sign|magic\.sign|spark|swirl|energy|circle|boon|celestial|radiant|holy|glint|explosion|burst|teleport|ward|impact|condition|shield)/i;
// Prioritize on-token and cinematic effects; the search still accesses all free entries.
export const highlightedPaths=(paths)=>paths.filter(x=>VFX_WORDS.test(x));

/** Return the class whose FX should be considered. The D&D5e character's
 * system.details.originalClass stores the embedded class Item id, not a name.
 * Never guess the starting class from embedded Item order.
 */
export function selectedFXClass(actor,mode=get("multiclassFXMode")) {
  const classes=(actor?.items?.filter?.(item=>item.type==="class")??[]).map(item=>({
    id:item.id??item._id, identifier:String(item.system?.identifier??"").trim().toLowerCase(),
    levels:Math.max(0,Number(item.system?.levels)||0)
  }));
  const originalId=String(actor?.system?.details?.originalClass??"");
  const original=classes.find(c=>c.id===originalId);
  if(mode==="starting")return original?.identifier&&CLASS_IDS.includes(original.identifier)?original.identifier:"";
  if(!classes.length)return "";
  classes.sort((a,b)=>b.levels-a.levels || Number(b.id===originalId)-Number(a.id===originalId) || a.identifier.localeCompare(b.identifier));
  const highest=classes[0];
  return CLASS_IDS.includes(highest.identifier)?highest.identifier:"";
}

/** Choose the class first. Missing/unavailable override falls back straight
 * to Global; never search a secondary class merely because it has an effect.
 */
export function resolveClassFX(actor,overrides=get("classFX"),mode=get("multiclassFXMode")) {
  const effects=overrides && typeof overrides==="object"&&!Array.isArray(overrides)?overrides:{};
  const available=new Set(freeJB2APaths());
  const chosenClass=selectedFXClass(actor,mode);
  const classPath=chosenClass?effects[chosenClass]:"";
  if(typeof classPath==="string" && available.has(classPath))return classPath;
  const globalPath=get("sequencerPath");
  return available.has(globalPath)?globalPath:"";
}

function fxDuration(value){
  return 1000*Math.max(0.2,Math.min(3600,Number(value)||5));
}
function fxScale(value){
  return Math.max(0.5,Math.min(4,Number(value)||1.75));
}
function runEffect(token,path,ms,scale,label){
  const fade=Math.min(650,Math.round(ms*.22));
  // Nonpersistent: Sequencer manages its own timeline / expiry.
  return new globalThis.Sequence().effect().file(path).atLocation(token)
    .name(`him-${label}-${foundry.utils.randomID()}`).scaleToObject(scale)
    .fadeIn(fade).fadeOut(fade).duration(ms).play();
}

export async function playSequencerGrant(results,{seconds=null,scale=null}={}){
  if(!game.user.isGM || !freeJB2AAvailable())return;
  const ms=fxDuration(seconds??get("fxSeconds")),multiplier=fxScale(scale??get("sequencerScale"));
  const promises=[];
  for(const result of results){
    if(!result?.added)continue;
    const selected=resolveClassFX(result.actor);
    if(!selected)continue;
    for(const token of canvas?.tokens?.placeables?.filter(t=>t.actor?.id===result.actor?.id)??[]){
      try{promises.push(Promise.resolve(runEffect(token,selected,ms,multiplier,"grant"))
        .catch(err=>console.warn(`[${ID}] Sequencer FX playback failed`,err)));}
      catch(err){console.warn(`[${ID}] Sequencer FX failed for ${token.name}`,err);}
    }
  }
  return Promise.allSettled(promises);
}

/** Preview any effect on a selected token, without charges, audio or announcements. */
export async function testSequencerFX({token,path,seconds,scale}){
  if(!freeJB2AAvailable())throw new Error(tr("SequencerMissing"));
  if(!token)throw new Error(tr("SelectToken"));
  if(!freeJB2APaths().includes(path))throw new Error(tr("ChooseAnimation"));
  return runEffect(token,path,fxDuration(seconds),fxScale(scale),"test");
}
