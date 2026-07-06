const SUPABASE_URL = "https://qrskdnptjtjsuvuutvdz.supabase.co";
const SUPABASE_KEY = "sb_publishable_3g4NKbhvEduQXGfCnUQnUw_zwPpUNtf";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const APP_PASSWORD = "rctech321";

/* =======================
   PASSWORD CHECK
======================= */
function verifyPassword() {
  const password = prompt("Enter Password:");
  return password === APP_PASSWORD;
}

/* =======================
   IMAGE COMPRESSION
======================= */
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => (img.src = e.target.result);

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: "image/jpeg" }));
      }, "image/jpeg", quality);
    };

    reader.readAsDataURL(file);
  });
}

/* =======================
   LOAD CUSTOMERS
======================= */
async function loadCustomers() {
  const { data, error } = await sb.from("customers").select("*");

  if (error) {
    console.log(error);
    return;
  }

  const tbody = document.getElementById("customerBody");
  tbody.innerHTML = "";

  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";

  const filtered = data.filter((c) =>
    (c.name || "").toLowerCase().includes(search) ||
    (c.phone || "").toLowerCase().includes(search) ||
    (c.email || "").toLowerCase().includes(search) ||
    (c.address || "").toLowerCase().includes(search)
  );

  document.getElementById("customerCountHeading").innerText =
    `Customers (${filtered.length})`;

  filtered.forEach((c) => {
    tbody.innerHTML += `
      <tr data-id="${c.id}" data-file="${c.photo_file || ""}">
        <td><img src="${c.photo_url || ""}" width="50"></td>
        <td class="name">${c.name || ""}</td>
        <td class="phone">${c.phone || ""}</td>
        <td class="email">${c.email || ""}</td>
        <td class="description">${c.description || ""}</td>
        <td class="status">${c.status || ""}</td>
        <td class="estimate">${c.estimate || ""}</td>
        <td>
          <button class="editBtn">✏️</button>
          <button class="saveBtn" style="display:none;">💾</button>
          <button class="deleteBtn">🗑️</button>
          <button class="waBtn">💬</button>
        </td>
      </tr>
    `;
  });
}

/* =======================
   INIT
======================= */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("customerForm");
  const message = document.getElementById("message");

  loadCustomers();

  /* SEARCH */
  document.getElementById("searchInput")?.addEventListener("input", loadCustomers);

  /* ADD CUSTOMER */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let file = document.getElementById("photo").files[0];
    let photoUrl = "";
    let fileName = "";

    if (file) {
      file = await compressImage(file);
      fileName = Date.now() + "_" + file.name;

      await sb.storage.from("customer-photos").upload(fileName, file);

      const { data } = sb.storage.from("customer-photos").getPublicUrl(fileName);
      photoUrl = data.publicUrl;
    }

    const customer = {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
      address: document.getElementById("address").value,
      description: document.getElementById("description").value,
      status: document.getElementById("status").value,
      estimate: document.getElementById("estimate").value,
      photo_url: photoUrl,
      photo_file: fileName,
    };

    const { error } = await sb.from("customers").insert([customer]);

    if (error) {
      message.innerText = error.message;
      return;
    }

    form.reset();
    loadCustomers();
  });

  /* ADD / VIEW TOGGLE */
  document.getElementById("addBtn").onclick = () => {
    document.getElementById("addCustomerSection").style.display = "block";
    document.getElementById("customerSection").style.display = "none";
  };

  document.getElementById("viewBtn").onclick = () => {
    document.getElementById("addCustomerSection").style.display = "none";
    document.getElementById("customerSection").style.display = "block";
    loadCustomers();
  };
});

/* =======================
   GLOBAL BUTTON ACTIONS
======================= */
document.addEventListener("click", async (e) => {
  const row = e.target.closest("tr");

  /* EDIT */
  if (e.target.classList.contains("editBtn")) {
    row.querySelectorAll("td").forEach(td => td.contentEditable = true);
    e.target.style.display = "none";
    row.querySelector(".saveBtn").style.display = "inline-block";
  }

  /* SAVE */
  if (e.target.classList.contains("saveBtn")) {
    const id = row.dataset.id;

    const updated = {
      name: row.querySelector(".name").innerText,
      phone: row.querySelector(".phone").innerText,
      email: row.querySelector(".email").innerText,
      description: row.querySelector(".description").innerText,
      status: row.querySelector(".status").innerText,
      estimate: row.querySelector(".estimate").innerText,
    };

    await sb.from("customers").update(updated).eq("id", id);

    row.querySelectorAll("td").forEach(td => td.contentEditable = false);
    e.target.style.display = "none";
    row.querySelector(".editBtn").style.display = "inline-block";

    loadCustomers();
  }

  /* DELETE */
  if (e.target.classList.contains("deleteBtn")) {
    const id = row.dataset.id;
    const file = row.dataset.file;

    if (!confirm("Delete?")) return;
    if (!verifyPassword()) return alert("Wrong password");

    await sb.from("customers").delete().eq("id", id);

    if (file) {
      await sb.storage.from("customer-photos").remove([file]);
    }

    row.remove();
  }

  /* WHATSAPP */
  if (e.target.classList.contains("waBtn")) {
    const phone = row.querySelector(".phone").innerText.replace(/\D/g, "");
    const name = row.querySelector(".name").innerText;
    const desc = row.querySelector(".description").innerText;
    const est = row.querySelector(".estimate").innerText;

    const msg = `Hi ${name}, work: ${desc}, estimate ₹${est}`;

    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`);
  }
});
