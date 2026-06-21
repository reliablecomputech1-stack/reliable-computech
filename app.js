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

    // Upload photo
    if (photoFile) {
      const fileName = Date.now() + "_" + photoFile.name;

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

    // ❌ REMOVED user_id (since you don't have login working)
    const customer = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      photo_url: photoUrl
    };

    const { data, error } = await sb
      .from("customers")
      .insert([customer])
      .select()
      .single();

    if (error) {
      console.log(error);
      message.innerHTML = "Error saving customer!";
    } else {
      const today = new Date().toLocaleDateString();

      message.innerHTML = `
        <div style="color:green;font-weight:bold;">
          Customer saved successfully.<br><br>
          Thank you for visiting RELIABLE COMPUTECH on ${today}.
        </div>
      `;

      form.reset();
      loadCustomers();
    }
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

    data
      .filter(customer =>
        (customer.name || "").toLowerCase().includes(searchText) ||
        (customer.phone || "").toLowerCase().includes(searchText)
      )
      .forEach(customer => {
  customerBody.innerHTML += `
    <tr data-id="${customer.id}">

      <td>
        <img src="${customer.photo_url}" class="customer-photo">
      </td>

      <td class="name">${customer.name || ""}</td>
      <td class="email">${customer.email || ""}</td>
      <td class="phone">${customer.phone || ""}</td>
      <td class="address">${customer.address || ""}</td>

     <td>
  <button class="editBtn" title="Edit">✏️</button>
  <button class="saveBtn" title="Save" style="display:none;">💾</button>
  <button class="deleteBtn" title="Delete">🗑️</button>
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
      alert("Update failed!");
      return;
    }

    row.querySelectorAll(".name, .email, .phone, .address")
      .forEach(td => td.contentEditable = "false");

    row.querySelector(".editBtn").style.display = "inline-block";
    row.querySelector(".saveBtn").style.display = "none";

    alert("Saved successfully!");
  }
if (e.target.classList.contains("deleteBtn")) {

  if (!confirm("Delete this customer?")) return;

  const row = e.target.closest("tr");
  const id = row.dataset.id;

  const { error } = await sb
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) {
    console.log(error);
    alert("Delete failed!");
    return;
  }

  row.remove();

  alert("Customer deleted successfully!");
}
});
