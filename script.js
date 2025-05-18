let halamanAktif = "default";
let semuaData = JSON.parse(localStorage.getItem("semuaData")) || {
  default: { judul: "Bidang Acara", daftar: [] },
};

async function simpanData() {
  localStorage.setItem("semuaData", JSON.stringify(semuaData));

  if (window.db) {
    const docRef = doc(window.db, "daftarBarang", "dataSemua");
    try {
      await setDoc(docRef, semuaData);
      console.log("✅ Data berhasil disimpan ke Firestore.");
    } catch (error) {
      console.error("❌ Gagal simpan ke Firestore:", error);
    }
  }
}

function renderDaftar() {
  const ul = document.getElementById("listBarang");
  ul.innerHTML = "";
  const daftarBarang = semuaData[halamanAktif]?.daftar || [];
  daftarBarang.forEach((item, index) => {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.cek;
    checkbox.onchange = () => {
      item.cek = checkbox.checked;
      span.classList.toggle("checked", item.cek);
      simpanData();
    };

    const span = document.createElement("span");
    span.textContent = item.nama;
    if (item.cek) span.classList.add("checked");

    const hapusBtn = document.createElement("button");
    hapusBtn.textContent = "Hapus";
    hapusBtn.onclick = () => {
      semuaData[halamanAktif].daftar.splice(index, 1);
      simpanData();
      renderDaftar();
    };

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(hapusBtn);
    ul.appendChild(li);
  });
}

function tambahBarang() {
  const nama = document.getElementById("inputBarang").value.trim();
  if (!nama) return;
  semuaData[halamanAktif].daftar.push({ nama: nama, cek: false });
  document.getElementById("inputBarang").value = "";
  simpanData();
  renderDaftar();
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
  if (!nama || semuaData[nama]) return;
  semuaData[nama] = { judul: nama, daftar: [] };
  halamanAktif = nama;
  renderNavigasi();
  simpanData();
  renderDaftar();
  document.getElementById("judulHalaman").textContent = nama;
  document.getElementById("judulInput").value = "";
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
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = canvas.height * imgWidth / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
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
        semuaData = docSnap.data();
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

  // Tambah tombol reset di pojok kanan bawah
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
});
