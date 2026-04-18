// ================== KONFIGURASI ==================
const WEB_APPS = [
  {
    url: "https://script.google.com/macros/s/AKfycbx2HKcgn6A5zI0H9_u6HwhC8Jcd6I8lTPGRhshSA6Px_PQ8pjevYBiRzNQN26gJ3mUGAw/exec",
    token: "email111",
  },
  {
    url: "https://script.google.com/macros/s/AKfycbxI4S4nlpkG8pLsQyhnczq9e_1HG9gBEbZ8F6itCzMEEYsVgGy6hRcHShwBZ8ft45t9sA/exec",
    token: "email222",
  },
  {
    url: "https://script.google.com/macros/s/AKfycbw665rhvnei7vopAoOPI9rqbS2S2zFql8IZnV8-5ghS7wrHK1LxLEo4wME9Hi95ZrIMQw/exec",
    token: "email333",
  },
  {
    url: "https://script.google.com/macros/s/AKfycbyxS1KJSGz6tXshIwjs_O_29puPwEGqhWxnTcqdUqzefuHS_sbaGJmTHHww9bwhr7q5/exec",
    token: "email444",
  },
  {
    url: "https://script.google.com/macros/s/AKfycbzF5lAm-dodpDFbIWD26SjhV3QwCEE7qt17mJ2lJ6QKH8ZWf1K5gO42wpCVKH0-elWS/exec",
    token: "email555",
  },
  {
    url: "https://script.google.com/macros/s/AKfycbzskpF82caglS2dIsLNPF_BsUB5Imr-9EcYzAxlsgkYGREorMWH8cRm9LXC82f0iW84/exec",
    token: "email666",
  },
  {
    url: "https://script.google.com/macros/s/AKfycbwn11nE9byULoHClSzFAoLtsyLwwQJiCoffHr_Tgt7gDaYZxbtltFMSnxPRrgDLgFyw/exec",
    token: "email777",
  },
  {
    url: "https://script.google.com/macros/s/AKfycbz7s_FHNmnIUhH81IYeOunhehGl_vlIU3oRKiiT0MoqnTNalurDRbRP-HoBEnzLZ1j9/exec",
    token: "email888",
  },
  {
    url: "https://script.google.com/macros/s/AKfycbyhQGjYAcsBMEEGMSUhhqkYP8P-5fWbb0R7GbRQhMdju1JTwX3kwDnYCnJIPdrjMDniSw/exec",
    token: "email999",
  },
  {
    url: "https://script.google.com/macros/s/AKfycbwctyD-JEmHaFA6_O-UJaB8Bk2KJZHt38gIg_HNxzMa234Wm0ISlTxRmax32kaJPAxh8w/exec",
    token: "email1010",
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

// TAMBAHAN
const templatePesan = document.getElementById("templatePesan");
const subjectEmail = document.getElementById("subjectEmail");

// ================== TEMPLATE ==================
function generatePesan(nama, email, catatan, index) {
  let template = templatePesan?.value?.trim();

  // fallback kalau kosong
  if (!template) {
    return `Halo ${nama},`;
  }

  return template
    .replace(/{nama}/gi, nama)
    .replace(/{email}/gi, email)
    .replace(/{catatan}/gi, catatan || "")
    .replace(/{nomor}/gi, index + 1);
}

// ================== KIRIM MASSAL ==================
function kirimMassal() {
  const lines = textarea.value.trim().split("\n");
  if (!lines.length) {
    statusEl.innerText = "❌ Data kosong";
    statusEl.style.color = "red";
    return;
  }

  const processedLines = lines.map((line, i) => {
    const [nama, email, pesan] = line.split(",").map((s) => s.trim());

    // FIX UTAMA (biar template kepakai)
    let finalPesan = generatePesan(nama, email, pesan || "", i);

    return `${nama},${email},${finalPesan}`;
  });

  sendBtn.disabled = true;
  sendBtn.innerText = "⏳ Mengirim...";

  const promises = WEB_APPS.map((app, idx) => {
    const start = idx * 100;
    const end = start + 100;
    const chunk = processedLines.slice(start, end);
    if (!chunk.length) return Promise.resolve();

    const formData = new URLSearchParams();
    formData.append("token", app.token);

    // FIX SUBJECT WAJIB KIRIM
    formData.append("subject", subjectEmail?.value || "");

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

    lihatStatus();
  });
}

// ================== EMAIL ==================
function kirimEmail() {
  let total = 0,
    berhasil = 0,
    gagal = 0;

  const promises = WEB_APPS.map((app) =>
    fetch(`${app.url}?action=getStatus`)
      .then((res) => res.json())
      .then((data) => {
        data.forEach((row) => {
          const status = row[3]?.trim().toLowerCase();
          total++;
          if (status === "sent") berhasil++;
          else if (status === "failed") gagal++;
        });

        return fetch(`${app.url}?action=sendEmail`).then((res) => res.json());
      }),
  );

  Promise.all(promises).then(() => {
    summaryEl.innerText = `Total: ${total} | Berhasil: ${berhasil} | Gagal: ${gagal}`;
    statusEl.innerText = "📤 Email otomatis dijalankan";
    statusEl.style.color = "blue";
    lihatStatus();
  });
}

// ================== HAPUS DATA ==================
function hapusData() {
  const promises = WEB_APPS.map((app) =>
    fetch(`${app.url}?action=hapusData`).then((res) => res.json()),
  );

  Promise.all(promises).then(() => {
    statusEl.innerText = "🗑 Semua data dihapus";
    statusEl.style.color = "orange";
    tbody.innerHTML = "";
    summaryEl.innerText = "Total: 0 | Berhasil: 0 | Gagal: 0";
  });
}

// ================== LIHAT STATUS ==================
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
      });
  });
}

// ================== EVENT ==================
sendBtn.addEventListener("click", kirimMassal);
emailBtn.addEventListener("click", kirimEmail);
hapusBtn.addEventListener("click", hapusData);

// ================== LOAD ==================
lihatStatus();
