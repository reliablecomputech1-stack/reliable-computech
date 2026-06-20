const SUPABASE_URL = "https://qrskdnptjtjsuvuutvdz.supabase.co";
const SUPABASE_KEY = "sb_publishable_3g4NKbhvEduQXGfCnUQnUw_zwPpUNtf";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById("customerForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const photoFile = document.getElementById("photo").files[0];

  let photoUrl = "";

  // Upload photo if selected
  if (photoFile) {
    const fileName = Date.now() + "_" + photoFile.name;

    const { error: uploadError } = await sb.storage
      .from("customer-photos")
      .upload(fileName, photoFile);

    if (uploadError) {
      message.innerHTML = "Photo upload failed!";
      console.log(uploadError);
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
    photo_url: photoUrl
  };

  const { data, error } = await sb
  .from("customers")
  .insert([customer])
  .select()
  .single();

  if (error) {
    message.innerHTML = "Error saving customer!";
    console.log(error);
  } else {
    const today = new Date().toLocaleDateString();

    message.innerHTML = `
      <div style="color:green;font-weight:bold;">
      Customer saved successfully.<br><br>
      Thank you for visiting RELIABLE COMPUTECH on ${today}. Your work will be completed soon. We will inform you once our job is completed.
      </div>
    `;

    form.reset();
    loadCustomers();
  }
});
document.getElementById("photo").addEventListener("change", function () {
  const file = this.files[0];

  if (file) {
    document.getElementById("fileName").textContent = file.name;
  } else {
    document.getElementById("fileName").textContent = "No file selected";
  }
});
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

  const searchText = document.getElementById("searchInput").value.toLowerCase();

data
.filter(customer =>
  (customer.name || "").toLowerCase().includes(searchText) ||
  (customer.phone || "").toLowerCase().includes(searchText)
)
.forEach(customer => {
    customerBody.innerHTML += `
      <tr>
        <td>
          <img src="${customer.photo_url}" class="customer-photo">
        </td>
        <td contenteditable="true">${customer.name || ""}</td>
        <td contenteditable="true">${customer.email || ""}</td>
        <td contenteditable="true">${customer.phone || ""}</td>
        <td contenteditable="true">${customer.address || ""}</td>
      </tr>
    `;
  });
}


document.getElementById("addBtn").addEventListener("click", () => {
  message.innerHTML = "";
  document.getElementById("addCustomerSection").style.display = "block";
  document.getElementById("customerSection").style.display = "none";
});

document.getElementById("viewBtn").addEventListener("click", () => {
  message.innerHTML = "";
  document.getElementById("addCustomerSection").style.display = "none";
  document.getElementById("customerSection").style.display = "block";
  loadCustomers();
});
document.getElementById("searchInput").addEventListener("input", () => {
  loadCustomers();
});
