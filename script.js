// ============================
// 🌟 GLOBAL STATE
// ============================
let halamanAktif = "default";
let semuaData = JSON.parse(localStorage.getItem("semuaData")) || {
  default: { judul: "Bidang Acara", daftar: [] },
};
// Index barang yang sedang diedit (null = mode tambah)
let editIndex = null;

// ============================
// 🌟 UTILS: Toast & Save/Load
// ============================
function tampilkanToast(pesan) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = pesan;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function simpanData() {
  localStorage.setItem("semuaData", JSON.stringify(semuaData));
  if (window.db) {
    const docRef = doc(window.db, "daftarBarang", "dataSemua");
    try {
      await setDoc(docRef, { semuaData });
    } catch (err) {
      console.error("Gagal simpan ke Firestore:", err);
    }
  }
}

async function loadDataDariFirestore() {
  if (!window.db) return;
  try {
    const docRef = doc(window.db, "daftarBarang", "dataSemua");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      semuaData = docSnap.data().semuaData || semuaData;
      renderNavigasi();
      renderDaftar();
      renderStatistik();
      tampilkanToast("🔁 Data disinkronisasi dari Firebase");
    }
  } catch (err) {
    console.error("Gagal ambil data dari Firestore:", err);
  }
}

// ============================
// 🌟 RENDER NAVIGASI & STATISTIK
// ============================
function renderNavigasi() {
  const nav = document.getElementById("navButtons");
  nav.innerHTML = "";
  Object.keys(semuaData).forEach((key) => {
    const btn = document.createElement("button");
    btn.textContent = semuaData[key].judul;
    btn.onclick = () => {
      halamanAktif = key;
      document.getElementById("judulHalaman").textContent = semuaData[key].judul;
      document.getElementById("judulInput").value = "";
      renderDaftar();
      renderStatistik();
    };
    nav.appendChild(btn);
  });
}

function renderStatistik() {
  const daftar = semuaData[halamanAktif]?.daftar || [];
  const total = daftar.length;
  const selesai = daftar.filter((b) => b.cek).length;
  document.getElementById("statistikBarang").innerHTML = `
    <p>Total barang: <b>${total}</b> | Sudah diceklis: <b>${selesai}</b></p>
  `;
}

// ============================
// 🌟 RENDER DAFTAR + DRAG&DROP + FILTER
// ============================
function renderDaftar() {
  const ul = document.getElementById("listBarang");
  ul.innerHTML = "";
  const daftar = semuaData[halamanAktif]?.daftar || [];
  const showDone = document.getElementById("filterDone")?.checked;
  const showNotDone = document.getElementById("filterNotDone")?.checked;
  const query = document.getElementById("searchInput").value.toLowerCase();

  daftar.forEach((item, index) => {
    // filter by search
    if (!item.nama.toLowerCase().includes(query)) return;
    // filter by checkbox
    if ((item.cek && !showDone) || (!item.cek && !showNotDone)) return;

    const li = document.createElement("li");
    li.draggable = true;

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.cek;
    checkbox.onchange = () => {
      item.cek = checkbox.checked;
      simpanData();
      renderDaftar();
      renderStatistik();
    };

    // Nama barang
    const span = document.createElement("span");
    span.textContent = "📦 " + item.nama;
    if (item.cek) span.classList.add("checked");

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => {
      document.getElementById("inputBarang").value = item.nama;
      editIndex = index;
      tampilkanToast(`📝 Kamu sedang mengedit: "${item.nama}"`);
    };

    // Hapus button
    const hapusBtn = document.createElement("button");
    hapusBtn.textContent = "Hapus";
    hapusBtn.onclick = () => {
      if (!confirm(`⚠️ Yakin ingin menghapus “${item.nama}”?`)) return;
      semuaData[halamanAktif].daftar.splice(index, 1);
      simpanData();
      renderDaftar();
      renderStatistik();
      tampilkanToast("🗑️ Barang dihapus");
    };

    li.append(checkbox, span, editBtn, hapusBtn);
    ul.appendChild(li);
  });

  // Drag & Drop handlers
  let draggedIndex = null;
  ul.querySelectorAll("li").forEach((li, idx) => {
    li.addEventListener("dragstart", () => (draggedIndex = idx));
    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      li.classList.add("drag-over");
    });
    li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
    li.addEventListener("drop", () => {
      const daftarRef = semuaData[halamanAktif].daftar;
      const [pindah] = daftarRef.splice(draggedIndex, 1);
      daftarRef.splice(idx, 0, pindah);
      simpanData();
      renderDaftar();
      li.classList.remove("drag-over");
    });
  });
}

// ============================
// 🌟 ADD / EDIT BARANG
// ============================
function tambahBarang() {
  const input = document.getElementById("inputBarang");
  const nama = input.value.trim();
  if (!nama) {
    tampilkanToast("⚠️ Isi dulu namanya ya, bro!");
    return;
  }

  if (editIndex !== null) {
    // edit mode
    semuaData[halamanAktif].daftar[editIndex].nama = nama;
    tampilkanToast("✅ Berhasil edit: " + nama);
    editIndex = null;
  } else {
    // add mode
    semuaData[halamanAktif].daftar.push({ nama, cek: false });
    tampilkanToast("✅ Barang baru ditambahkan");
  }

  input.value = "";
  simpanData();
  renderDaftar();
  renderStatistik();
}

// ============================
// 🌟 GANTI JUDUL HALAMAN
// ============================
function gantiJudul() {
  const input = document.getElementById("judulInput");
  const judul = input.value.trim();
  if (!judul) return;
  semuaData[halamanAktif].judul = judul;
  document.getElementById("judulHalaman").textContent = judul;
  simpanData();
  renderNavigasi();
}

// ============================
// 🌟 BUAT HALAMAN BARU
// ============================
function buatHalamanBaru() {
  const nama = prompt("Masukkan nama halaman:");
  if (!nama || semuaData[nama]) {
    alert("Nama tidak valid atau sudah digunakan.");
    return;
  }
  semuaData[nama] = { judul: nama, daftar: [] };
  halamanAktif = nama;
  renderNavigasi();
  renderDaftar();
  renderStatistik();
  document.getElementById("judulHalaman").textContent = nama;
  document.getElementById("judulInput").value = "";
  simpanData();
  tampilkanToast("✅ Halaman baru berhasil dibuat!");
}

// ============================
// 🌟 CARI BARANG
// ============================
function cariBarang() {
  renderDaftar();
}

// ============================
// 🌟 SIMPAN SEBAGAI JSON
// ============================
function simpanSebagaiJSON() {
  const jsonData = JSON.stringify(semuaData, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "daftar_barang.json";
  link.click();
}

// ============================
// 🌟 SIMPAN SEBAGAI PDF
// ============================
function simpanSebagaiPDF() {
  // lazy load libraries
  Promise.all([
    import("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
    import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
  ]).then(([html2canvas, jsPDF]) => {
    html2canvas.default(document.body).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
      pdf.save("daftar_barang.pdf");
    });
  });
}

// ============================
// 🌟 RESET SEMUA DATA
// ============================
function resetSemuaData() {
  if (!confirm("⚠️ Ini akan menghapus *semua* data. Yakin mau lanjutkan?")) return;
  semuaData = { default: { judul: "Bidang Acara", daftar: [] } };
  halamanAktif = "default";
  editIndex = null;
  simpanData();
  renderNavigasi();
  renderDaftar();
  renderStatistik();
  tampilkanToast("🔄 Semua data telah di‑reset");
}

// ============================
// 🌟 PAGE SETUP
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  // Load data sekali dari Firestore
  await loadDataDariFirestore();

  renderNavigasi();
  renderDaftar();
  renderStatistik();

  // Dark mode toggle
  const toggleBtn = document.getElementById("darkModeToggle");
  toggleBtn.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("tema", document.body.classList.contains("dark") ? "dark" : "light");
  };
  if (localStorage.getItem("tema") === "dark") {
    document.body.classList.add("dark");
  }

  // Tambah tombol Sync manual
  const syncBtn = document.createElement("button");
  syncBtn.textContent = "🔁 Sync Data";
  syncBtn.onclick = loadDataDariFirestore;
  document.querySelector(".navbar").appendChild(syncBtn);

  // Tambah UI filter selesai/belum
  const filterHTML = `
    <div class="filter-container" style="text-align:center; margin-bottom:15px;">
      <label><input type="checkbox" id="filterDone" checked onchange="renderDaftar()"> Selesai</label>
      <label><input type="checkbox" id="filterNotDone" checked onchange="renderDaftar()"> Belum Selesai</label>
    </div>`;
  document.querySelector(".search-container").insertAdjacentHTML("afterend", filterHTML);

  // Reminder toast setiap 2 menit (contoh)
  setInterval(() => {
    const now = new Date();
    if (now.getMinutes() % 2 === 0) {
      tampilkanToast("⏰ Jangan lupa cek barangmu sekarang!");
    }
  }, 60000);
});
