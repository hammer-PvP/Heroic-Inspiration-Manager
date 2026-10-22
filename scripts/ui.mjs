import {ID,tr,get,num,escapeHTML,findTMFX,eligibleActors,snapshot,reconcile,adjust,celebrate,isUnlimited,configuredMax,groupActors,groupMemberIds} from "./core.mjs";
const AppV2=foundry.applications.api.ApplicationV2;
const esc=escapeHTML;
const opt=(value,label,selected)=>`<option value="${esc(value)}" ${selected===value?"selected":""}>${esc(label)}</option>`;
const field=(key,label,value,type="text",other="")=>`<label class="him-field"><span>${esc(label)}</span><input name="${esc(key)}" type="${type}" value="${esc(value)}" ${other}></label>`;
const toggle=(key,label,active,disabled=false)=>`<label class="him-checkbox"><input name="${esc(key)}" type="checkbox" ${active?"checked":""} ${disabled?"disabled":""}><span>${esc(label)}</span></label>`;
const select=(key,label,options,value,disabled=false)=>`<label class="him-field"><span>${esc(label)}</span><select name="${esc(key)}" ${disabled?"disabled":""}>${options.map(([v,l])=>opt(v,l,value)).join("")}</select></label>`;

class HIMWindow extends AppV2 {
  static DEFAULT_OPTIONS={classes:["him-app"], window:{resizable:true},position:{width:670,height:630}};
  async _renderHTML(){return "";}
  _replaceHTML(html,content){content.innerHTML=html;this.bind(content);}
  bind(){}
}

export class SettingsWindow extends HIMWindow {
  static DEFAULT_OPTIONS={id:"him-settings",window:{title:"Heroic Inspiration — Settings",resizable:true},position:{width:670,height:720},classes:["him-app"]};
  async _renderHTML(){
    const fxOK=findTMFX();
    let presets=[];
    if(fxOK){try{const p=globalThis.TokenMagic.getPresets();presets=Array.isArray(p)?p.map(x=>typeof x==="string"?x:x.name||x.id).filter(Boolean):Object.keys(p??{});}catch(e){console.warn(e);}}
    return `<form class="him-settings-form"><h3>${esc(tr("ItemConfig"))}</h3>
      ${field("itemName",tr("ItemName"),get("itemName"))}
      <div class="him-icon-control">
        ${field("icon",tr("Icon"),get("icon"))}
        <div class="him-row him-browse">
          <img class="him-icon-preview" src="${esc(get("icon")||"systems/dnd5e/ui/inspiration.webp")}" alt="">
          <button type="button" data-him="browseIcon"><i class="fas fa-folder-open"></i> ${esc(tr("BrowseIcon"))}</button>
          <button type="button" data-him="resetIcon"><i class="fas fa-undo"></i> ${esc(tr("ResetIcon"))}</button>
        </div>
      </div>
      ${select("maxMode",tr("MaximumMode"),[["fixed",tr("Fixed")],["unlimited",tr("Unlimited")]],get("maxMode"))}
      ${field("maxCharges",tr("MaxCharges"),get("maxCharges"),"number","min=1 step=1")}
      ${field("cost",tr("Cost"),get("cost"),"number","min=1 step=1")}
      ${toggle("attunement",tr("RequireAttunement"),get("attunement"))}
      ${select("recovery",tr("Recovery"),[["none",tr("RecoveryNone")],["all",tr("RecoveryAll")],["formula",tr("RecoveryFormula")]],get("recovery"))}
      ${field("recoveryFormula",tr("Formula"),get("recoveryFormula"))}
      ${field("longRestFeatureIds",tr("RestGrantIdentifiers"),get("longRestFeatureIds"))}
      <p class="him-help">${esc(tr("RestGrantIdentifiersHint"))}</p>
      ${field("chatFlavor",tr("ChatFlavor"),get("chatFlavor"))}
      <h3>${esc(tr("Protection"))}</h3>
      ${toggle("playerProtection",tr("ProtectPlayer"),get("playerProtection"))}
      ${toggle("gmDirectEdit",tr("GMDirect"),get("gmDirectEdit"))}
      ${toggle("attunementCombatLock",tr("CombatLock"),get("attunementCombatLock"))}
      <h3>${esc(tr("GrantEffects"))}</h3>
      ${toggle("soundEnabled",tr("SoundEnabled"),get("soundEnabled"))}
      ${field("soundFile",tr("SoundFile"),get("soundFile"))}
      <div class="him-row him-browse"><button type="button" data-him="browseSound"><i class="fas fa-folder-open"></i> ${esc(tr("BrowseSound"))}</button><button type="button" data-him="testSound">${esc(tr("TestSound"))}</button></div>
      ${field("volume",tr("SoundVolume"),get("volume"),"number","min=0 max=1 step=0.05")}
      <div class="him-fx-settings ${fxOK?"":"him-disabled"}">
      ${toggle("fxEnabled",tr("FXEnabled"),fxOK&&get("fxEnabled"),!fxOK)}
      ${select("fxPreset",tr("FXPreset"),[["",tr("ChoosePreset")],...presets.map(n=>[n,n])],get("fxPreset"),!fxOK)}
      ${field("fxSeconds",tr("FXSeconds"),get("fxSeconds"),"number",`min=0.1 max=3600 step=0.1 ${fxOK?"":"disabled"}`)}
      ${fxOK?`<div class="him-row"><button type="button" data-him="testFX">${esc(tr("TestFX"))}</button></div>`:""}
      ${fxOK?"":`<p class="him-help">${esc(tr("FXMissing"))} <a target="_blank" rel="noopener noreferrer" href="https://foundryvtt.com/packages/tokenmagic">Token Magic FX ↗</a></p>`}
      </div><section class="him-sync-options">
      ${toggle("syncNPCs",tr("IncludeNPCs"),false)}
      <p class="him-help">${esc(tr("SyncScopeHint"))}</p></section>
      <footer><button type="submit"><i class="fas fa-save"></i> ${esc(tr("Save"))}</button>
      <button type="button" data-him="sync"><i class="fas fa-box-open"></i> ${esc(tr("SaveSync"))}</button>
      <button type="button" data-him="openManager"><i class="fas fa-star"></i> ${esc(tr("OpenManager"))}</button></footer></form>`;
  }
  bind(el){
    const form=el.querySelector("form");
    el.querySelector('[data-him="openManager"]')?.addEventListener("click",()=>{
      const opener=game.modules.get(ID)?.api?.openManager;
      if(opener) opener();
      else new ManagerWindow().render(true);
    });
    el.querySelector('[data-him="testSound"]')?.addEventListener("click",async()=>{
      const src=form.querySelector('input[name="soundFile"]').value;
      if(!src)return ui.notifications.warn(tr("SelectSound"));
      try{await foundry.audio.AudioHelper.play({src,volume:Number(form.querySelector('input[name="volume"]').value)||.7,autoplay:true,loop:false},false);}
      catch(e){ui.notifications.warn(e.message);}
    });
    el.querySelector('[data-him="testFX"]')?.addEventListener("click",async()=>{
      if(!findTMFX())return;
      const token=canvas?.tokens?.controlled?.[0];
      if(!token)return ui.notifications.warn(tr("SelectToken"));
      const name=form.querySelector('select[name="fxPreset"]').value;
      const params=globalThis.TokenMagic.getPreset(name);
      if(!name||!Array.isArray(params)||!params.length)return ui.notifications.warn(tr("ChoosePreset"));
      const filterId=`him-test-${foundry.utils.randomID()}`;
      const filters=foundry.utils.deepClone(params).map(p=>({...p,filterId}));
      try{await globalThis.TokenMagic.addUpdateFilters(token,filters);
        const duration=Math.max(.1,Number(form.querySelector('input[name="fxSeconds"]').value)||5);
        setTimeout(()=>{globalThis.TokenMagic?.deleteFilters?.(token,filterId)?.catch?.(console.warn);},duration*1000);
      }catch(e){ui.notifications.warn(e.message);}
    });
    el.querySelector('[data-him="browseIcon"]')?.addEventListener("click",()=>{
      const Picker=foundry.applications.apps.FilePicker;
      const input=form.querySelector('input[name="icon"]');
      new Picker({type:"image",current:input.value,callback:path=>{
        input.value=path;
        const preview=form.querySelector(".him-icon-preview");
        if(preview)preview.src=path;
      }}).render(true);
    });
    el.querySelector('[data-him="resetIcon"]')?.addEventListener("click",()=>{
      const path="systems/dnd5e/ui/inspiration.webp";
      form.querySelector('input[name="icon"]').value=path;
      const preview=form.querySelector(".him-icon-preview");
      if(preview)preview.src=path;
    });
    el.querySelector('[data-him="browseSound"]')?.addEventListener("click",()=>{
      const Picker=foundry.applications.apps.FilePicker;
      const current=form.querySelector('input[name="soundFile"]');
      new Picker({type:"audio",current:current.value,callback:(path)=>{current.value=path;}}).render(true);
    });
    const save=async(sync=false)=>{
      if(!game.user.isGM)return;
      const fd=new FormData(form);
      const bools=new Set(["attunement","playerProtection","gmDirectEdit","soundEnabled","fxEnabled","attunementCombatLock"]);
      const nums=new Set(["maxCharges","cost","volume","fxSeconds"]);
      for(const key of ["itemName","icon","maxMode","maxCharges","cost","attunement","recovery","recoveryFormula","longRestFeatureIds","chatFlavor","playerProtection","gmDirectEdit","attunementCombatLock","soundEnabled","soundFile","volume","fxEnabled","fxPreset","fxSeconds"]){
        let val=bools.has(key)?fd.has(key):fd.get(key);
        if(nums.has(key)) val=Number(val);
        if(key==="maxCharges"||key==="cost")val=Math.max(1,num(val,1));
        if(key==="volume")val=Math.max(0,Math.min(1,Number(val)||0));
        if(key==="fxSeconds")val=Math.max(.1,Math.min(3600,Number(val)||5));
        if(key==="fxEnabled" && !findTMFX())val=get("fxEnabled");
        if(["fxPreset","fxSeconds"].includes(key) && !findTMFX())val=get(key);
        await game.settings.set(ID,key,val);
      }
      if(sync){
        const includeNPCs=form.querySelector('[name="syncNPCs"]').checked;
        const actors=eligibleActors().filter(actor=>includeNPCs || actor.type==="character");
        const count={created:0,updated:0,failed:0};
        const errors=[];
        for(const actor of actors) {
          const existed=actor.items.some(item=>item.getFlag(ID,"managed"));
          try {
            const item=await reconcile(actor,{create:true});
            if(item) count[existed?"updated":"created"]++;
          } catch(err) {
            count.failed++;
            console.warn(`[${ID}] Failed to synchronize ${actor.name}`,err);
            errors.push(`${actor.name}: ${err.message}`);
          }
        }
        const report=tr("SyncResult")
          .replace("{created}",count.created)
          .replace("{updated}",count.updated)
          .replace("{failed}",count.failed);
        if(count.failed)ui.notifications.warn(`${report}${errors.length?` — ${errors.slice(0,2).join(" | ")}`:""}`);
        else ui.notifications.info(report);
      } else ui.notifications.info(tr("SettingsSaved"));
      this.render();
    };
    form.addEventListener("submit",async(e)=>{e.preventDefault();try{await save(false);}catch(err){ui.notifications.error(err.message);}});
    el.querySelector('[data-him="sync"]').addEventListener("click",async()=>{try{await save(true);}catch(err){ui.notifications.error(err.message);}});
  }
}

export class ManagerWindow extends HIMWindow {
  static DEFAULT_OPTIONS={id:"him-manager",window:{title:"Heroic Inspiration Manager",resizable:true},position:{width:790,height:660},classes:["him-app"]};
  selected=new Set(); typeFilter="character"; groupFilter="all";
  visibleActors(){
    const members=this.groupFilter==="all"?null:groupMemberIds(game.actors.get(this.groupFilter));
    return eligibleActors().filter(a=>(this.typeFilter==="all"||a.type===this.typeFilter)&&(!members||members.has(a.id)));
  }
  async _renderHTML(){
    const all=this.visibleActors();
    const groups=groupActors().sort((a,b)=>a.name.localeCompare(b.name));
    if(this.groupFilter!=="all" && !groups.some(g=>g.id===this.groupFilter))this.groupFilter="all";
    const rows=all.map(a=>{const s=snapshot(a);
      return `<tr><td><input class="him-select" data-actor="${esc(a.id)}" type="checkbox" ${this.selected.has(a.id)?"checked":""}></td>
      <td><img class="him-avatar" src="${esc(a.img)}" alt=""> ${esc(a.name)}</td>
      <td>${s.item?esc(tr("Installed")):esc(tr("MissingItem"))}</td><td class="him-number">${s.balance} / ${s.max}</td>
      <td>${esc(s.status)}</td><td><button class="him-mini" data-him="single" data-actor="${esc(a.id)}" title="${esc(tr("ManageOne"))}"><i class="fas fa-sliders"></i></button></td></tr>`;
    }).join("");
    return `<section class="him-manager"><header class="him-row"><p>${esc(tr("SelectActors"))}</p>
      <select name="filter">${[["character",tr("Characters")],["npc",tr("NPCs")],["all",tr("All")]].map(([v,l])=>opt(v,l,this.typeFilter)).join("")}</select>
      <select name="groupFilter" aria-label="${esc(tr("GroupFilter"))}">${[["all",tr("AllGroups")],...groups.map(g=>[g.id,g.name])].map(([v,l])=>opt(v,l,this.groupFilter)).join("")}</select>
      <button data-him="all">${esc(tr("SelectAll"))}</button><button data-him="clear">${esc(tr("Clear"))}</button></header>
      <div class="him-table-scroll"><table><thead><tr><th></th><th>${esc(tr("Actor"))}</th><th>${esc(tr("Item"))}</th><th>${esc(tr("Charges"))}</th><th>${esc(tr("Status"))}</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="6">${esc(tr("NoActors"))}</td></tr>`}</tbody></table></div>
      <footer><label>${esc(tr("Amount"))} <input name="amount" type="number" min="0" step="1" value="1"></label>
      <button data-him="install"><i class="fas fa-box"></i> ${esc(tr("ApplyItem"))}</button>
      <button data-him="grant"><i class="fas fa-plus"></i> ${esc(tr("Grant"))}</button>
      <button data-him="revoke"><i class="fas fa-minus"></i> ${esc(tr("Revoke"))}</button>
      <button data-him="set"><i class="fas fa-equals"></i> ${esc(tr("SetExact"))}</button></footer>
      <p class="him-help">${esc(tr("MigrationNote"))}</p></section>`;
  }
  bind(el){
    el.querySelector('select[name="filter"]').addEventListener("change",e=>{this.typeFilter=e.target.value;this.selected.clear();this.render();});
    el.querySelector('select[name="groupFilter"]').addEventListener("change",e=>{this.groupFilter=e.target.value;this.selected.clear();this.render();});
    el.querySelectorAll(".him-select").forEach(c=>c.addEventListener("change",e=>{e.target.checked?this.selected.add(e.target.dataset.actor):this.selected.delete(e.target.dataset.actor);}));
    el.querySelectorAll("button[data-him]").forEach(button=>button.addEventListener("click",async()=>{
      const action=button.dataset.him;
      if(action==="all"){this.visibleActors().forEach(a=>this.selected.add(a.id));this.render();return;}
      if(action==="clear"){this.selected.clear();this.render();return;}
      if(action==="single"){this.selected=new Set([button.dataset.actor]);}
      const amount=num(el.querySelector('input[name="amount"]').value,1);
      const visibleIds=new Set(this.visibleActors().map(a=>a.id));
      const actors=[...this.selected].filter(id=>visibleIds.has(id)).map(id=>game.actors.get(id)).filter(Boolean);
      if(!actors.length){ui.notifications.warn(tr("NoSelected"));return;}
      if(action==="single"){
        const a=actors[0];
        const response=await foundry.applications.api.DialogV2.prompt({window:{title:a.name},content:`<p>${esc(tr("SetExact"))} — ${esc(a.name)}</p><input name="saldo" type="number" min="0" step="1" value="${snapshot(a).balance}">`,ok:{label:tr("SetExact"),callback:(_event,_button,dialog)=>num(dialog.element.querySelector('input[name="saldo"]')?.value)}});
        if(response===null||response===undefined)return;
        try{await adjust(a,"set",response);this.render();}catch(err){ui.notifications.error(err.message);}return;
      }
      if(action==="set" && actors.length>1){
        const ok=await foundry.applications.api.DialogV2.confirm({window:{title:tr("SetExact")},content:`<p>${esc(tr("ConfirmExact"))}: ${actors.length} → ${amount}</p>`});
        if(!ok)return;
      }
      const results=[],errors=[];
      for(const actor of actors){try{
        if(action==="install")await reconcile(actor,{create:true});
        else results.push(await adjust(actor,action,amount));
      }catch(err){errors.push(err.message);}}
      if(action==="grant")await celebrate(results);
      if(errors.length)ui.notifications.warn(errors.slice(0,3).join(" | "));
      else ui.notifications.info(tr("OperationDone"));
      this.render();
    }));
  }
}
