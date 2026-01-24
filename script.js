const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbySU99ZBKdwGQWCkoujX_BhMxZ4tbpu4Z3ocGLnv_DKBhfkuK7jjcFTVEYQsI5rO2hV/exec";
const TOKEN = "email123";

function kirimMassal() {
  const textarea = document.getElementById("dataInput");
  const statusEl = document.getElementById("status");
  const button = document.getElementById("sendBtn");

  const lines = textarea.value.trim().split("\n");
  const list = [];

  lines.forEach((line) => {
    const parts = line.split(",");
    if (parts.length === 2) {
      const nama = parts[0].trim();
      const email = parts[1].trim();
      if (email.includes("@")) {
        list.push({ nama, email });
      }
    }
  });

  if (list.length === 0) {
    statusEl.innerText = "❌ Data tidak valid";
    statusEl.style.color = "red";
    return;
  }

  button.disabled = true;
  button.innerText = "⏳ Mengirim...";
  statusEl.innerText = "";

  fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: TOKEN,
      list: list,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      statusEl.innerText = `✅ ${res.message}`;
      statusEl.style.color = "green";
      button.innerText = "🚀 Kirim Email";
      button.disabled = false;
    })
    .catch(() => {
      statusEl.innerText = "❌ Gagal menghubungi server";
      statusEl.style.color = "red";
      button.innerText = "🚀 Kirim Email";
      button.disabled = false;
    });
}
