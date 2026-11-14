const $=s=>document.querySelector(s),LS='vattu_v1';
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
const money=n=>Math.round(n||0).toLocaleString('vi-VN');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S;try{S=JSON.parse(localStorage.getItem(LS))}catch(e){}
S=Object.assign({custom:[],ov:{},docs:[],seq:{},qr:'',qrNote:'',shop:''},S||{});
const save=()=>localStorage.setItem(LS,JSON.stringify(S));
CATALOG.forEach(x=>x.k=norm(x.n));
const all=()=>CATALOG.concat(S.custom).map(x=>{x.k=x.k||norm(x.n);return S.ov[x.id]?{...x,...S.ov[x.id]}:x});
const byId=()=>Object.fromEntries(all().map(x=>[x.id,x]));
const TABS=[['cat','Danh mục','▦'],['quote','Đơn hàng','✎'],['sale','Bán hàng','↗'],['buy','Nhập hàng','↙'],['stock','Tồn kho','▤'],['chart','Biểu đồ','▥']];
const TYPE={quote:{t:'Đơn hàng / Báo giá',p:'DH'},sale:{t:'Hóa đơn bán hàng',p:'HD'},buy:{t:'Phiếu nhập hàng',p:'PN'}};
let tab='cat',q='',grp='',D=null;
const tot=d=>d.lines.reduce((a,l)=>a+l.q*l.p,0);
function render(){
  $('#nav').innerHTML=TABS.map(([k,l,i])=>`<button class="${k==tab?'on':''}" onclick="go('${k}')"><b>${i}</b>${l}</button>`).join('');
  $('#ttl').textContent=TABS.find(t=>t[0]==tab)[1];
  ({cat:vCat,quote:vDocs,sale:vDocs,buy:vDocs,stock:vStock,chart:vChart})[tab]();
}
function go(k){tab=k;q='';grp='';render();scrollTo(0,0)}
function stock(ex){const m={};
  S.docs.forEach(d=>{if(d.type=='quote'||d.id==ex)return;d.lines.forEach(l=>{const r=m[l.id]||(m[l.id]={in:0,out:0,last:0});if(d.type=='buy'){r.in+=l.q;r.last=l.p}else r.out+=l.q})});return m}
const left=s=>s?s.in-s.out:0;
function filt(){const t=norm(q).split(/\s+/).filter(Boolean);return all().filter(x=>(!grp||x.g==grp)&&t.every(w=>x.k.includes(w)))}
function chips(cb){const gs=[...new Set(all().map(x=>x.g))];
  return `<div class="chips"><button class="${grp?'':'on'}" data-g="" onclick="grp=this.dataset.g;${cb}">Tất cả</button>${gs.map(g=>`<button class="${grp==g?'on':''}" data-g="${esc(g)}" onclick="grp=this.dataset.g;${cb}">${esc(g)}</button>`).join('')}</div>`}
/* ---- Danh mục ---- */
function vCat(){
  $('#act').innerHTML=`<button class="b g" onclick="addProd()">+ Hàng mới</button><button class="b g" onclick="openSet()">Cài đặt</button>`;
  $('#v').innerHTML=`<input id="s" placeholder="Tìm: co 90, van 42, tê giảm 60…" value="${esc(q)}" oninput="q=this.value;vCatList()">${chips('render()')}<div id="l"></div>`;vCatList()}
function vCatList(){const st=stock(),r=filt();
  $('#l').innerHTML=r.slice(0,100).map(x=>`<div class="card" onclick="editP('${x.id}')"><div>${esc(x.n)}</div><div class="row mut"><span>Nhập ${money(x.c)} · Bán <b>${money(x.p)}</b></span><span>Tồn ${left(st[x.id])}</span></div></div>`).join('')+(r.length>100?`<p class="mut">Còn ${r.length-100} mục, gõ thêm để lọc.</p>`:'')||'<p class="mut">Không tìm thấy hàng. Thử gõ ngắn hơn hoặc bấm “+ Hàng mới”.</p>'}
function editP(id){const x=byId()[id],n=prompt('Tên hàng',x.n);if(n===null||!n.trim())return;const g=prompt('Nhóm hàng',x.g);if(g===null)return;const c=prompt('Giá nhập',x.c);if(c===null)return;const p=prompt('Giá bán',x.p);if(p===null)return;
  S.ov[id]={n:n.trim(),k:norm(n),g:g.trim()||x.g,c:+c||0,p:+p||0};save();render()}
function addProd(){const n=prompt('Tên hàng mới');if(!n)return;const g=prompt('Nhóm hàng','Khác')||'Khác',c=+prompt('Giá nhập',0)||0,p=+prompt('Giá bán',0)||0;
  S.custom.push({id:'c'+Date.now(),n:n.trim(),c,p,g});save();render()}
const dl=(n,t,m)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:m}));a.download=n;a.click()};
function backup(){dl('sao-luu-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(S),'application/json')}
function restore(f){if(!f)return;f.text().then(t=>{try{const o=JSON.parse(t);if(!o.docs)throw 0;if(!confirm('Thay toàn bộ dữ liệu hiện tại bằng bản sao lưu?'))return;S=Object.assign({custom:[],ov:{},docs:[],seq:{}},o);save();render()}catch(e){alert('File sao lưu không hợp lệ.')}})}
/* ---- Đơn hàng / Bán / Nhập ---- */
function vDocs(){const T=TYPE[tab];
  $('#act').innerHTML=`<button class="b" onclick="edit('${tab}')">+ Tạo mới</button>`;
  const ds=S.docs.filter(d=>d.type==tab).sort((a,b)=>b.date.localeCompare(a.date)||b.no.localeCompare(a.no));
  $('#v').innerHTML=ds.length?ds.map(d=>`<div class="card" onclick="edit('${tab}','${d.id}')"><div class="row"><b>${d.no}</b><b>${money(tot(d))} đ</b></div><div class="mut">${d.date} · ${esc(d.party||'Chưa ghi tên')} · ${d.lines.length} mặt hàng</div></div>`).join(''):`<p class="mut">Chưa có phiếu nào. Bấm “Tạo mới” để lập ${T.t.toLowerCase()}.</p>`}
function edit(type,id){D=id?JSON.parse(JSON.stringify(S.docs.find(d=>d.id==id))):{id:'d'+Date.now(),type,no:'',date:new Date().toISOString().slice(0,10),party:'',note:'',lines:[],isNew:true};drawEd()}
function drawEd(){const m=$('#modal'),y=m.scrollTop,st=stock(D.id),T=TYPE[D.type];m.hidden=false;
  m.innerHTML=`<div class="row" style="padding:10px 0"><h1>${T.t}${D.no?' · '+D.no:''}</h1><button class="b g noprt" onclick="closeEd()">Đóng</button></div>
  ${S.shop?`<div class="mut" style="margin-bottom:6px">${esc(S.shop)}</div>`:''}<div class="card"><input placeholder="${D.type=='buy'?'Nhà cung cấp':'Khách hàng'}" value="${esc(D.party)}" oninput="D.party=this.value"><div style="height:6px"></div><input type="date" value="${D.date}" onchange="D.date=this.value"><div style="height:6px"></div><input placeholder="Ghi chú" value="${esc(D.note)}" oninput="D.note=this.value"></div>
  ${D.lines.map((l,i)=>`<div class="card"><div class="row"><span>${esc(l.n)}</span><button class="r noprt" onclick="D.lines.splice(${i},1);drawEd()">✕</button></div><div class="row" style="margin-top:6px"><input class="q" type="number" inputmode="decimal" min="0" value="${l.q}" onchange="D.lines[${i}].q=+this.value||0;drawEd()"><span class="mut">×</span><input class="pr" type="number" inputmode="numeric" value="${l.p}" onchange="D.lines[${i}].p=+this.value||0;drawEd()"><b>${money(l.q*l.p)}</b></div>${D.type=='sale'&&l.q>left(st[l.id])?`<div class="neg mut">Kho chỉ còn ${left(st[l.id])}</div>`:''}</div>`).join('')}
  ${D.type=='buy'?'':S.qr?`<div class="card" style="text-align:center"><img src="${S.qr}" alt="Mã QR thanh toán" style="max-width:220px;width:100%;background:#fff;border-radius:8px"><div class="mut">${esc(S.qrNote||'')}</div><button class="b g noprt" onclick="showQR()">Phóng to cho khách quét</button></div>`:`<p class="mut noprt">Chưa có mã QR thanh toán. Vào Danh mục → Cài đặt để tải ảnh QR lên.</p>`}
  <button class="b g noprt" style="width:100%" onclick="pick()">+ Thêm hàng từ danh mục</button>
  <div class="foot"><div><div class="mut">Tổng cộng</div><b style="font-size:18px">${money(tot(D))} đ</b></div><div class="noprt row">${D.isNew?'':`<button class="r" onclick="delDoc()">Xóa</button>`}${D.type=='quote'&&!D.isNew?`<button class="b g" onclick="toSale()">Lập hóa đơn</button>`:''}<button class="b g" onclick="print()">In</button><button class="b" onclick="saveDoc()">Lưu</button></div></div>`;m.scrollTop=y}
function pick(){q='';grp='';const m=document.createElement('div');m.id='pk';m.className='ov';m.style.zIndex=30;document.body.append(m);pkDraw()}
function pkDraw(){$('#pk').innerHTML=`<div class="row" style="padding:10px 0;position:sticky;top:0;background:var(--bg)"><input id="ps" placeholder="Gõ tên: co 90, tê giảm 60/34…" value="${esc(q)}" oninput="q=this.value;pkList()"><button class="b" onclick="$('#pk').remove();q='';grp='';drawEd()">Xong</button></div>${chips('pkDraw()')}<div id="pl"></div>`;pkList()}
function pkList(){const n=Object.fromEntries(D.lines.map(l=>[l.id,l.q])),st=stock(D.id),r=filt();
  $('#pl').innerHTML=r.slice(0,80).map(x=>`<div class="card" onclick="add('${x.id}')"><div class="row"><span>${esc(x.n)}</span>${n[x.id]?`<b style="color:var(--pri)">×${n[x.id]}</b>`:''}</div><div class="mut">${money(D.type=='buy'?x.c:x.p)} đ · tồn ${left(st[x.id])}</div></div>`).join('')+(r.length>80?`<p class="mut">Còn ${r.length-80} mục, gõ thêm để lọc.</p>`:'')||'<p class="mut">Không tìm thấy hàng.</p>'}
function add(id){const x=byId()[id],l=D.lines.find(l=>l.id==id);l?l.q++:D.lines.push({id,n:x.n,q:1,p:D.type=='buy'?x.c:x.p,c:x.c});pkList()}
function saveDoc(){if(!D.lines.length)return alert('Chưa có mặt hàng nào. Bấm “Thêm hàng từ danh mục”.');
  if(D.isNew){S.seq[D.type]=(S.seq[D.type]||0)+1;D.no=TYPE[D.type].p+'-'+String(S.seq[D.type]).padStart(4,'0')}
  delete D.isNew;const i=S.docs.findIndex(d=>d.id==D.id);i<0?S.docs.push(D):S.docs[i]=D;save();closeEd()}
function closeEd(){$('#modal').hidden=true;D=null;render()}
function delDoc(){if(confirm('Xóa phiếu này?')){S.docs=S.docs.filter(d=>d.id!=D.id);save();closeEd()}}
function toSale(){D=Object.assign(JSON.parse(JSON.stringify(D)),{id:'d'+Date.now(),type:'sale',no:'',isNew:true});tab='sale';drawEd()}
/* ---- Cài đặt & QR ---- */
function openSet(){let m=$('#st');if(!m){m=document.createElement('div');m.id='st';m.className='ov';m.style.zIndex=35;document.body.append(m)}
  m.innerHTML=`<div class="row" style="padding:10px 0"><h1>Cài đặt</h1><button class="b" onclick="$('#st').remove();render()">Xong</button></div>
  <div class="card"><b>Tên cửa hàng (in trên phiếu)</b><div style="height:6px"></div><input value="${esc(S.shop||'')}" oninput="S.shop=this.value;save()"></div>
  <div class="card"><b>Mã QR thanh toán</b>${S.qr?`<div style="text-align:center;margin:8px 0"><img src="${S.qr}" alt="Mã QR" style="max-width:240px;width:100%;background:#fff;border-radius:8px"></div>`:'<p class="mut">Chưa có ảnh QR. Chọn ảnh QR ngân hàng từ thư viện ảnh.</p>'}<input type="file" accept="image/*" id="qf" hidden onchange="setQR(this.files[0])"><div class="row"><button class="b g" onclick="$('#qf').click()">${S.qr?'Đổi ảnh QR':'Tải ảnh QR lên'}</button>${S.qr?`<button class="r" onclick="S.qr='';save();openSet()">Xóa QR</button>`:''}</div><div style="height:8px"></div><input placeholder="Ghi chú: chủ tài khoản, ngân hàng, số TK" value="${esc(S.qrNote||'')}" oninput="S.qrNote=this.value;save()"></div>
  <div class="card"><b>Dữ liệu</b><div class="row" style="margin-top:8px"><button class="b g" onclick="backup()">Sao lưu</button><button class="b g" onclick="$('#rf').click()">Khôi phục</button></div><input id="rf" type="file" accept=".json" hidden onchange="restore(this.files[0])"></div>`}
function setQR(f){if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,700/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);S.qr=c.toDataURL('image/jpeg',.92);save();openSet()};im.onerror=()=>alert('Không đọc được ảnh này.');im.src=r.result};r.readAsDataURL(f)}
function showQR(){const m=document.createElement('div');m.className='ov';m.style.cssText='z-index:40;text-align:center';m.innerHTML=`<img src="${S.qr}" alt="Mã QR" style="width:100%;max-width:420px;background:#fff;border-radius:12px;margin-top:20px"><h1 style="margin:12px 0">${money(tot(D))} đ</h1><div class="mut">${esc(S.qrNote||'')}</div><button class="b" style="margin-top:16px" onclick="this.parentNode.remove()">Đóng</button>`;document.body.append(m)}
/* ---- Tồn kho ---- */
function vStock(){$('#act').innerHTML=`<button class="b g" onclick="csv()">Xuất CSV</button>`;
  $('#v').innerHTML=`<input placeholder="Tìm hàng…" value="${esc(q)}" oninput="q=this.value;vStockList()">${chips('render()')}<label class="mut" style="display:block;margin:4px 0 8px"><input type="checkbox" id="sh" style="width:auto" onchange="vStockList()"> Hiện cả hàng chưa có giao dịch</label><div id="l"></div>`;vStockList()}
function rows(){const st=stock(),sh=$('#sh')&&$('#sh').checked;return filt().map(x=>{const s=st[x.id]||{in:0,out:0};return{...x,in:s.in,out:s.out,left:s.in-s.out,val:(s.in-s.out)*(s.last||x.c)}}).filter(r=>sh||r.in||r.out)}
function vStockList(){const r=rows();
  $('#l').innerHTML=`<div class="kpi"><div class="card"><span class="mut">Mặt hàng</span><b>${r.length}</b></div><div class="card"><span class="mut">Giá trị tồn</span><b>${money(r.reduce((a,x)=>a+x.val,0))} đ</b></div></div>`+(r.slice(0,150).map(x=>`<div class="card"><div>${esc(x.n)}</div><div class="row mut"><span>Nhập ${x.in} · Xuất ${x.out}</span><b class="${x.left<0?'neg':''}" style="font-size:15px">Tồn ${x.left}</b></div></div>`).join('')||'<p class="mut">Chưa có giao dịch nhập/xuất. Lập phiếu nhập hàng để bắt đầu theo dõi kho, hoặc tick “Hiện cả hàng chưa có giao dịch”.</p>')}
function csv(){const t='Tên,Nhập,Xuất,Tồn,Giá trị tồn\n'+rows().map(x=>[`"${x.n.replace(/"/g,'""')}"`,x.in,x.out,x.left,Math.round(x.val)].join(',')).join('\n');dl('ton-kho.csv','\ufeff'+t,'text/csv')}
/* ---- Biểu đồ ---- */
function cols(mo,ser){const W=340,H=160,mx=Math.max(1,...ser.flatMap(s=>mo.map(m=>s.d[m]))),g=W/mo.length,bw=g/(ser.length+1);
  return `<svg viewBox="0 0 ${W} ${H+20}" width="100%" role="img" aria-label="Biểu đồ theo tháng">${mo.map((m,i)=>ser.map((s,j)=>{const h=Math.max(0,s.d[m])/mx*H;return `<rect x="${i*g+bw*(j+.5)}" y="${H-h}" width="${bw*.9}" height="${h}" rx="2" fill="${s.c}"/>`}).join('')+`<text x="${i*g+g/2}" y="${H+14}" text-anchor="middle" font-size="10" fill="var(--mut)">${m.slice(5)}/${m.slice(2,4)}</text>`).join('')}</svg><div class="mut">Cột cao nhất: ${money(mx)} đ</div>`}
function vChart(){$('#act').innerHTML='';const n=new Date(),mo=[];
  for(let i=5;i>=0;i--){const d=new Date(n.getFullYear(),n.getMonth()-i,1);mo.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'))}
  const z=()=>Object.fromEntries(mo.map(m=>[m,0])),sale=z(),buy=z(),prof=z(),top={};let rev=0,cost=0,spend=0;
  S.docs.forEach(d=>{const m=d.date.slice(0,7),t=tot(d);
    if(d.type=='sale'){const c=d.lines.reduce((a,l)=>a+l.q*(l.c||0),0);rev+=t;cost+=c;if(m in sale){sale[m]+=t;prof[m]+=t-c}d.lines.forEach(l=>top[l.n]=(top[l.n]||0)+l.q*l.p)}
    if(d.type=='buy'){spend+=t;if(m in buy)buy[m]+=t}});
  const B=byId(),val=Object.entries(stock()).reduce((a,[id,s])=>a+left(s)*(s.last||(B[id]||{}).c||0),0),tp=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,8),mx=tp.length?tp[0][1]:1;
  $('#v').innerHTML=`<div class="kpi"><div class="card"><span class="mut">Doanh thu bán</span><b>${money(rev)} đ</b></div><div class="card"><span class="mut">Lợi nhuận gộp</span><b>${money(rev-cost)} đ</b></div><div class="card"><span class="mut">Tiền nhập hàng</span><b>${money(spend)} đ</b></div><div class="card"><span class="mut">Giá trị tồn kho</span><b>${money(val)} đ</b></div></div>
  <div class="card"><b>6 tháng gần nhất</b><div class="lg"><span><i style="background:var(--pri)"></i>Bán</span><span><i style="background:var(--amb)"></i>Nhập</span><span><i style="background:var(--blue)"></i>Lãi</span></div>${cols(mo,[{d:sale,c:'var(--pri)'},{d:buy,c:'var(--amb)'},{d:prof,c:'var(--blue)'}])}</div>
  <div class="card"><b>Bán chạy nhất (theo doanh thu)</b><div style="margin-top:8px">${tp.map(([k,v])=>`<div class="row"><span>${esc(k)}</span><b>${money(v)}</b></div><div class="bar" style="width:${v/mx*100}%"></div>`).join('')||'<p class="mut">Chưa có hóa đơn bán hàng. Lập hóa đơn ở mục Bán hàng để xem biểu đồ.</p>'}</div></div>`}
render();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
