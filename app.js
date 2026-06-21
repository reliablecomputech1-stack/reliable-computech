const SUPABASE_URL = "https://qrskdnptjtjsuvuutvdz.supabase.co";
const SUPABASE_KEY = "sb_publishable_3g4NKbhvEduQXGfCnUQnUw_zwPpUNtf";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("customerForm");
  const message = document.getElementById("message");

  // =======================
  // ADD CUSTOMER
  // =======================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const photoFile = document.getElementById("photo").files[0];

    let photoUrl = "";
    let fileName = "";

    // Upload photo
    if (photoFile) {
      fileName = Date.now() + "_" + photoFile.name;

      const { error: uploadError } = await sb.storage
        .from("customer-photos")
        .upload(fileName, photoFile);

      if (uploadError) {
        console.log(uploadError);
        message.innerHTML = "Photo upload failed!";
        return;
      }

      const { data } = sb.storage
        .from("customer-photos")
        .getPublicUrl(fileName);

      photoUrl = data.publicUrl;
    }

    const customer = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      photo_url: photoUrl,
      photo_file: fileName
    };

    const { error } = await sb
      .from("customers")
      .insert([customer]);

    if (error) {
      console.log("INSERT ERROR:", error);
      message.innerHTML = error.message;
      return;
    }

    message.innerHTML = "Customer saved successfully!";
    form.reset();
    loadCustomers();
  });

  // =======================
  // FILE NAME DISPLAY
  // =======================
  document.getElementById("photo").addEventListener("change", function () {
    const file = this.files[0];
    document.getElementById("fileName").textContent =
      file ? file.name : "No file selected";
  });

  // =======================
  // LOAD CUSTOMERS
  // =======================
  async function loadCustomers() {

    const { data, error } = await sb
      .from("customers")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    const customerBody = document.getElementById("customerBody");
    customerBody.innerHTML = "";

    const searchText = document
      .getElementById("searchInput")
      .value
      .toLowerCase();

    const filteredCustomers = data.filter(customer =>
      (customer.name || "").toLowerCase().includes(searchText) ||
      (customer.phone || "").toLowerCase().includes(searchText)
    );

    document.getElementById("customerCountHeading").innerText =
      `Customers (${filteredCustomers.length})`;

    filteredCustomers.forEach(customer => {
      customerBody.innerHTML += `
        <tr data-id="${customer.id}" data-file="${customer.photo_file || ""}">

          <td>
            <img src="${customer.photo_url}" class="customer-photo">
          </td>

          <td class="name">${customer.name || ""}</td>
          <td class="email">${customer.email || ""}</td>
          <td class="phone">${customer.phone || ""}</td>
          <td class="address">${customer.address || ""}</td>

          <td>
            <button class="editBtn">✏️</button>
            <button class="saveBtn" style="display:none;">💾</button>
            <button class="deleteBtn">🗑️</button>
          </td>

        </tr>
      `;
    });
  }

  // =======================
  // BUTTONS
  // =======================
  document.getElementById("addBtn").addEventListener("click", () => {
    message.innerHTML = "";
    document.getElementById("addCustomerSection").style.display = "block";
    document.getElementById("customerSection").style.display = "none";
    document.getElementById("searchInput").style.display = "none";
  });

  document.getElementById("viewBtn").addEventListener("click", () => {
    message.innerHTML = "";
    document.getElementById("addCustomerSection").style.display = "none";
    document.getElementById("customerSection").style.display = "block";
    document.getElementById("searchInput").style.display = "block";
    loadCustomers();
  });

  document.getElementById("searchInput").addEventListener("input", () => {
    loadCustomers();
  });

});


// =======================
// GLOBAL CLICK EVENTS
// =======================
document.addEventListener("click", async (e) => {

  // ✏️ EDIT
  if (e.target.classList.contains("editBtn")) {
    const row = e.target.closest("tr");

    row.querySelectorAll(".name, .email, .phone, .address")
      .forEach(td => td.contentEditable = "true");

    row.querySelector(".editBtn").style.display = "none";
    row.querySelector(".saveBtn").style.display = "inline-block";
  }

  // 💾 SAVE
  if (e.target.classList.contains("saveBtn")) {
    const row = e.target.closest("tr");
    const id = row.dataset.id;

    const updated = {
      name: row.querySelector(".name").innerText,
      email: row.querySelector(".email").innerText,
      phone: row.querySelector(".phone").innerText,
      address: row.querySelector(".address").innerText
    };

    const { error } = await sb
      .from("customers")
      .update(updated)
      .eq("id", id);

    if (error) {
      console.log(error);
      alert(error.message);
      return;
    }

    row.querySelectorAll(".name, .email, .phone, .address")
      .forEach(td => td.contentEditable = "false");

    row.querySelector(".editBtn").style.display = "inline-block";
    row.querySelector(".saveBtn").style.display = "none";

    alert("Saved successfully!");
  }

  // 🗑️ DELETE
  if (e.target.classList.contains("deleteBtn")) {

  if (!confirm("Delete this customer?")) return;

  const row = e.target.closest("tr");
  const id = row.dataset.id;

  // ✅ FIXED FILE NAME EXTRACTION
  let fileName = row.dataset.file;

  // fallback (if old rows don't have dataset.file)
  if (!fileName) {
    const img = row.querySelector("img");
    const url = new URL(img.src);
    fileName = url.pathname.split("/").pop();
  }

  // 1. delete DB FIRST (important)
  const { error: dbError } = await sb
    .from("customers")
    .delete()
    .eq("id", id);

  if (dbError) {
    console.log(dbError);
    alert("DB delete failed!");
    return;
  }

  // 2. delete image (non-blocking safe)
  if (fileName) {
    await sb.storage
      .from("customer-photos")
      .remove([fileName]);
  }

  // 3. remove from UI
  row.remove();

  alert("Customer deleted successfully!");
}
});
