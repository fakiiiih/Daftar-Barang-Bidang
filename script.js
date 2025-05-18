// script.js
// ✅ Inisialisasi variabel
let halamanAktif = "default";
let semuaData = JSON.parse(localStorage.getItem("semuaData")) || {
  default: { judul: "Bidang Acara", daftar: [] },
};

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
    }
  } catch (err) {
    console.error("Gagal ambil data dari Firestore:", err);
  }
}

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

function renderDaftar() {
  const ul = document.getElementById("listBarang");
  ul.innerHTML = "";
  const daftar = semuaData[halamanAktif]?.daftar || [];

  daftar.forEach((item, index) => {
    const li = document.createElement("li");
    li.setAttribute("draggable", "true");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.cek;

    const span = document.createElement("span");
    span.textContent = "📦 " + item.nama;
    if (item.cek) span.classList.add("checked");

    checkbox.onchange = () => {
      item.cek = checkbox.checked;
      span.classList.toggle("checked", item.cek);
      simpanData();
      renderStatistik();
    };

    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => {
      const inputEdit = document.createElement("input");
      inputEdit.type = "text";
      inputEdit.value = item.nama;
      inputEdit.onkeydown = (e) => {
        if (e.key === "Enter") {
          const namaBaru = inputEdit.value.trim();
          if (namaBaru === "") {
            tampilkanToast("Nama barang tidak boleh kosong");
            return;
          }
          item.nama = namaBaru;
          simpanData();
          renderDaftar();
          renderStatistik();
        }
      };
      li.innerHTML = "";
      li.appendChild(checkbox);
      li.appendChild(inputEdit);
      li.appendChild(hapusBtn);
    };

    const hapusBtn = document.createElement("button");
    hapusBtn.textContent = "Hapus";
    hapusBtn.onclick = () => {
      const konfirmasi = confirm("Yakin ingin menghapus barang ini?");
      if (konfirmasi) {
        semuaData[halamanAktif].daftar.splice(index, 1);
        simpanData();
        renderDaftar();
        renderStatistik();
      }
    };

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(hapusBtn);
    ul.appendChild(li);
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

function tambahBarang() {
  const input = document.getElementById("inputBarang");
  const nama = input.value.trim();
  if (!nama) {
    tampilkanToast("Nama barang tidak boleh kosong");
    return;
  }

  semuaData[halamanAktif].daftar.push({ nama, cek: false });
  input.value = "";
  input.focus();
  simpanData();
  renderDaftar();
  renderStatistik();
}

function gantiJudul() {
  const input = document.getElementById("judulInput");
  const judul = input.value.trim();
  if (!judul) return;

  semuaData[halamanAktif].judul = judul;
  document.getElementById("judulHalaman").textContent = judul;
  simpanData();
  renderNavigasi();
}

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

function cariBarang() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const ul = document.getElementById("listBarang");
  const daftar = semuaData[halamanAktif]?.daftar || [];

  ul.innerHTML = "";

  daftar
    .map((item, i) => ({ item, index: i }))
    .filter(({ item }) => item.nama.toLowerCase().includes(query))
    .forEach(({ item, index }) => {
      const li = document.createElement("li");
      li.setAttribute("draggable", "true");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.cek;

      const span = document.createElement("span");
      span.textContent = "📦 " + item.nama;
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
        const konfirmasi = confirm("Yakin ingin menghapus barang ini?");
        if (konfirmasi) {
          semuaData[halamanAktif].daftar.splice(index, 1);
          simpanData();
          renderDaftar();
          renderStatistik();
        }
      };

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(hapusBtn);
      ul.appendChild(li);
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
  html2canvas(elemen).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = canvas.height * pageWidth / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
    pdf.save("agenda_hut_igt_2025.pdf");
  });
}

function resetSemuaData() {
  const konfirmasi = confirm("Apakah kamu yakin ingin menghapus semua data?");
  if (!konfirmasi) return;

  semuaData = {
    default: { judul: "Bidang Acara", daftar: [] },
  };
  halamanAktif = "default";
  simpanData();
  renderNavigasi();
  renderDaftar();
  renderStatistik();
  document.getElementById("judulHalaman").textContent = "Bidang Acara";
  document.getElementById("judulInput").value = "";
  renderStatistik();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadDataDariFirestore();
  renderNavigasi();
  renderDaftar();
  renderStatistik();

  const toggleBtn = document.getElementById("darkModeToggle");
  toggleBtn.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("tema", document.body.classList.contains("dark") ? "dark" : "light");
  };

  if (localStorage.getItem("tema") === "dark") {
    document.body.classList.add("dark");
  }

  const ul = document.getElementById("listBarang");
  let draggedItemIndex;

  ul.addEventListener("dragstart", (e) => {
    draggedItemIndex = [...ul.children].indexOf(e.target);
    e.dataTransfer.effectAllowed = "move";
  });

  ul.addEventListener("dragover", (e) => {
    e.preventDefault();
    const target = e.target.closest("li");
    if (target) target.classList.add("drag-over");
  });

  ul.addEventListener("dragleave", (e) => {
    const target = e.target.closest("li");
    if (target) target.classList.remove("drag-over");
  });

  ul.addEventListener("drop", (e) => {
    e.preventDefault();
    const target = e.target.closest("li");
    if (!target) return;
    const droppedIndex = [...ul.children].indexOf(target);
    const daftar = semuaData[halamanAktif].daftar;
    const [draggedItem] = daftar.splice(draggedItemIndex, 1);
    daftar.splice(droppedIndex, 0, draggedItem);
    simpanData();
    renderDaftar();
    renderStatistik();
    target.classList.remove("drag-over");
  });
});

// Auto sync
setInterval(loadDataDariFirestore, 10000);
setInterval(simpanData, 10000);

// Reminder Notifikasi (dummy contoh, bisa dikembangkan)
setInterval(() => {
  const now = new Date();
  if (now.getMinutes() % 2 === 0) {
    tampilkanToast("⏰ Jangan lupa cek barangmu sekarang!");
  }
}, 1800000);
