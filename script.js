// script.js
// ============================
// 🌟 GLOBAL STATE & CONFIG
// ============================
const firebaseConfig = {
  apiKey: "AIzaSyAurY86EouYcDbI186c6AqMukWbkEbvP0E",
  authDomain: "list-barang-semua-bidang.firebaseapp.com",
  projectId: "list-barang-semua-bidang",
  storageBucket: "list-barang-semua-bidang.appspot.com",
  messagingSenderId: "915737150263",
  appId: "1:915737150263:web:950d3a7de203a6389090b2",
  measurementId: "G-F8X8JC8WKG"
};

let halamanAktif = "default";
let semuaData = JSON.parse(localStorage.getItem("semuaData")) || {
  default: { judul: "Bidang Acara", daftar: [] },
};
let editIndex = null;
let firebaseInited = false;

// ============================
// 🌟 INIT FIREBASE DYNAMIC
// ============================
async function initFirebase() {
  if (firebaseInited) return;
  const [{ initializeApp }, { getFirestore, doc, setDoc, getDoc }] =
    await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")
    ]);
  const app = initializeApp(firebaseConfig);
  window.db = getFirestore(app);
  window.doc = doc;
  window.setDoc = setDoc;
  window.getDoc = getDoc;
  firebaseInited = true;
}

// ============================
// 🌟 UTILS: Toast & Save/Load
// ============================
function tampilkanToast(pesan) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = pesan;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

async function simpanData() {
  localStorage.setItem("semuaData", JSON.stringify(semuaData));
  if (firebaseInited) {
    const ref = doc(window.db, "daftarBarang", "dataSemua");
    try { await setDoc(ref, { semuaData }); }
    catch (e) { console.error(e); }
  }
}

async function loadDataDariFirestore() {
  await initFirebase();
  const ref = doc(window.db, "daftarBarang", "dataSemua");
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      semuaData = snap.data().semuaData || semuaData;
      renderNavigasi();
      renderDaftar();
      renderStatistik();
      tampilkanToast("🔁 Data disinkronisasi");
    }
  } catch (e) { console.error(e); }
}

// ============================
// 🌟 RENDER NAVIGASI & STATISTIK
// ============================
function renderNavigasi() {
  const nav = document.getElementById("navButtons");
  nav.innerHTML = "";
  Object.keys(semuaData).forEach(k => {
    const btn = document.createElement("button");
    btn.textContent = semuaData[k].judul;
    btn.onclick = () => {
      halamanAktif = k;
      document.getElementById("judulHalaman").textContent = semuaData[k].judul;
      document.getElementById("judulInput").value = "";
      renderDaftar(); renderStatistik();
    };
    nav.appendChild(btn);
  });
}

function renderStatistik() {
  const d = semuaData[halamanAktif].daftar;
  document.getElementById("statistikBarang").innerHTML = `
    <p>Total barang: <b>${d.length}</b> | Sudah diceklis: <b>${d.filter(x=>x.cek).length}</b></p>
  `;
}

// ============================
// 🌟 RENDER DAFTAR + DRAG&DROP + FILTER
// ============================
function renderDaftar() {
  const ul = document.getElementById("listBarang");
  ul.innerHTML = "";
  const d = semuaData[halamanAktif].daftar;
  const q = document.getElementById("searchInput").value.toLowerCase();
  const fD = document.getElementById("filterDone")?.checked;
  const fN = document.getElementById("filterNotDone")?.checked;

  d.forEach((item,i) => {
    if (!item.nama.toLowerCase().includes(q)) return;
    if ((item.cek && !fD) || (!item.cek && !fN)) return;

    const li = document.createElement("li");
    li.draggable = true;

    const cb = document.createElement("input");
    cb.type="checkbox"; cb.checked = item.cek;
    cb.onchange = ()=>{ item.cek = cb.checked; simpanData(); renderDaftar(); renderStatistik(); };

    const sp = document.createElement("span");
    sp.textContent = "📦 "+item.nama;
    if(item.cek) sp.classList.add("checked");

    const eb = document.createElement("button");
    eb.textContent="✏️";
    eb.onclick=()=>{
      document.getElementById("inputBarang").value = item.nama;
      editIndex = i;
      tampilkanToast(`📝 Edit: "${item.nama}"`);
    };

    const hb = document.createElement("button");
    hb.textContent="Hapus";
    hb.onclick=()=>{
      if(!confirm(`⚠️ Hapus “${item.nama}”?`)) return;
      d.splice(i,1); simpanData(); renderDaftar(); renderStatistik(); tampilkanToast("🗑️ Dihapus");
    };

    li.append(cb,sp,eb,hb);
    ul.appendChild(li);
  });

  let dragIdx=null;
  ul.querySelectorAll("li").forEach((li,idx)=>{
    li.addEventListener("dragstart",()=>dragIdx=idx);
    li.addEventListener("dragover",e=>{e.preventDefault();li.classList.add("drag-over")});
    li.addEventListener("dragleave",()=>li.classList.remove("drag-over"));
    li.addEventListener("drop",()=>{
      const arr = semuaData[halamanAktif].daftar;
      const [mv] = arr.splice(dragIdx,1);
      arr.splice(idx,0,mv);
      simpanData(); renderDaftar(); li.classList.remove("drag-over");
    });
  });
}

// ============================
// 🌟 ADD / EDIT BARANG
// ============================
function tambahBarang() {
  const inp = document.getElementById("inputBarang");
  const v = inp.value.trim();
  if(!v){ tampilkanToast("⚠️ Isi dulu namanya ya, bro!"); return; }
  if(editIndex!==null){
    semuaData[halamanAktif].daftar[editIndex].nama=v;
    tampilkanToast("✅ Edited: "+v);
    editIndex=null;
  } else {
    semuaData[halamanAktif].daftar.push({nama:v,cek:false});
    tampilkanToast("✅ Ditambah: "+v);
  }
  inp.value=""; simpanData(); renderDaftar(); renderStatistik();
}

// ============================
// 🌟 GANTI JUDUL & HALAMAN
// ============================
function gantiJudul(){
  const v=document.getElementById("judulInput").value.trim();
  if(!v) return;
  semuaData[halamanAktif].judul=v;
  document.getElementById("judulHalaman").textContent=v;
  simpanData(); renderNavigasi();
}
function buatHalamanBaru(){
  const n=prompt("Nama halaman:");
  if(!n||semuaData[n]){return alert("Invalid/exists");}
  semuaData[n]={judul:n,daftar:[]}; halamanAktif=n;
  renderNavigasi(); renderDaftar(); renderStatistik();
  document.getElementById("judulHalaman").textContent=n;
  document.getElementById("judulInput").value="";
  simpanData(); tampilkanToast("✅ Halaman baru");
}

// ============================
// 🌟 CARI, EXPORT, RESET
// ============================
function cariBarang(){ renderDaftar(); }
function simpanSebagaiJSON(){
  const blob=new Blob([JSON.stringify(semuaData,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download="daftar_barang.json"; a.click();
}
function simpanSebagaiPDF(){
  Promise.all([
    import("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
    import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
  ]).then(([hc,js])=>{
    hc.default(document.body).then(c=>{
      const img=c.toDataURL("image/png");
      const pdf=new js.jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const w=pdf.internal.pageSize.getWidth();
      const h=c.height*w/c.width;
      pdf.addImage(img,"PNG",0,0,w,h);
      pdf.save("daftar_barang.pdf");
    });
  });
}
function resetSemuaData(){
  if(!confirm("⚠️ Hapus *semua* data?")) return;
  semuaData={default:{judul:"Bidang Acara",daftar:[]}};
  halamanAktif="default"; editIndex=null;
  simpanData(); renderNavigasi(); renderDaftar(); renderStatistik();
  tampilkanToast("🔄 Reset semua");
}

// ============================
// 🌟 SETUP PAGE & UI UTILS
// ============================
document.addEventListener("DOMContentLoaded",()=>{
  // 1) Render langsung dari localStorage
  renderNavigasi(); renderDaftar(); renderStatistik();
  // 2) Sinkron di belakang layar
  loadDataDariFirestore();

  // Dark mode
  const t=document.getElementById("darkModeToggle");
  t.onclick=()=>{
    document.body.classList.toggle("dark");
    localStorage.setItem("tema",document.body.classList.contains("dark")?"dark":"light");
  };
  if(localStorage.getItem("tema")==="dark") document.body.classList.add("dark");

  // Sync button
  const sb=document.createElement("button");
  sb.textContent="🔁 Sync Data"; sb.onclick=loadDataDariFirestore;
  document.querySelector(".navbar").appendChild(sb);

  // Filter UI
  const fx=`
    <div class="filter-container" style="text-align:center;margin-bottom:15px;">
      <label><input type="checkbox" id="filterDone" checked onchange="renderDaftar()"> Selesai</label>
      <label><input type="checkbox" id="filterNotDone" checked onchange="renderDaftar()"> Belum Selesai</label>
    </div>`;
  document.querySelector(".search-container").insertAdjacentHTML("afterend",fx);

  // Reminder toast
  setInterval(()=>{
    const n=new Date();
    if(n.getMinutes()%2===0) tampilkanToast("⏰ Cek barangmu!");
  },60000);
});
