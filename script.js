// ================== KONFIGURASI ==================
const WEB_APPS = [
{
    url: "https://script.google.com/macros/s/AKfycbxiA3hWYGeAVuz8PK_CXdYaBy6dwEJCWUhO0KnOzH-ZxFKth1nzwg1ousdLLYDfQPEi/exec",
    token: "email444",
  },
  
  {
    url: "https://script.google.com/macros/s/AKfycbytaALG4NBqrgy5pXL6Qkwu3DAFBIpScXvbN1_WL_Zr9Mm54gECbCeY-vAXB3rBXTKR/exec",
    token: "email123",
  },
  
  {
    url: "https://script.google.com/macros/s/AKfycbxia_lb1-nWj9yTMA-34dDC7kesNhf63wsv_aUsWyT-w3zd-sLsHNsPxwV6dnE3bIev/exec",
    token: "email789",
  },
];

// ================== ELEMENTS ==================
const textarea = document.getElementById("dataInput");
const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const sendBtn = document.getElementById("sendBtn");
const emailBtn = document.getElementById("sendEmailBtn");
const hapusBtn = document.getElementById("hapusBtn");
const tbody = document.querySelector("#statusTable tbody");

// ================== KIRIM MASSAL KE SHEET ==================
function kirimMassal() {
  const lines = textarea.value.trim().split("\n");
  if (!lines.length) {
    statusEl.innerText = "❌ Data kosong";
    statusEl.style.color = "red";
    return;
  }

  sendBtn.disabled = true;
  sendBtn.innerText = "⏳ Mengirim...";

  const promises = WEB_APPS.map((app, idx) => {
    const start = idx * 100;
    const end = start + 100;
    const chunk = lines.slice(start, end);
    if (!chunk.length) return Promise.resolve();

    const formData = new URLSearchParams();
    formData.append("token", app.token);

    chunk.forEach((line, i) => {
      const [nama, email, pesan] = line.split(",").map((s) => s.trim());
      if (nama && email && email.includes("@")) {
        formData.append(`nama${i}`, nama);
        formData.append(`email${i}`, email);
        if (pesan) formData.append(`pesan${i}`, pesan);
      }
    });

    return fetch(app.url, { method: "POST", body: formData })
      .then((res) => res.text())
      .then((res) => {
        if (res.trim() !== "success") throw new Error(res);
      });
  });

  Promise.allSettled(promises).then((results) => {
    let successCount = 0,
      failCount = 0;
    results.forEach((r) =>
      r.status === "fulfilled" ? successCount++ : failCount++,
    );
    statusEl.innerText = `📤 Kirim selesai: ${successCount} Web App berhasil, ${failCount} gagal`;
    statusEl.style.color = failCount ? "red" : "green";
    textarea.value = "";
    sendBtn.disabled = false;
    sendBtn.innerText = "🚀 Kirim ke Sheet";
    lihatStatus(); // refresh tabel & summary
  });
}

// ================== JALANKAN EMAIL OTOMATIS ==================
function kirimEmail() {
  let total = 0,
    berhasil = 0,
    gagal = 0;

  const promises = WEB_APPS.map((app) =>
    fetch(`${app.url}?action=getStatus`)
      .then((res) => res.json())
      .then((data) => {
        data.forEach((row) => {
          const status = row[3]?.trim().toLowerCase(); // kolom Status
          total++;
          if (status === "sent") berhasil++;
          else if (status === "failed") gagal++;
        });
        return fetch(`${app.url}?action=sendEmail`).then((res) => res.json());
      }),
  );

  Promise.all(promises)
    .then(() => {
      summaryEl.innerText = `Total: ${total} | Berhasil: ${berhasil} | Gagal: ${gagal}`;
      statusEl.innerText = "📤 Email otomatis dijalankan";
      statusEl.style.color = "blue";
      lihatStatus();
    })
    .catch((err) => {
      statusEl.innerText = "❌ Gagal jalankan email";
      statusEl.style.color = "red";
      console.error(err);
    });
}

// ================== HAPUS DATA ==================
function hapusData() {
  const promises = WEB_APPS.map((app) =>
    fetch(`${app.url}?action=hapusData`).then((res) => res.json()),
  );
  Promise.all(promises)
    .then(() => {
      statusEl.innerText = "🗑 Semua data dihapus";
      statusEl.style.color = "orange";
      tbody.innerHTML = "";
      summaryEl.innerText = "Total: 0 | Berhasil: 0 | Gagal: 0";
    })
    .catch((err) => {
      statusEl.innerText = "❌ Gagal hapus data";
      statusEl.style.color = "red";
      console.error(err);
    });
}

// ================== LIHAT STATUS SHEET ==================
function lihatStatus() {
  tbody.innerHTML = "";
  let total = 0,
    berhasil = 0,
    gagal = 0;

  WEB_APPS.forEach((app) => {
    fetch(`${app.url}?action=getStatus`)
      .then((res) => res.json())
      .then((data) => {
        data.forEach((row) => {
          const tr = document.createElement("tr");
          row.forEach((cell) => {
            const td = document.createElement("td");
            td.innerText = cell;
            tr.appendChild(td);
          });
          tbody.appendChild(tr);

          const status = row[3]?.trim().toLowerCase();
          total++;
          if (status === "sent") berhasil++;
          else if (status === "failed") gagal++;
        });

        summaryEl.innerText = `Total: ${total} | Berhasil: ${berhasil} | Gagal: ${gagal}`;
      })
      .catch(() => {
        tbody.innerHTML +=
          "<tr><td colspan='4'>❌ Gagal mengambil status</td></tr>";
      });
  });
}

// ================== EVENT ==================
sendBtn.addEventListener("click", kirimMassal);
emailBtn.addEventListener("click", kirimEmail);
hapusBtn.addEventListener("click", hapusData);

// ================== LOAD STATUS SAAT HALAMAN DIBUKA ==================
lihatStatus();
