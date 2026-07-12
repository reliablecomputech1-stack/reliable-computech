const APP_PASSWORD = "rctech321";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";

const USER_USERNAME = "rctech";
const USER_PASSWORD = "rctech321";


// LOGIN SYSTEM
if (!sessionStorage.getItem("loggedIn")) {

    let username = prompt("Enter Username:");
    let password = prompt("Enter Password:");

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {

        sessionStorage.setItem("loggedIn", "true");
        sessionStorage.setItem("role", "admin");

    } 
    else if (username === USER_USERNAME && password === USER_PASSWORD) {

        sessionStorage.setItem("loggedIn", "true");
        sessionStorage.setItem("role", "user");

    } 
    else {

        alert("Wrong Username or Password");
        location.reload();

    }
}
const SUPABASE_URL = "https://qrskdnptjtjsuvuutvdz.supabase.co";
const SUPABASE_KEY = "sb_publishable_3g4NKbhvEduQXGfCnUQnUw_zwPpUNtf";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
function customPopup(message, mode = "alert") {

    return new Promise((resolve) => {

        const popup = document.getElementById("customPopup");
        const popupMessage = document.getElementById("popupMessage");
        const popupPassword = document.getElementById("popupPassword");
        const okBtn = document.getElementById("popupOK");
        const cancelBtn = document.getElementById("popupCancel");

        popupMessage.innerText = message;

        popupPassword.value = "";

        if (mode === "password") {
            popupPassword.style.display = "block";
            cancelBtn.style.display = "block";
        }
        else if (mode === "confirm") {
            popupPassword.style.display = "none";
            cancelBtn.style.display = "block";
        }
        else {
            popupPassword.style.display = "none";
            cancelBtn.style.display = "none";
        }

        popup.style.display = "flex";

        okBtn.onclick = () => {
            popup.style.display = "none";

            if (mode === "password") {
                resolve(popupPassword.value);
            } else {
                resolve(true);
            }
        };

        cancelBtn.onclick = () => {
            popup.style.display = "none";

            if (mode === "password") {
                resolve(null);
            } else {
                resolve(false);
            }
        };

    });

}


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

      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: "image/jpeg" }));
      }, "image/jpeg", quality);
    };

    reader.readAsDataURL(file);
  });
}

document.addEventListener("DOMContentLoaded", () => {  document.getElementById("addBtn").style.display = "inline-block";

  if (sessionStorage.getItem("role") === "admin") {
      document.getElementById("viewBtn").style.display = "inline-block";
  }
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
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let photoFile = document.getElementById("photo").files[0];
    let photoUrl = "";
    let fileName = "";

    if (photoFile) {
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
await customPopup("Photo uploaded successfully!");    }

    const customer = {
  name: document.getElementById("name").value,
  contact:
`Phone: ${document.getElementById("phone").value}
Email: ${document.getElementById("email").value}
Address: ${document.getElementById("address").value}`,
  description: document.getElementById("description").value,
  status: document.getElementById("status").value,
  estimate: document.getElementById("estimate").value,
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
  (c.contact || "").toLowerCase().includes(searchText)
);

document.getElementById("customerCountHeading").innerText =
  `Customers (${filtered.length})`;
   

    document.getElementById("customerCountHeading").innerText =
      `Customers (${filtered.length})`;

    filtered.forEach(customer => {
      customerBody.innerHTML += `
        <tr data-id="${customer.id}" data-file="${customer.photo_file || ""}">
          <td><img src="${customer.photo_url}" class="customer-photo"></td>
          <td class="name">${customer.name || ""}</td>
          <td class="contact">
  <div><strong>Phone:</strong> <span class="phone">${(customer.contact || "").match(/Phone:\s*(.*)/)?.[1]?.split("\n")[0] || ""}</span></div>
  <div><strong>Email:</strong> <span class="email">${(customer.contact || "").match(/Email:\s*(.*)/)?.[1]?.split("\n")[0] || ""}</span></div>
  <div><strong>Address:</strong> <span class="address">${(customer.contact || "").match(/Address:\s*(.*)/)?.[1] || ""}</span></div>
</td>
          <td class="description">${customer.description || ""}</td>
          <td class="status">${customer.status || ""}</td>
          <td class="estimate">${customer.estimate || ""}</td>


<td class="actionCell">

  <div class="editSaveBox">
    <button class="editBtn">
      <img src="edit.png" class="waIcon">
    </button>

    <button class="saveBtn" style="display:none;">
      <img src="save.png" class="waIcon">
    </button>
  </div>

  <button class="deleteBtn">
    <img src="delete.png" class="waIcon">
  </button>

  <button class="waBtn">
    <img src="whatsapp.png" class="waIcon">
  </button>

 <button class="smsBtn">
  <img src="sms.png" class="waIcon">
</button>

<button class="callBtn">
  <img src="call.png" class="waIcon">
</button>

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
row.querySelector(".name").contentEditable = "true";
row.querySelector(".phone").contentEditable = "true";
row.querySelector(".email").contentEditable = "true";
row.querySelector(".address").contentEditable = "true";
row.querySelector(".description").contentEditable = "true";
row.querySelector(".status").contentEditable = "true";
row.querySelector(".estimate").contentEditable = "true";

 row.querySelector(".editBtn").style.visibility = "hidden";
row.querySelector(".saveBtn").style.display = "flex";
  }

  // SAVE
  if (e.target.classList.contains("saveBtn")) {
    const row = e.target.closest("tr");
    const id = row.dataset.id;
const updated = {
  name: row.querySelector(".name").innerText,
 contact:
`Phone: ${row.querySelector(".phone").innerText.replace(/^Phone:\s*/i, "")}
Email: ${row.querySelector(".email").innerText.replace(/^Email:\s*/i, "")}
Address: ${row.querySelector(".address").innerText.replace(/^Address:\s*/i, "")}`,
  description: row.querySelector(".description").innerText,
  status: row.querySelector(".status").innerText,
  estimate: row.querySelector(".estimate").innerText
};

    const { error } = await sb.from("customers").update(updated).eq("id", id);

    if (error) {
      console.log("UPDATE ERROR:", error);
await customPopup(error.message);      return;
    }

 row.querySelector(".name").contentEditable = "false";
row.querySelector(".phone").contentEditable = "false";
row.querySelector(".email").contentEditable = "false";
row.querySelector(".address").contentEditable = "false";
row.querySelector(".description").contentEditable = "false";
row.querySelector(".status").contentEditable = "false";
row.querySelector(".estimate").contentEditable = "false";

  row.querySelector(".editBtn").style.visibility = "visible";
row.querySelector(".saveBtn").style.display = "none";

await customPopup("Saved successfully!");  }

  // DELETE
  const deleteBtn = e.target.closest(".deleteBtn");

if (deleteBtn)
{
    console.log("Delete button clicked");

    const row = deleteBtn.closest("tr");
    const id = row.dataset.id;
    const fileName = row.dataset.file;

    if (!id) {
await customPopup("Invalid row id");      return;
    }

if (!(await customPopup("Delete this customer?", "confirm"))) return;
   const password = await customPopup("Enter Password", "password");
console.log("Password entered:", password);
if (password === null) return;

if (password !== APP_PASSWORD) {
    
    await customPopup("Wrong Password!");
    return;
}
console.log("Password accepted");
    console.log("Deleting ID:", id);
    const { error: dbError } = await sb
      .from("customers")
      .delete()
      .eq("id", id);
console.log("Delete error:", dbError);
    if (dbError) {
      console.log("DELETE DB ERROR:", dbError);
      alert(dbError.message);
      return;
    }

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
    console.log("Row removed");
await customPopup("Deleted successfully!");  }

  // WHATSAPP
  if (e.target.classList.contains("waBtn")) {
    const row = e.target.closest("tr");

const phone = row.querySelector(".phone").innerText.trim();    const name = row.querySelector(".name").innerText;
  const description = row.querySelector(".description").innerText;
const estimate = row.querySelector(".estimate").innerText;

    let cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }

    const msg = `Hi ${name},

Thank you for visiting RELIABLE COMPUTECH.

Your requested work of "${description}" will be completed soon.

The estimated cost for this job is ₹${estimate}.

We will notify you once the work is complete.

Thank you for choosing RELIABLE COMPUTECH.`;

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  }
// SMS
if (e.target.classList.contains("smsBtn")) {
  const row = e.target.closest("tr");

const phone = row.querySelector(".phone").innerText.trim();  const name = row.querySelector(".name").innerText;
  const description = row.querySelector(".description").innerText;
  const estimate = row.querySelector(".estimate").innerText;

  let cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length === 10) {
    cleanPhone = "91" + cleanPhone;
  }

  const msg = `Hi ${name},

Thank you for visiting RELIABLE COMPUTECH.

Your requested work of "${description}" will be completed soon.

The estimated cost for this job is ₹${estimate}.

We will notify you once the work is complete.

Thank you for choosing RELIABLE COMPUTECH.`;

 window.location.href =
  `sms:${cleanPhone}?body=${encodeURIComponent(msg)}`;
}

// CALL
// CALL
const callBtn = e.target.closest(".callBtn");

if (callBtn) {
  const row = callBtn.closest("tr");

const phone = row.querySelector(".phone").innerText.trim();
  let cleanPhone = phone.replace(/\D/g, "");

  if (!cleanPhone) {
    await customPopup("No phone number available!");
    return;
  }

  if (cleanPhone.length === 10) {
    cleanPhone = "91" + cleanPhone;
  }

  window.location.href = `tel:+${cleanPhone}`;
}

});
