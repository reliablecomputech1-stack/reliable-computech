const SUPABASE_URL = "https://qrskdnptjtjsuvuutvdz.supabase.co";
const SUPABASE_KEY = "sb_publishable_3g4NKbhvEduQXGfCnUQnUw_zwPpUNtf";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = height * (maxWidth / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };

    reader.readAsDataURL(file);
  });
}
document.addEventListener("DOMContentLoaded", () => 
{
    const form = document.getElementById("customerForm");
    const message = document.getElementById("message");
    document.getElementById("photo").addEventListener("change", function () {
    const fileNameSpan = document.getElementById("fileName");

    if (this.files.length > 0) {
        fileNameSpan.textContent = this.files[0].name;
    } else {
        fileNameSpan.textContent = "No file selected";
    }
});

    // =======================
    // ADD CUSTOMER
    // =======================
    form.addEventListener("submit", async (e) => 
    {
          e.preventDefault();

let photoFile = document.getElementById("photo").files[0];
          let photoUrl = "";
            let fileName = "";

          if (photoFile)
          {  
                  photoFile = await compressImage(photoFile);
                  fileName = Date.now() + "_" + photoFile.name;

                  const { error: uploadError } = await sb.storage
                  .from("customer-photos")
                  .upload(fileName, photoFile);

                  if (uploadError) {
        console.log("UPLOAD ERROR:", uploadError);
        message.innerHTML = "Photo upload failed!";
        return;
      }

      const { data } = sb.storage
        .from("customer-photos")
        .getPublicUrl(fileName);

      photoUrl = data.publicUrl;
            alert("✅ Photo uploaded successfully");
    }
      
const customer = {
  name: document.getElementById("name").value,
  contact: document.getElementById("contact").value,
  description: document.getElementById("description").value,
  status: document.getElementById("status").value,
  photo_url: photoUrl,
  photo_file: fileName
};

    const { error } = await sb.from("customers").insert([customer]);

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
  // LOAD CUSTOMERS
  // =======================
  async function loadCustomers() {

    const { data, error } = await sb
      .from("customers")
      .select("*");

    if (error) {
      console.log("LOAD ERROR:", error);
      return;
    }

    const customerBody = document.getElementById("customerBody");
    customerBody.innerHTML = "";

    const searchText = document.getElementById("searchInput").value.toLowerCase();

    const filtered = data.filter(c =>
      (c.name || "").toLowerCase().includes(searchText) ||
      (c.phone || "").toLowerCase().includes(searchText)
    );

    document.getElementById("customerCountHeading").innerText =
      `Customers (${filtered.length})`;

    filtered.forEach(customer => {
      customerBody.innerHTML += `
        <tr data-id="${customer.id}" data-file="${customer.photo_file || ""}">
          <td><img src="${customer.photo_url}" class="customer-photo"></td>
          <td class="name">${customer.name || ""}</td>
          <td class="contact">
  📞 ${customer.phone || ""}<br>
  📧 ${customer.email || ""}<br>
  📍 ${customer.address || ""}
</td>
<td class="description">${customer.description || ""}</td>
<td class="status">${customer.status || ""}</td>
      <td class="actionCell">

  <button class="editBtn">✏️</button>
  <button class="saveBtn" style="display:none;">💾</button>
  <button class="deleteBtn">🗑️</button>
  <button class="waBtn">💬</button>

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

  const addSection = document.getElementById("addCustomerSection");
  const viewSection = document.getElementById("customerSection");

  const isOpen = addSection.style.display === "block";

  if (isOpen) {
    addSection.style.display = "none";
  } else {
    addSection.style.display = "block";
    viewSection.style.display = "none";
    document.getElementById("searchInput").style.display = "none";
  }
});

 document.getElementById("viewBtn").addEventListener("click", () => {

  message.innerHTML = "";

  const addSection = document.getElementById("addCustomerSection");
  const viewSection = document.getElementById("customerSection");

  const isOpen = viewSection.style.display === "block";

  if (isOpen) {
    viewSection.style.display = "none";
    document.getElementById("searchInput").style.display = "none";
  } else {
    viewSection.style.display = "block";
    addSection.style.display = "none";
    document.getElementById("searchInput").style.display = "block";
    loadCustomers();
  }
});

  document.getElementById("searchInput").addEventListener("input", loadCustomers);
});


// =======================
// GLOBAL CLICK EVENTS
// =======================
document.addEventListener("click", async (e) => {

  // EDIT
  if (e.target.classList.contains("editBtn")) {
    const row = e.target.closest("tr");

row.querySelectorAll(".name, .description, .status")      .forEach(td => td.contentEditable = "true");

    row.querySelector(".editBtn").style.display = "none";
    row.querySelector(".saveBtn").style.display = "inline-block";
  }

  // SAVE
  if (e.target.classList.contains("saveBtn")) {
    const row = e.target.closest("tr");
    const id = row.dataset.id;

    const updated = {
      name: row.querySelector(".name").innerText,
  description: row.querySelector(".description").innerText,
  status: row.querySelector(".status").innerText
};

    const { error } = await sb.from("customers").update(updated).eq("id", id);

    if (error) {
      console.log("UPDATE ERROR:", error);
      alert(error.message);
      return;
    }

   row.querySelectorAll(".name, .description, .status")
  .forEach(td => td.contentEditable = "false");

    row.querySelector(".editBtn").style.display = "inline-block";
    row.querySelector(".saveBtn").style.display = "none";

    alert("Saved!");
  }

  // DELETE (FINAL FIX)
  if (e.target.classList.contains("deleteBtn")) {

    const row = e.target.closest("tr");
    const id = row?.dataset?.id;
    const fileName = row?.dataset?.file;

    if (!id) {
      alert("Invalid row id");
      return;
    }

    if (!confirm("Delete this customer?")) return;

    // 1. delete from DB FIRST (important)
    const { error: dbError } = await sb
      .from("customers")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.log("DELETE DB ERROR:", dbError);
      alert(dbError.message);
      return;
    }

    // 2. delete file AFTER DB success
    if (fileName) {
      const { error: storageError } = await sb
        .storage
        .from("customer-photos")
        .remove([fileName]);

      if (storageError) {
        console.log("STORAGE DELETE ERROR:", storageError);
      }
    }

   row.remove();
    alert("Deleted successfully!");
  }

  // WHATSAPP
  if (e.target.classList.contains("waBtn")) {

    const row = e.target.closest("tr");
const phone = row.querySelector(".contact").innerText.match(/\d+/)?.[0] || "";
    const name = row.querySelector(".name").innerText;

    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }

    const msg = `Hi ${name},

Thank you for visiting RELIABLE COMPUTECH.

Your job is scheduled and will be completed soon.

We will notify you once the work is complete.`;

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  }

});
