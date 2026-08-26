import './style.css';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { getProduct, saveProduct, getProducts, getMovements, addMovement, clearAllData, replaceAll } from './db.js';

const app = document.querySelector('#app');
let currentTab = 'inicio';
let scanControls = null;
let pendingBarcode = '';
let pendingProduct = null;
let movementMode = 'remove';

const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmtDate = iso => new Intl.DateTimeFormat('es-ES',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso));

function toast(message){
  document.querySelector('.toast')?.remove();
  const el=document.createElement('div'); el.className='toast'; el.textContent=message; document.body.append(el); setTimeout(()=>el.remove(),2800);
}

async function dashboardData(){
  const [products,movements]=await Promise.all([getProducts(),getMovements()]);
  return {products,movements,totalStock:products.reduce((s,p)=>s+(Number(p.stock)||0),0)};
}

function shell(content){
  return `<div class="shell">
    <div class="topbar"><div class="logo">MDS</div><div class="title"><h1>Bajas internas</h1><p>Control de entradas y retiradas por código de barras</p></div></div>
    <main>${content}</main>
    <nav class="tabs"><div class="tabs-inner">
      ${['inicio','productos','historial','ajustes'].map(t=>`<button class="tab ${currentTab===t?'active':''}" data-tab="${t}">${({inicio:'⌂ Inicio',productos:'▦ Productos',historial:'↕ Historial',ajustes:'⚙ Ajustes'})[t]}</button>`).join('')}
    </div></nav>
  </div>`;
}

async function render(){
  closeScanner();
  const data=await dashboardData();
  if(currentTab==='inicio') app.innerHTML=shell(homeView(data));
  if(currentTab==='productos') app.innerHTML=shell(productsView(data.products));
  if(currentTab==='historial') app.innerHTML=shell(historyView(data.movements));
  if(currentTab==='ajustes') app.innerHTML=shell(settingsView(data));
  bindCommon();
}

function homeView({products,movements,totalStock}){
  const recent=movements.slice(0,6);
  return `<section class="hero">
    <button class="scan-btn" id="scanBtn"><strong>▥ Escanear código</strong><span>Usa la cámara del móvil para localizar el producto.</span></button>
    <div class="card"><strong>Introducción manual</strong><p class="small">También puedes escribir o pegar un EAN, UPC o código interno.</p><form class="manual" id="manualForm"><input id="manualBarcode" inputmode="numeric" autocomplete="off" placeholder="Código de barras" required><button class="btn btn-orange">Abrir</button></form></div>
  </section>
  <div class="stats"><div class="stat"><span>Productos</span><strong>${products.length}</strong></div><div class="stat"><span>Stock total</span><strong>${totalStock}</strong></div><div class="stat"><span>Movimientos</span><strong>${movements.length}</strong></div></div>
  <div class="section-head"><h2>Últimos movimientos</h2></div>
  ${movementRows(recent)}`;
}

function productsView(products){
  return `<input class="search" id="productSearch" placeholder="Buscar por producto, SKU o código…">
  <div class="section-head"><h2>Productos (${products.length})</h2></div>
  <div id="productList">${productRows(products)}</div>`;
}

function productRows(products){
  if(!products.length) return '<div class="empty">Todavía no hay productos. Escanea el primer código para crearlo.</div>';
  return `<div class="list">${products.sort((a,b)=>a.name.localeCompare(b.name)).map(p=>`<button class="row" style="width:100%;text-align:left;cursor:pointer" data-barcode="${esc(p.barcode)}"><div class="row-main"><div class="row-title">${esc(p.name)}</div><div class="row-meta">${esc(p.sku||'Sin SKU')} · ${esc(p.barcode)}</div></div><div><div class="small">Stock</div><div class="qty">${Number(p.stock)||0}</div></div></button>`).join('')}</div>`;
}

function historyView(movements){
  return `<input class="search" id="historySearch" placeholder="Buscar producto, código o nota…"><div class="section-head"><h2>Historial (${movements.length})</h2></div><div id="historyList">${movementRows(movements)}</div>`;
}

function movementRows(movements){
  if(!movements.length) return '<div class="empty">No hay movimientos registrados.</div>';
  return `<div class="list">${movements.map(m=>`<div class="row"><div class="row-main"><div class="row-title">${esc(m.productName)}</div><div class="row-meta">${fmtDate(m.createdAt)} · ${esc(m.barcode)}${m.note?` · ${esc(m.note)}`:''}</div></div><div class="qty ${m.type==='add'?'plus':'minus'}">${m.type==='add'?'+':'−'}${m.quantity}</div></div>`).join('')}</div>`;
}

function settingsView({products,movements}){
  return `<div class="card"><h2 style="margin-top:0">Copias de seguridad</h2><p class="small">Los datos se guardan en este navegador/dispositivo. Exporta una copia periódicamente.</p><div class="tools"><button class="btn btn-primary" id="exportBtn">Exportar JSON</button><label class="btn btn-soft" style="display:inline-flex;align-items:center;cursor:pointer">Importar JSON<input id="importInput" type="file" accept="application/json" hidden></label><button class="btn btn-soft" id="exportCsvBtn">Exportar historial CSV</button></div><p class="small">${products.length} productos · ${movements.length} movimientos</p><div class="danger-zone"><h3>Zona de datos</h3><button class="btn btn-danger" id="clearBtn">Borrar todos los datos</button></div></div>
  <div class="card" style="margin-top:12px"><strong>Instalación</strong><p class="small">Al publicarla con GitHub Pages podrás instalarla en Android, iPhone y ordenador como una aplicación. La cámara necesita HTTPS, que GitHub Pages proporciona.</p></div>`;
}

function bindCommon(){
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{currentTab=b.dataset.tab;render()}));
  document.querySelector('#scanBtn')?.addEventListener('click',startScanner);
  document.querySelector('#manualForm')?.addEventListener('submit',e=>{e.preventDefault(); const v=document.querySelector('#manualBarcode').value.trim(); if(v) handleBarcode(v)});
  document.querySelectorAll('[data-barcode]').forEach(b=>b.addEventListener('click',()=>handleBarcode(b.dataset.barcode)));
  document.querySelector('#productSearch')?.addEventListener('input',async e=>{const q=e.target.value.toLowerCase().trim(); const ps=await getProducts(); const f=ps.filter(p=>[p.name,p.sku,p.barcode].some(v=>String(v||'').toLowerCase().includes(q))); document.querySelector('#productList').innerHTML=productRows(f); bindProductRows();});
  document.querySelector('#historySearch')?.addEventListener('input',async e=>{const q=e.target.value.toLowerCase().trim(); const ms=await getMovements(); const f=ms.filter(m=>[m.productName,m.barcode,m.note].some(v=>String(v||'').toLowerCase().includes(q))); document.querySelector('#historyList').innerHTML=movementRows(f);});
  document.querySelector('#exportBtn')?.addEventListener('click',exportJson);
  document.querySelector('#exportCsvBtn')?.addEventListener('click',exportCsv);
  document.querySelector('#importInput')?.addEventListener('change',importJson);
  document.querySelector('#clearBtn')?.addEventListener('click',async()=>{if(confirm('¿Seguro que quieres borrar productos e historial? Esta acción no se puede deshacer.')){await clearAllData();toast('Datos eliminados');render();}});
}
function bindProductRows(){document.querySelectorAll('[data-barcode]').forEach(b=>b.addEventListener('click',()=>handleBarcode(b.dataset.barcode)));}

async function startScanner(){
  const overlay=document.createElement('div'); overlay.className='scanner-overlay'; overlay.innerHTML=`<div class="scanner"><div class="video-wrap"><video id="scannerVideo" muted playsinline></video><div class="aim"></div></div><div class="scanner-actions"><div class="scanner-note">Apunta al código hasta que sea detectado.</div><button class="btn btn-soft" id="closeScan">Cerrar</button></div></div>`; document.body.append(overlay);
  document.querySelector('#closeScan').addEventListener('click',closeScanner);
  try{
    const reader=new BrowserMultiFormatReader();
    scanControls=await reader.decodeFromConstraints({audio:false,video:{facingMode:{ideal:'environment'}}},document.querySelector('#scannerVideo'),(result,error,controls)=>{
      if(result){controls.stop(); scanControls=null; overlay.remove(); handleBarcode(result.getText());}
    });
  }catch(err){overlay.remove();toast('No se pudo abrir la cámara. Revisa permisos o usa entrada manual.');}
}
function closeScanner(){try{scanControls?.stop()}catch{} scanControls=null; document.querySelector('.scanner-overlay')?.remove();}

async function handleBarcode(barcode){
  closeScanner();
  pendingBarcode=String(barcode).trim();
  pendingProduct=await getProduct(pendingBarcode);
  movementMode='remove';
  openMovementModal();
}

function openMovementModal(){
  const isNew=!pendingProduct;
  const overlay=document.createElement('div'); overlay.className='modal-overlay'; overlay.id='movementOverlay';
  overlay.innerHTML=`<form class="modal" id="movementForm"><h2>${isNew?'Nuevo producto':'Registrar movimiento'}</h2><div class="modal-sub">Código: ${esc(pendingBarcode)}</div>
    ${isNew?`<div class="field"><label>Nombre del producto *</label><input id="productName" required placeholder="Ej. Matrícula acrílica larga"></div><div class="field"><label>SKU / referencia</label><input id="productSku" placeholder="Opcional"></div>`:`<div class="card" style="padding:12px;margin-bottom:12px"><strong>${esc(pendingProduct.name)}</strong><div class="small">${esc(pendingProduct.sku||'Sin SKU')} · Stock actual: <b>${Number(pendingProduct.stock)||0}</b></div></div>`}
    <div class="field"><label>Tipo de movimiento</label><div class="mode-grid"><button type="button" class="mode selected-remove" id="removeMode">− Retirar</button><button type="button" class="mode" id="addMode">+ Añadir</button></div></div>
    <div class="field"><label>Número de unidades</label><div class="qty-control"><button type="button" id="qtyMinus">−</button><input id="quantity" type="number" min="1" step="1" value="1" inputmode="numeric" required><button type="button" id="qtyPlus">+</button></div></div>
    <div class="field"><label>Nota / motivo</label><textarea id="note" rows="2" placeholder="Opcional: uso interno, rotura, devolución…"></textarea></div>
    <div id="stockWarning" class="small" style="color:var(--danger);margin-top:10px"></div>
    <div class="modal-actions"><button type="button" class="btn btn-soft" id="cancelMovement">Cancelar</button><button class="btn btn-primary">Guardar movimiento</button></div></form>`;
  document.body.append(overlay);
  const updateModes=()=>{document.querySelector('#removeMode').className='mode '+(movementMode==='remove'?'selected-remove':'');document.querySelector('#addMode').className='mode '+(movementMode==='add'?'selected-add':'');validateStock();};
  const validateStock=()=>{const qty=Math.max(1,Number(document.querySelector('#quantity').value)||1);const stock=Number(pendingProduct?.stock)||0;document.querySelector('#stockWarning').textContent=movementMode==='remove'&&qty>stock?`Aviso: el stock quedará negativo (${stock-qty}).`:'';};
  document.querySelector('#removeMode').addEventListener('click',()=>{movementMode='remove';updateModes()});
  document.querySelector('#addMode').addEventListener('click',()=>{movementMode='add';updateModes()});
  document.querySelector('#qtyMinus').addEventListener('click',()=>{const i=document.querySelector('#quantity');i.value=Math.max(1,(Number(i.value)||1)-1);validateStock()});
  document.querySelector('#qtyPlus').addEventListener('click',()=>{const i=document.querySelector('#quantity');i.value=Math.max(1,(Number(i.value)||1)+1);validateStock()});
  document.querySelector('#quantity').addEventListener('input',validateStock);
  document.querySelector('#cancelMovement').addEventListener('click',()=>overlay.remove());
  document.querySelector('#movementForm').addEventListener('submit',saveMovement);
}

async function saveMovement(e){
  e.preventDefault();
  const quantity=Math.max(1,Math.floor(Number(document.querySelector('#quantity').value)||1));
  const note=document.querySelector('#note').value.trim();
  let product=pendingProduct;
  if(!product){product={barcode:pendingBarcode,name:document.querySelector('#productName').value.trim(),sku:document.querySelector('#productSku').value.trim(),stock:0,createdAt:new Date().toISOString()};}
  const before=Number(product.stock)||0;
  const delta=movementMode==='add'?quantity:-quantity;
  product={...product,stock:before+delta,updatedAt:new Date().toISOString()};
  await saveProduct(product);
  await addMovement({barcode:product.barcode,productName:product.name,sku:product.sku||'',type:movementMode,quantity,note,stockBefore:before,stockAfter:product.stock,createdAt:new Date().toISOString()});
  document.querySelector('#movementOverlay')?.remove();
  toast(`${movementMode==='add'?'Entrada':'Retirada'} registrada · Stock: ${product.stock}`);
  await render();
}

function download(name,text,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
async function exportJson(){const data={version:1,exportedAt:new Date().toISOString(),products:await getProducts(),movements:await getMovements()};download(`mds-bajas-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(data,null,2),'application/json');}
async function exportCsv(){const ms=await getMovements();const quote=v=>`"${String(v??'').replaceAll('"','""')}"`;const rows=[['Fecha','Código','Producto','SKU','Tipo','Unidades','Stock antes','Stock después','Nota'],...ms.map(m=>[m.createdAt,m.barcode,m.productName,m.sku,m.type==='add'?'Entrada':'Retirada',m.quantity,m.stockBefore,m.stockAfter,m.note])];download(`mds-bajas-historial-${new Date().toISOString().slice(0,10)}.csv`,rows.map(r=>r.map(quote).join(';')).join('\n'),'text/csv;charset=utf-8');}
async function importJson(e){const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.products)||!Array.isArray(data.movements))throw new Error();if(!confirm(`Se reemplazarán los datos actuales por ${data.products.length} productos y ${data.movements.length} movimientos. ¿Continuar?`))return;await replaceAll(data.products,data.movements);toast('Copia importada correctamente');render();}catch{toast('El archivo no es una copia válida de MDS Bajas.')}finally{e.target.value='';}}

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
render();
