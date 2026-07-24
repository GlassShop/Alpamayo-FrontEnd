import{a as C}from"./chunk-LKUO6HUW.js";import{f as qt,g as Zt}from"./chunk-URITNSCJ.js";import{c as Kt}from"./chunk-ESQCUZJF.js";import{C as Ht,E as ut,M as jt,P as zt,Q as Ut,S as $t,T as Y,U as Qt,V as tt,W as Wt,d as Et,e as dt,f as Z,g as At,h as Bt,k as Dt,l as J,m as Rt,n as Lt,o as Gt,q as Ot,u as Vt,v as Pt}from"./chunk-4J5I23KG.js";import{a as Ft,b as X,c as I,d as Nt}from"./chunk-T4FYFNFS.js";import{Db as B,Fb as p,Hb as f,Ib as q,Jb as D,Kb as K,Lb as wt,Mb as R,Nb as L,Qa as s,Rb as Mt,T as vt,Tb as G,U as _t,Ub as St,V as O,Vb as l,Wb as F,X as A,Xb as x,Z as a,Zb as It,ac as v,bb as d,bc as _,ca as w,cb as H,da as M,db as j,ha as yt,ic as Ct,ka as V,mb as kt,mc as ct,nb as z,oa as xt,ob as U,pa as S,pb as $,pc as m,qb as Tt,rb as Q,sb as W,tb as b,ub as u,va as P,vb as g,wb as h,xb as y,yb as T}from"./chunk-5ZS6W3PC.js";import{a as ft}from"./chunk-2NFLSA4Y.js";var et=class o{static \u0275fac=function(t){return new(t||o)};static \u0275cmp=d({type:o,selectors:[["app-home"]],decls:7,vars:6,consts:[[1,"container-with-spacing"]],template:function(t,e){t&1&&(y(0,"div",0)(1,"h1"),l(2),v(3,"translate"),T(),y(4,"p"),l(5),v(6,"translate"),T()()),t&2&&(s(2),F(_(3,2,"home.title")),s(3),F(_(6,4,"home.content")))},dependencies:[I],encapsulation:2})};var gt=(o,i)=>{let t=a(C),e=a(J);return console.log(`trying to navigate to ${o.url} with state ${i.url}`),t.isSignedIn()?!0:(e.navigate(["/iam/sign-in"]).then(),!1)};var re=()=>import("./chunk-IFJXLDXN.js").then(o=>o.About),le=()=>import("./chunk-57IOUI6T.js").then(o=>o.PageNotFound),se=()=>import("./chunk-LLRZSGKM.js").then(o=>o.learningRoutes),ce=()=>import("./chunk-HAJA4YAN.js").then(o=>o.iamRoutes),mt="ACME Learning Center",Jt=[{path:"home",component:et,title:`${mt} - Home`,canActivate:[gt]},{path:"about",loadComponent:re,title:`${mt} - About`},{path:"learning",loadChildren:se,canActivate:[gt]},{path:"iam",loadChildren:ce},{path:"",redirectTo:"/home",pathMatch:"full"},{path:"**",loadComponent:le,title:`${mt} - Page Not Found`}];var pt=new A("TRANSLATE_HTTP_LOADER_CONFIG"),de=(()=>{class o{http;config;constructor(){this.config=ft({prefix:"/assets/i18n/",suffix:".json",enforceLoading:!1,useHttpBackend:!1},a(pt)),this.http=this.config.useHttpBackend?new Z(a(dt)):a(Z)}getTranslation(t){let e=this.config.enforceLoading?`?enforceLoading=${Date.now()}`:"";return this.http.get(`${this.config.prefix}${t}${this.config.suffix}${e}`)}static \u0275fac=function(e){return new(e||o)};static \u0275prov=_t({token:o,factory:o.\u0275fac})}return o})();function Xt(o={}){let i=o.useHttpBackend??!1;return[{provide:pt,useValue:o},{provide:Ft,useClass:de,deps:[i?dt:Z,pt]}]}var Yt=(o,i)=>{let e=a(C).currentToken(),n=e?o.clone({headers:o.headers.set("Authorization",`Bearer ${e}`)}):o;return console.log(e),i(n)};var te={providers:[xt(),At(Bt([Yt])),Nt({loader:Xt({prefix:"./i18n/",suffix:".json"}),fallbackLang:"en"}),Gt(Jt)]};var ue=["*",[["mat-toolbar-row"]]],ge=["*","mat-toolbar-row"],bt=(()=>{class o{static \u0275fac=function(e){return new(e||o)};static \u0275dir=j({type:o,selectors:[["mat-toolbar-row"]],hostAttrs:[1,"mat-toolbar-row"],exportAs:["matToolbarRow"]})}return o})(),ee=(()=>{class o{_elementRef=a(P);_platform=a(Ot);_document=a(yt);color;_toolbarRows;constructor(){}ngAfterViewInit(){this._platform.isBrowser&&(this._checkToolbarMixedModes(),this._toolbarRows.changes.subscribe(()=>this._checkToolbarMixedModes()))}_checkToolbarMixedModes(){this._toolbarRows.length}static \u0275fac=function(e){return new(e||o)};static \u0275cmp=d({type:o,selectors:[["mat-toolbar"]],contentQueries:function(e,n,r){if(e&1&&K(r,bt,5),e&2){let c;R(c=L())&&(n._toolbarRows=c)}},hostAttrs:[1,"mat-toolbar"],hostVars:6,hostBindings:function(e,n){e&2&&(St(n.color?"mat-"+n.color:""),G("mat-toolbar-multiple-rows",n._toolbarRows.length>0)("mat-toolbar-single-row",n._toolbarRows.length===0))},inputs:{color:"color"},exportAs:["matToolbar"],ngContentSelectors:ge,decls:2,vars:0,template:function(e,n){e&1&&(q(ue),D(0),D(1,1))},styles:[`.mat-toolbar {
  background: var(--mat-toolbar-container-background-color, var(--mat-sys-surface));
  color: var(--mat-toolbar-container-text-color, var(--mat-sys-on-surface));
}
.mat-toolbar, .mat-toolbar h1, .mat-toolbar h2, .mat-toolbar h3, .mat-toolbar h4, .mat-toolbar h5, .mat-toolbar h6 {
  font-family: var(--mat-toolbar-title-text-font, var(--mat-sys-title-large-font));
  font-size: var(--mat-toolbar-title-text-size, var(--mat-sys-title-large-size));
  line-height: var(--mat-toolbar-title-text-line-height, var(--mat-sys-title-large-line-height));
  font-weight: var(--mat-toolbar-title-text-weight, var(--mat-sys-title-large-weight));
  letter-spacing: var(--mat-toolbar-title-text-tracking, var(--mat-sys-title-large-tracking));
  margin: 0;
}
@media (forced-colors: active) {
  .mat-toolbar {
    outline: solid 1px;
  }
}
.mat-toolbar .mat-form-field-underline,
.mat-toolbar .mat-form-field-ripple,
.mat-toolbar .mat-focused .mat-form-field-ripple {
  background-color: currentColor;
}
.mat-toolbar .mat-form-field-label,
.mat-toolbar .mat-focused .mat-form-field-label,
.mat-toolbar .mat-select-value,
.mat-toolbar .mat-select-arrow,
.mat-toolbar .mat-form-field.mat-focused .mat-select-arrow {
  color: inherit;
}
.mat-toolbar .mat-input-element {
  caret-color: currentColor;
}
.mat-toolbar .mat-mdc-button-base.mat-mdc-button-base.mat-unthemed {
  --mat-button-text-label-text-color: var(--mat-toolbar-container-text-color, var(--mat-sys-on-surface));
  --mat-button-outlined-label-text-color: var(--mat-toolbar-container-text-color, var(--mat-sys-on-surface));
}

.mat-toolbar-row, .mat-toolbar-single-row {
  display: flex;
  box-sizing: border-box;
  padding: 0 16px;
  width: 100%;
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  height: var(--mat-toolbar-standard-height, 64px);
}
@media (max-width: 599px) {
  .mat-toolbar-row, .mat-toolbar-single-row {
    height: var(--mat-toolbar-mobile-height, 56px);
  }
}

.mat-toolbar-multiple-rows {
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  width: 100%;
  min-height: var(--mat-toolbar-standard-height, 64px);
}
@media (max-width: 599px) {
  .mat-toolbar-multiple-rows {
    min-height: var(--mat-toolbar-mobile-height, 56px);
  }
}
`],encapsulation:2,changeDetection:0})}return o})();var oe=(()=>{class o{static \u0275fac=function(e){return new(e||o)};static \u0275mod=H({type:o});static \u0275inj=O({imports:[Y]})}return o})();var ye=["button"],xe=["*"];function ke(o,i){if(o&1&&(u(0,"div",2),h(1,"mat-pseudo-checkbox",6),g()),o&2){let t=f();s(),b("disabled",t.disabled)}}var ne=new A("MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS",{providedIn:"root",factory:()=>({hideSingleSelectionIndicator:!1,hideMultipleSelectionIndicator:!1,disabledInteractive:!1})}),ae=new A("MatButtonToggleGroup"),Te={provide:Kt,useExisting:vt(()=>ht),multi:!0},ot=class{source;value;constructor(i,t){this.source=i,this.value=t}},ht=(()=>{class o{_changeDetector=a(ct);_dir=a($t,{optional:!0});_multiple=!1;_disabled=!1;_disabledInteractive=!1;_selectionModel;_rawValue;_controlValueAccessorChangeFn=()=>{};_onTouched=()=>{};_buttonToggles;appearance;get name(){return this._name}set name(t){this._name=t,this._markButtonsForCheck()}_name=a(ut).getId("mat-button-toggle-group-");vertical=!1;get value(){let t=this._selectionModel?this._selectionModel.selected:[];return this.multiple?t.map(e=>e.value):t[0]?t[0].value:void 0}set value(t){this._setSelectionByValue(t),this.valueChange.emit(this.value)}valueChange=new V;get selected(){let t=this._selectionModel?this._selectionModel.selected:[];return this.multiple?t:t[0]||null}get multiple(){return this._multiple}set multiple(t){this._multiple=t,this._markButtonsForCheck()}get disabled(){return this._disabled}set disabled(t){this._disabled=t,this._markButtonsForCheck()}get disabledInteractive(){return this._disabledInteractive}set disabledInteractive(t){this._disabledInteractive=t,this._markButtonsForCheck()}get dir(){return this._dir&&this._dir.value==="rtl"?"rtl":"ltr"}change=new V;get hideSingleSelectionIndicator(){return this._hideSingleSelectionIndicator}set hideSingleSelectionIndicator(t){this._hideSingleSelectionIndicator=t,this._markButtonsForCheck()}_hideSingleSelectionIndicator;get hideMultipleSelectionIndicator(){return this._hideMultipleSelectionIndicator}set hideMultipleSelectionIndicator(t){this._hideMultipleSelectionIndicator=t,this._markButtonsForCheck()}_hideMultipleSelectionIndicator;constructor(){let t=a(ne,{optional:!0});this.appearance=t&&t.appearance?t.appearance:"standard",this._hideSingleSelectionIndicator=t?.hideSingleSelectionIndicator??!1,this._hideMultipleSelectionIndicator=t?.hideMultipleSelectionIndicator??!1}ngOnInit(){this._selectionModel=new qt(this.multiple,void 0,!1)}ngAfterContentInit(){this._selectionModel.select(...this._buttonToggles.filter(t=>t.checked)),this.multiple||this._initializeTabIndex()}writeValue(t){this.value=t,this._changeDetector.markForCheck()}registerOnChange(t){this._controlValueAccessorChangeFn=t}registerOnTouched(t){this._onTouched=t}setDisabledState(t){this.disabled=t}_keydown(t){if(this.multiple||this.disabled||Ht(t))return;let n=t.target.id,r=this._buttonToggles.toArray().findIndex(E=>E.buttonId===n),c=null;switch(t.keyCode){case 32:case 13:c=this._buttonToggles.get(r)||null;break;case 38:c=this._getNextButton(r,-1);break;case 37:c=this._getNextButton(r,this.dir==="ltr"?-1:1);break;case 40:c=this._getNextButton(r,1);break;case 39:c=this._getNextButton(r,this.dir==="ltr"?1:-1);break;default:return}c&&(t.preventDefault(),c._onButtonClick(),c.focus())}_emitChangeEvent(t){let e=new ot(t,this.value);this._rawValue=e.value,this._controlValueAccessorChangeFn(e.value),this.change.emit(e)}_syncButtonToggle(t,e,n=!1,r=!1){!this.multiple&&this.selected&&!t.checked&&(this.selected.checked=!1),this._selectionModel?e?this._selectionModel.select(t):this._selectionModel.deselect(t):r=!0,r?Promise.resolve().then(()=>this._updateModelValue(t,n)):this._updateModelValue(t,n)}_isSelected(t){return this._selectionModel&&this._selectionModel.isSelected(t)}_isPrechecked(t){return typeof this._rawValue>"u"?!1:this.multiple&&Array.isArray(this._rawValue)?this._rawValue.some(e=>t.value!=null&&e===t.value):t.value===this._rawValue}_initializeTabIndex(){if(this._buttonToggles.forEach(t=>{t.tabIndex=-1}),this.selected)this.selected.tabIndex=0;else for(let t=0;t<this._buttonToggles.length;t++){let e=this._buttonToggles.get(t);if(!e.disabled){e.tabIndex=0;break}}}_getNextButton(t,e){let n=this._buttonToggles;for(let r=1;r<=n.length;r++){let c=(t+e*r+n.length)%n.length,E=n.get(c);if(E&&!E.disabled)return E}return null}_setSelectionByValue(t){if(this._rawValue=t,!this._buttonToggles)return;let e=this._buttonToggles.toArray();if(this.multiple&&t?(Array.isArray(t),this._clearSelection(),t.forEach(n=>this._selectValue(n,e))):(this._clearSelection(),this._selectValue(t,e)),!this.multiple&&e.every(n=>n.tabIndex===-1)){for(let n of e)if(!n.disabled){n.tabIndex=0;break}}}_clearSelection(){this._selectionModel.clear(),this._buttonToggles.forEach(t=>{t.checked=!1,this.multiple||(t.tabIndex=-1)})}_selectValue(t,e){for(let n of e)if(n.value===t){n.checked=!0,this._selectionModel.select(n),this.multiple||(n.tabIndex=0);break}}_updateModelValue(t,e){e&&this._emitChangeEvent(t),this.valueChange.emit(this.value)}_markButtonsForCheck(){this._buttonToggles?.forEach(t=>t._markForCheck())}static \u0275fac=function(e){return new(e||o)};static \u0275dir=j({type:o,selectors:[["mat-button-toggle-group"]],contentQueries:function(e,n,r){if(e&1&&K(r,nt,5),e&2){let c;R(c=L())&&(n._buttonToggles=c)}},hostAttrs:[1,"mat-button-toggle-group"],hostVars:6,hostBindings:function(e,n){e&1&&p("keydown",function(c){return n._keydown(c)}),e&2&&(z("role",n.multiple?"group":"radiogroup")("aria-disabled",n.disabled),G("mat-button-toggle-vertical",n.vertical)("mat-button-toggle-group-appearance-standard",n.appearance==="standard"))},inputs:{appearance:"appearance",name:"name",vertical:[2,"vertical","vertical",m],value:"value",multiple:[2,"multiple","multiple",m],disabled:[2,"disabled","disabled",m],disabledInteractive:[2,"disabledInteractive","disabledInteractive",m],hideSingleSelectionIndicator:[2,"hideSingleSelectionIndicator","hideSingleSelectionIndicator",m],hideMultipleSelectionIndicator:[2,"hideMultipleSelectionIndicator","hideMultipleSelectionIndicator",m]},outputs:{valueChange:"valueChange",change:"change"},exportAs:["matButtonToggleGroup"],features:[It([Te,{provide:ae,useExisting:o}])]})}return o})(),nt=(()=>{class o{_changeDetectorRef=a(ct);_elementRef=a(P);_focusMonitor=a(Vt);_idGenerator=a(ut);_animationDisabled=jt();_checked=!1;ariaLabel;ariaLabelledby=null;_buttonElement;buttonToggleGroup;get buttonId(){return`${this.id}-button`}id;name;value;get tabIndex(){return this._tabIndex()}set tabIndex(t){this._tabIndex.set(t)}_tabIndex;disableRipple=!1;get appearance(){return this.buttonToggleGroup?this.buttonToggleGroup.appearance:this._appearance}set appearance(t){this._appearance=t}_appearance;get checked(){return this.buttonToggleGroup?this.buttonToggleGroup._isSelected(this):this._checked}set checked(t){t!==this._checked&&(this._checked=t,this.buttonToggleGroup&&this.buttonToggleGroup._syncButtonToggle(this,this._checked),this._changeDetectorRef.markForCheck())}get disabled(){return this._disabled||this.buttonToggleGroup&&this.buttonToggleGroup.disabled}set disabled(t){this._disabled=t}_disabled=!1;get disabledInteractive(){return this._disabledInteractive||this.buttonToggleGroup!==null&&this.buttonToggleGroup.disabledInteractive}set disabledInteractive(t){this._disabledInteractive=t}_disabledInteractive;change=new V;constructor(){a(Pt).load(Ut);let t=a(ae,{optional:!0}),e=a(new Ct("tabindex"),{optional:!0})||"",n=a(ne,{optional:!0});this._tabIndex=S(parseInt(e)||0),this.buttonToggleGroup=t,this._appearance=n&&n.appearance?n.appearance:"standard",this._disabledInteractive=n?.disabledInteractive??!1}ngOnInit(){let t=this.buttonToggleGroup;this.id=this.id||this._idGenerator.getId("mat-button-toggle-"),t&&(t._isPrechecked(this)?this.checked=!0:t._isSelected(this)!==this._checked&&t._syncButtonToggle(this,this._checked))}ngAfterViewInit(){this._animationDisabled||this._elementRef.nativeElement.classList.add("mat-button-toggle-animations-enabled"),this._focusMonitor.monitor(this._elementRef,!0)}ngOnDestroy(){let t=this.buttonToggleGroup;this._focusMonitor.stopMonitoring(this._elementRef),t&&t._isSelected(this)&&t._syncButtonToggle(this,!1,!1,!0)}focus(t){this._buttonElement.nativeElement.focus(t)}_onButtonClick(){if(this.disabled)return;let t=this.isSingleSelector()?!0:!this._checked;if(t!==this._checked&&(this._checked=t,this.buttonToggleGroup&&(this.buttonToggleGroup._syncButtonToggle(this,this._checked,!0),this.buttonToggleGroup._onTouched())),this.isSingleSelector()){let e=this.buttonToggleGroup._buttonToggles.find(n=>n.tabIndex===0);e&&(e.tabIndex=-1),this.tabIndex=0}this.change.emit(new ot(this,this.value))}_markForCheck(){this._changeDetectorRef.markForCheck()}_getButtonName(){return this.isSingleSelector()?this.buttonToggleGroup.name:this.name||null}isSingleSelector(){return this.buttonToggleGroup&&!this.buttonToggleGroup.multiple}static \u0275fac=function(e){return new(e||o)};static \u0275cmp=d({type:o,selectors:[["mat-button-toggle"]],viewQuery:function(e,n){if(e&1&&wt(ye,5),e&2){let r;R(r=L())&&(n._buttonElement=r.first)}},hostAttrs:["role","presentation",1,"mat-button-toggle"],hostVars:14,hostBindings:function(e,n){e&1&&p("focus",function(){return n.focus()}),e&2&&(z("aria-label",null)("aria-labelledby",null)("id",n.id)("name",null),G("mat-button-toggle-standalone",!n.buttonToggleGroup)("mat-button-toggle-checked",n.checked)("mat-button-toggle-disabled",n.disabled)("mat-button-toggle-disabled-interactive",n.disabledInteractive)("mat-button-toggle-appearance-standard",n.appearance==="standard"))},inputs:{ariaLabel:[0,"aria-label","ariaLabel"],ariaLabelledby:[0,"aria-labelledby","ariaLabelledby"],id:"id",name:"name",value:"value",tabIndex:"tabIndex",disableRipple:[2,"disableRipple","disableRipple",m],appearance:"appearance",checked:[2,"checked","checked",m],disabled:[2,"disabled","disabled",m],disabledInteractive:[2,"disabledInteractive","disabledInteractive",m]},outputs:{change:"change"},exportAs:["matButtonToggle"],ngContentSelectors:xe,decls:7,vars:13,consts:[["button",""],["type","button",1,"mat-button-toggle-button","mat-focus-indicator",3,"click","id","disabled"],[1,"mat-button-toggle-checkbox-wrapper"],[1,"mat-button-toggle-label-content"],[1,"mat-button-toggle-focus-overlay"],["matRipple","",1,"mat-button-toggle-ripple",3,"matRippleTrigger","matRippleDisabled"],["state","checked","aria-hidden","true","appearance","minimal",3,"disabled"]],template:function(e,n){if(e&1&&(q(),u(0,"button",1,0),p("click",function(){return n._onButtonClick()}),U(2,ke,2,1,"div",2),u(3,"span",3),D(4),g()(),h(5,"span",4)(6,"span",5)),e&2){let r=Mt(1);b("id",n.buttonId)("disabled",n.disabled&&!n.disabledInteractive||null),z("role",n.isSingleSelector()?"radio":"button")("tabindex",n.disabled&&!n.disabledInteractive?-1:n.tabIndex)("aria-pressed",n.isSingleSelector()?null:n.checked)("aria-checked",n.isSingleSelector()?n.checked:null)("name",n._getButtonName())("aria-label",n.ariaLabel)("aria-labelledby",n.ariaLabelledby)("aria-disabled",n.disabled&&n.disabledInteractive?"true":null),s(2),$(n.buttonToggleGroup&&(!n.buttonToggleGroup.multiple&&!n.buttonToggleGroup.hideSingleSelectionIndicator||n.buttonToggleGroup.multiple&&!n.buttonToggleGroup.hideMultipleSelectionIndicator)?2:-1),s(4),b("matRippleTrigger",r)("matRippleDisabled",n.disableRipple||n.disabled)}},dependencies:[zt,Zt],styles:[`.mat-button-toggle-standalone,
.mat-button-toggle-group {
  position: relative;
  display: inline-flex;
  flex-direction: row;
  white-space: nowrap;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  border-radius: var(--mat-button-toggle-legacy-shape);
  transform: translateZ(0);
}
.mat-button-toggle-standalone:not([class*=mat-elevation-z]),
.mat-button-toggle-group:not([class*=mat-elevation-z]) {
  box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);
}
@media (forced-colors: active) {
  .mat-button-toggle-standalone,
  .mat-button-toggle-group {
    outline: solid 1px;
  }
}

.mat-button-toggle-standalone.mat-button-toggle-appearance-standard,
.mat-button-toggle-group-appearance-standard {
  border-radius: var(--mat-button-toggle-shape, var(--mat-sys-corner-extra-large));
  border: solid 1px var(--mat-button-toggle-divider-color, var(--mat-sys-outline));
}
.mat-button-toggle-standalone.mat-button-toggle-appearance-standard .mat-pseudo-checkbox,
.mat-button-toggle-group-appearance-standard .mat-pseudo-checkbox {
  --mat-pseudo-checkbox-minimal-selected-checkmark-color: var(--mat-button-toggle-selected-state-text-color, var(--mat-sys-on-secondary-container));
}
.mat-button-toggle-standalone.mat-button-toggle-appearance-standard:not([class*=mat-elevation-z]),
.mat-button-toggle-group-appearance-standard:not([class*=mat-elevation-z]) {
  box-shadow: none;
}
@media (forced-colors: active) {
  .mat-button-toggle-standalone.mat-button-toggle-appearance-standard,
  .mat-button-toggle-group-appearance-standard {
    outline: 0;
  }
}

.mat-button-toggle-vertical {
  flex-direction: column;
}
.mat-button-toggle-vertical .mat-button-toggle-label-content {
  display: block;
}

.mat-button-toggle {
  white-space: nowrap;
  position: relative;
  color: var(--mat-button-toggle-legacy-text-color);
  font-family: var(--mat-button-toggle-legacy-label-text-font);
  font-size: var(--mat-button-toggle-legacy-label-text-size);
  line-height: var(--mat-button-toggle-legacy-label-text-line-height);
  font-weight: var(--mat-button-toggle-legacy-label-text-weight);
  letter-spacing: var(--mat-button-toggle-legacy-label-text-tracking);
  --mat-pseudo-checkbox-minimal-selected-checkmark-color: var(--mat-button-toggle-legacy-selected-state-text-color);
}
.mat-button-toggle.cdk-keyboard-focused .mat-button-toggle-focus-overlay {
  opacity: var(--mat-button-toggle-legacy-focus-state-layer-opacity);
}
.mat-button-toggle .mat-icon svg {
  vertical-align: top;
}

.mat-button-toggle-checkbox-wrapper {
  display: inline-block;
  justify-content: flex-start;
  align-items: center;
  width: 0;
  height: 18px;
  line-height: 18px;
  overflow: hidden;
  box-sizing: border-box;
  position: absolute;
  top: 50%;
  left: 16px;
  transform: translate3d(0, -50%, 0);
}
[dir=rtl] .mat-button-toggle-checkbox-wrapper {
  left: auto;
  right: 16px;
}
.mat-button-toggle-appearance-standard .mat-button-toggle-checkbox-wrapper {
  left: 12px;
}
[dir=rtl] .mat-button-toggle-appearance-standard .mat-button-toggle-checkbox-wrapper {
  left: auto;
  right: 12px;
}
.mat-button-toggle-checked .mat-button-toggle-checkbox-wrapper {
  width: 18px;
}
.mat-button-toggle-animations-enabled .mat-button-toggle-checkbox-wrapper {
  transition: width 150ms 45ms cubic-bezier(0.4, 0, 0.2, 1);
}
.mat-button-toggle-vertical .mat-button-toggle-checkbox-wrapper {
  transition: none;
}

.mat-button-toggle-checked {
  color: var(--mat-button-toggle-legacy-selected-state-text-color);
  background-color: var(--mat-button-toggle-legacy-selected-state-background-color);
}

.mat-button-toggle-disabled {
  pointer-events: none;
  color: var(--mat-button-toggle-legacy-disabled-state-text-color);
  background-color: var(--mat-button-toggle-legacy-disabled-state-background-color);
  --mat-pseudo-checkbox-minimal-disabled-selected-checkmark-color: var(--mat-button-toggle-legacy-disabled-state-text-color);
}
.mat-button-toggle-disabled.mat-button-toggle-checked {
  background-color: var(--mat-button-toggle-legacy-disabled-selected-state-background-color);
}

.mat-button-toggle-disabled-interactive {
  pointer-events: auto;
}

.mat-button-toggle-appearance-standard {
  color: var(--mat-button-toggle-text-color, var(--mat-sys-on-surface));
  background-color: var(--mat-button-toggle-background-color, transparent);
  font-family: var(--mat-button-toggle-label-text-font, var(--mat-sys-label-large-font));
  font-size: var(--mat-button-toggle-label-text-size, var(--mat-sys-label-large-size));
  line-height: var(--mat-button-toggle-label-text-line-height, var(--mat-sys-label-large-line-height));
  font-weight: var(--mat-button-toggle-label-text-weight, var(--mat-sys-label-large-weight));
  letter-spacing: var(--mat-button-toggle-label-text-tracking, var(--mat-sys-label-large-tracking));
}
.mat-button-toggle-group-appearance-standard .mat-button-toggle-appearance-standard + .mat-button-toggle-appearance-standard {
  border-left: solid 1px var(--mat-button-toggle-divider-color, var(--mat-sys-outline));
}
[dir=rtl] .mat-button-toggle-group-appearance-standard .mat-button-toggle-appearance-standard + .mat-button-toggle-appearance-standard {
  border-left: none;
  border-right: solid 1px var(--mat-button-toggle-divider-color, var(--mat-sys-outline));
}
.mat-button-toggle-group-appearance-standard.mat-button-toggle-vertical .mat-button-toggle-appearance-standard + .mat-button-toggle-appearance-standard {
  border-left: none;
  border-right: none;
  border-top: solid 1px var(--mat-button-toggle-divider-color, var(--mat-sys-outline));
}
.mat-button-toggle-appearance-standard.mat-button-toggle-checked {
  color: var(--mat-button-toggle-selected-state-text-color, var(--mat-sys-on-secondary-container));
  background-color: var(--mat-button-toggle-selected-state-background-color, var(--mat-sys-secondary-container));
}
.mat-button-toggle-appearance-standard.mat-button-toggle-disabled {
  color: var(--mat-button-toggle-disabled-state-text-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));
  background-color: var(--mat-button-toggle-disabled-state-background-color, transparent);
}
.mat-button-toggle-appearance-standard.mat-button-toggle-disabled .mat-pseudo-checkbox {
  --mat-pseudo-checkbox-minimal-disabled-selected-checkmark-color: var(--mat-button-toggle-disabled-selected-state-text-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));
}
.mat-button-toggle-appearance-standard.mat-button-toggle-disabled.mat-button-toggle-checked {
  color: var(--mat-button-toggle-disabled-selected-state-text-color, color-mix(in srgb, var(--mat-sys-on-surface) 38%, transparent));
  background-color: var(--mat-button-toggle-disabled-selected-state-background-color, color-mix(in srgb, var(--mat-sys-on-surface) 12%, transparent));
}
.mat-button-toggle-appearance-standard .mat-button-toggle-focus-overlay {
  background-color: var(--mat-button-toggle-state-layer-color, var(--mat-sys-on-surface));
}
.mat-button-toggle-appearance-standard:hover .mat-button-toggle-focus-overlay {
  opacity: var(--mat-button-toggle-hover-state-layer-opacity, var(--mat-sys-hover-state-layer-opacity));
}
.mat-button-toggle-appearance-standard.cdk-keyboard-focused .mat-button-toggle-focus-overlay {
  opacity: var(--mat-button-toggle-focus-state-layer-opacity, var(--mat-sys-focus-state-layer-opacity));
}
@media (hover: none) {
  .mat-button-toggle-appearance-standard:hover .mat-button-toggle-focus-overlay {
    display: none;
  }
}

.mat-button-toggle-label-content {
  -webkit-user-select: none;
  user-select: none;
  display: inline-block;
  padding: 0 16px;
  line-height: var(--mat-button-toggle-legacy-height);
  position: relative;
}
.mat-button-toggle-appearance-standard .mat-button-toggle-label-content {
  padding: 0 12px;
  line-height: var(--mat-button-toggle-height, 40px);
}

.mat-button-toggle-label-content > * {
  vertical-align: middle;
}

.mat-button-toggle-focus-overlay {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  background-color: var(--mat-button-toggle-legacy-state-layer-color);
}

@media (forced-colors: active) {
  .mat-button-toggle-checked .mat-button-toggle-focus-overlay {
    border-bottom: solid 500px;
    opacity: 0.5;
    height: 0;
  }
  .mat-button-toggle-checked:hover .mat-button-toggle-focus-overlay {
    opacity: 0.6;
  }
  .mat-button-toggle-checked.mat-button-toggle-appearance-standard .mat-button-toggle-focus-overlay {
    border-bottom: solid 500px;
  }
}
.mat-button-toggle .mat-button-toggle-ripple {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position: absolute;
  pointer-events: none;
}

.mat-button-toggle-button {
  border: 0;
  background: none;
  color: inherit;
  padding: 0;
  margin: 0;
  font: inherit;
  outline: none;
  width: 100%;
  cursor: pointer;
}
.mat-button-toggle-animations-enabled .mat-button-toggle-button {
  transition: padding 150ms 45ms cubic-bezier(0.4, 0, 0.2, 1);
}
.mat-button-toggle-vertical .mat-button-toggle-button {
  transition: none;
}
.mat-button-toggle-disabled .mat-button-toggle-button {
  cursor: default;
}
.mat-button-toggle-button::-moz-focus-inner {
  border: 0;
}
.mat-button-toggle-checked .mat-button-toggle-button:has(.mat-button-toggle-checkbox-wrapper) {
  padding-left: 30px;
}
[dir=rtl] .mat-button-toggle-checked .mat-button-toggle-button:has(.mat-button-toggle-checkbox-wrapper) {
  padding-left: 0;
  padding-right: 30px;
}

.mat-button-toggle-standalone.mat-button-toggle-appearance-standard {
  --mat-focus-indicator-border-radius: var(--mat-button-toggle-shape, var(--mat-sys-corner-extra-large));
}

.mat-button-toggle-group-appearance-standard:not(.mat-button-toggle-vertical) .mat-button-toggle:last-of-type .mat-button-toggle-button::before {
  border-top-right-radius: var(--mat-button-toggle-shape, var(--mat-sys-corner-extra-large));
  border-bottom-right-radius: var(--mat-button-toggle-shape, var(--mat-sys-corner-extra-large));
}
.mat-button-toggle-group-appearance-standard:not(.mat-button-toggle-vertical) .mat-button-toggle:first-of-type .mat-button-toggle-button::before {
  border-top-left-radius: var(--mat-button-toggle-shape, var(--mat-sys-corner-extra-large));
  border-bottom-left-radius: var(--mat-button-toggle-shape, var(--mat-sys-corner-extra-large));
}

.mat-button-toggle-group-appearance-standard.mat-button-toggle-vertical .mat-button-toggle:last-of-type .mat-button-toggle-button::before {
  border-bottom-right-radius: var(--mat-button-toggle-shape, var(--mat-sys-corner-extra-large));
  border-bottom-left-radius: var(--mat-button-toggle-shape, var(--mat-sys-corner-extra-large));
}
.mat-button-toggle-group-appearance-standard.mat-button-toggle-vertical .mat-button-toggle:first-of-type .mat-button-toggle-button::before {
  border-top-right-radius: var(--mat-button-toggle-shape, var(--mat-sys-corner-extra-large));
  border-top-left-radius: var(--mat-button-toggle-shape, var(--mat-sys-corner-extra-large));
}
`],encapsulation:2,changeDetection:0})}return o})(),ie=(()=>{class o{static \u0275fac=function(e){return new(e||o)};static \u0275mod=H({type:o});static \u0275inj=O({imports:[Qt,nt,Y]})}return o})();function Me(o,i){if(o&1){let t=B();u(0,"mat-button-toggle",2),p("click",function(){let n=w(t).$implicit,r=f();return M(r.useLanguage(n))}),l(1),g()}if(o&2){let t=i.$implicit;b("value",t),kt("aria-label",t),s(),x(" ",t.toUpperCase()," ")}}var at=class o{currentLang="en";languages;translate;constructor(){this.translate=a(X),this.currentLang=this.translate.getCurrentLang(),this.languages=[...this.translate.getLangs()]}useLanguage(i){this.translate.use(i),this.currentLang=i}static \u0275fac=function(t){return new(t||o)};static \u0275cmp=d({type:o,selectors:[["app-language-switcher"]],decls:3,vars:1,consts:[["appearance","standard","aria-label","Preferred language","name","language",3,"value"],[3,"value","aria-label"],[3,"click","value","aria-label"]],template:function(t,e){t&1&&(u(0,"mat-button-toggle-group",0),Q(1,Me,2,3,"mat-button-toggle",1,Tt),g()),t&2&&(b("value",e.currentLang),s(),W(e.languages))},dependencies:[ie,ht,nt],encapsulation:2})};var it=class o{static \u0275fac=function(t){return new(t||o)};static \u0275cmp=d({type:o,selectors:[["app-footer-content"]],decls:13,vars:9,consts:[[1,"footer-content"],["href","https://material.angular.dev/","target","_blank"],["href","https://ngx-translate.org/","target","_blank"]],template:function(t,e){t&1&&(y(0,"div",0)(1,"p"),l(2),v(3,"translate"),T(),y(4,"p"),l(5),v(6,"translate"),y(7,"a",1),l(8,"Angular Material"),T(),l(9),v(10,"translate"),y(11,"a",2),l(12,"ngx-translate"),T()()()),t&2&&(s(2),x("Copyright \xA9 2026 ACME Studios. ",_(3,3,"footer.rights")),s(3),x("",_(6,5,"footer.powered-by")," "),s(4),x(" ",_(10,7,"footer.and")," "))},dependencies:[I],styles:[".footer-content[_ngcontent-%COMP%]{position:absolute;bottom:0;width:100%;height:80px;background-color:#708090;color:#fff;text-align:center;margin:0;padding:5px}"]})};function Se(o,i){if(o&1){let t=B();u(0,"button",0),l(1),g(),l(2," | "),u(3,"button",1),p("click",function(){w(t);let n=f();return M(n.performSignOut())}),l(4,"Sign-Out"),g()}if(o&2){let t=f();s(),x("Welcome, ",t.store.currentUsername())}}function Ie(o,i){if(o&1){let t=B();u(0,"button",1),p("click",function(){w(t);let n=f();return M(n.performSignIn())}),l(1,"Sign-In"),g(),l(2," | "),u(3,"button",1),p("click",function(){w(t);let n=f();return M(n.performSignUp())}),l(4,"Sign-Up"),g()}}var rt=class o{router=a(J);store=a(C);performSignIn(){this.router.navigate(["/iam/sign-in"]).then()}performSignUp(){this.router.navigate(["/iam/sign-up"]).then()}performSignOut(){this.store.signOut(this.router)}static \u0275fac=function(t){return new(t||o)};static \u0275cmp=d({type:o,selectors:[["app-authentication-section"]],decls:2,vars:1,consts:[["mat-button",""],["mat-button","",3,"click"]],template:function(t,e){t&1&&U(0,Se,5,1)(1,Ie,5,0),t&2&&$(e.store.isSignedIn()?0:1)},dependencies:[tt],encapsulation:2})};var Ce=(o,i)=>i.label;function Ee(o,i){if(o&1&&(u(0,"a",1),l(1),v(2,"translate"),g()),o&2){let t=i.$implicit;b("routerLink",t.link),s(),F(_(2,2,t.label))}}var lt=class o{options=S([{link:"/home",label:"option.home"},{link:"/about",label:"option.about"},{link:"/learning/categories",label:"option.categories"},{link:"/learning/courses",label:"option.courses"}]);static \u0275fac=function(t){return new(t||o)};static \u0275cmp=d({type:o,selectors:[["app-layout"]],decls:11,vars:0,consts:[[1,"mat-spacer"],["mat-button","","routerLinkActive","active",3,"routerLink"]],template:function(t,e){t&1&&(u(0,"mat-toolbar")(1,"mat-toolbar-row")(2,"h1"),l(3,"ACME Learning Center"),g(),h(4,"div",0),Q(5,Ee,3,4,"a",1,Ce),h(7,"app-authentication-section")(8,"app-language-switcher"),g()(),h(9,"router-outlet")(10,"app-footer-content")),t&2&&(s(5),W(e.options()))},dependencies:[Dt,Rt,oe,ee,bt,Wt,tt,Lt,at,it,rt,I],styles:[".mat-spacer[_ngcontent-%COMP%]{flex:1 1 auto}"]})};var st=class o{title=S("learning-center");translate;constructor(){this.translate=a(X),this.translate.addLangs(["en","es"]),this.translate.use("en")}static \u0275fac=function(t){return new(t||o)};static \u0275cmp=d({type:o,selectors:[["app-root"]],decls:1,vars:0,template:function(t,e){t&1&&h(0,"app-layout")},dependencies:[lt],encapsulation:2})};Et(st,te).catch(o=>console.error(o));
