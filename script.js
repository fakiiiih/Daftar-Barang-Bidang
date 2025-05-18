let halamanAktif = "default";
let semuaData = JSON.parse(localStorage.getItem("semuaData")) || {
  default: { judul: "Bidang Acara", daftar: [] },
};

async function simpanData() {
  localStorage.setItem("semuaData", JSON.stringify(semuaData));

  if (window.db) {
    const docRef = doc(window.db, "daftarBarang", "dataSemua");
    try {
      await setDoc(docRef, { semuaData });
      console.log("✅ Data berhasil disimpan ke Firestore.");
    } catch (error) {
      console.error("❌ Gagal simpan ke Firestore:", error);
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
      console.log("🔁 Data disinkron dari Firestore.");
      renderNavigasi();
      renderDaftar();
      renderStatistik();
    }
  } catch (error) {
    console.error("⚠️ Gagal sync dari Firestore:", error);
  }
}

function tampilkanToast(pesan) {
  const toast = document.createElement("div");
  toast.textContent = pesan;
  toast.style.position = "fixed";
  toast.style.bottom = "100px";
  toast.style.right = "20px";
  toast.style.background = "#333";
  toast.style.color = "white";
  toast.style.padding = "10px 15px";
  toast.style.borderRadius = "8px";
  toast.style.opacity = "0.9";
  toast.style.zIndex = "999";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function renderDaftar() {
  const ul = document.getElementById("listBarang");
  ul.innerHTML = "";
  const daftarBarang = semuaData[halamanAktif]?.daftar || [];

  daftarBarang.forEach((item, index) => {
    const li = document.createElement("li");
    li.setAttribute("draggable", "true");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.cek;

    const span = document.createElement("span");
    span.textContent = item.nama;
    if (item.cek) span.classList.add("checked");

    checkbox.onchange = () => {
      item.cek = checkbox.checked;
      span.classList.toggle("checked", item.cek);
      simpanData();
      renderStatistik();
    };

    const hapusBtn = document.createElement("button");
    hapusBtn.textContent = "Hapus";
    hapusBtn.onclick = () => {
      semuaData[halamanAktif].daftar.splice(index, 1);
      simpanData();
      renderDaftar();
      renderStatistik();
    };

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(hapusBtn);
    ul.appendChild(li);
  });
}

function cariBarang() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const daftar = semuaData[halamanAktif]?.daftar || [];

  const hasilFilter = daftar
    .map((item, i) => ({ item, index: i }))
    .filter(({ item }) => item.nama.toLowerCase().includes(query));

  const ul = document.getElementById("listBarang");
  ul.innerHTML = "";
  hasilFilter.forEach(({ item, index }) => {
    const li = document.createElement("li");
    li.setAttribute("draggable", "true");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.cek;

    const span = document.createElement("span");
    span.textContent = item.nama;
    if (item.cek) span.classList.add("checked");

    checkbox.onchange = () => {
      item.cek = checkbox.checked;
      span.classList.toggle("checked", item.cek);
      simpanData();
      renderStatistik();
    };

    const hapusBtn = document.createElement("button");
    hapusBtn.textContent = "Hapus";
    hapusBtn.onclick = () => {
      semuaData[halamanAktif].daftar.splice(index, 1);
      simpanData();
      renderDaftar();
      renderStatistik();
    };

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(hapusBtn);
    ul.appendChild(li);
  });
}

function renderStatistik() {
  const daftar = semuaData[halamanAktif]?.daftar || [];
  const total = daftar.length;
  const selesai = daftar.filter(b => b.cek).length;
  document.getElementById("statistikBarang").innerHTML = `
    <p>Total barang: <b>${total}</b> | Sudah diceklis: <b>${selesai}</b></p>
  `;
}

function tambahBarang() {
  const nama = document.getElementById("inputBarang").value.trim();
  if (!nama) return;

  if (!semuaData[halamanAktif]) {
    semuaData[halamanAktif] = { judul: halamanAktif, daftar: [] };
  }

  semuaData[halamanAktif].daftar.push({ nama, cek: false });
  document.getElementById("inputBarang").value = "";
  document.getElementById("inputBarang").focus();
  simpanData();
  renderDaftar();
  renderStatistik();
}

function gantiJudul() {
  const judul = document.getElementById("judulInput").value.trim();
  if (!judul) return;
  document.getElementById("judulHalaman").textContent = judul;
  semuaData[halamanAktif].judul = judul;
  simpanData();
}

function buatHalamanBaru() {
  let nama = prompt("Masukkan nama halaman baru:");
  if (!nama || semuaData[nama] || /[^a-zA-Z0-9_ -]/.test(nama)) {
    alert("❌ Nama halaman tidak valid atau sudah ada.");
    return;
  }

  semuaData[nama] = { judul: nama, daftar: [] };
  halamanAktif = nama;
  renderNavigasi();
  document.getElementById("judulInput").value = semuaData[nama].judul;
  simpanData();
  renderDaftar();
  renderStatistik();
  document.getElementById("judulHalaman").textContent = nama;
  document.getElementById("judulInput").value = "";

  tampilkanToast("✅ Halaman baru berhasil dibuat!");
}

function renderNavigasi() {
  const navButtons = document.getElementById("navButtons");
  navButtons.innerHTML = '';
  Object.keys(semuaData).forEach((hal) => {
    const button = document.createElement("button");
    button.textContent = semuaData[hal].judul;
    button.onclick = () => {
      halamanAktif = hal;
      document.getElementById("judulHalaman").textContent = semuaData[hal].judul;
      document.getElementById("judulInput").value = "";
      renderDaftar();
      renderStatistik();
    };
    navButtons.appendChild(button);
  });
}

function simpanSebagaiJSON() {
  const jsonData = JSON.stringify(semuaData, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "daftar_barang.json";
  link.click();
}

function simpanSebagaiPDF() {
  const elemen = document.body;
  html2canvas(elemen).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = canvas.height * pageWidth / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
    pdf.save("agenda_hut_igt_2025.pdf");
  });
}

function resetSemuaData() {
  const konfirmasi = confirm("Apakah kamu yakin ingin menghapus semua data?");
  if (konfirmasi) {
    semuaData = {
      default: { judul: "Bidang Acara", daftar: [] }
    };
    halamanAktif = "default";
    simpanData();
    renderNavigasi();
    renderDaftar();
    renderStatistik();
    document.getElementById("judulHalaman").textContent = "Bidang Acara";
    document.getElementById("judulInput").value = "";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (window.db) {
    try {
      const docRef = doc(window.db, "daftarBarang", "dataSemua");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        semuaData = docSnap.data().semuaData || semuaData;
        simpanData();
        console.log("📥 Data diambil dari Firestore.");
      } else {
        console.log("📭 Tidak ada data Firestore, pakai localStorage.");
      }
    } catch (error) {
      console.error("⚠️ Gagal ambil data dari Firestore:", error);
    }
  }

  renderNavigasi();
  renderDaftar();
  renderStatistik();

  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset Semua Data";
  resetBtn.style.position = "fixed";
  resetBtn.style.bottom = "20px";
  resetBtn.style.right = "20px";
  resetBtn.style.backgroundColor = "#ff3333";
  resetBtn.style.color = "white";
  resetBtn.style.border = "none";
  resetBtn.style.borderRadius = "5px";
  resetBtn.style.padding = "10px 15px";
  resetBtn.style.cursor = "pointer";
  resetBtn.onclick = resetSemuaData;
  document.body.appendChild(resetBtn);

  // Drag-and-drop event
  const ul = document.getElementById("listBarang");
  ul.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("index", [...ul.children].indexOf(e.target));
  });

  ul.addEventListener("dragover", (e) => e.preventDefault());

  ul.addEventListener("drop", (e) => {
    const draggedIndex = e.dataTransfer.getData("index");
    const droppedIndex = [...ul.children].indexOf(e.target.closest("li"));
    const daftar = semuaData[halamanAktif].daftar;
    const [draggedItem] = daftar.splice(draggedIndex, 1);
    daftar.splice(droppedIndex, 0, draggedItem);
    simpanData();
    renderDaftar();
    renderStatistik();
  });
});

// 🔁 Auto-sync tiap 10 detik
setInterval(() => {
  console.log("📡 Mengambil data dari Firestore...");
  loadDataDariFirestore();
}, 10000);

setInterval(() => {
  console.log("⏳ Menyimpan data otomatis ke Firestore...");
  simpanData();
}, 10000);
