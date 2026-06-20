const SUPABASE_URL = "https://qrskdnptjtjsuvuutvdz.supabase.co";
const SUPABASE_KEY = "YOUR_PUBLISHABLE_KEY";

const form = document.getElementById("customerForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const customer = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value
    };

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/customers`,
        {
            method: "POST",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            body: JSON.stringify(customer)
        }
    );

    if (response.ok) {
        const today = new Date().toLocaleDateString();

        message.innerHTML =
            `Customer saved successfully.<br><br>
            Thank you for visiting RELIABLE COMPUTECH on ${today}. Your work will be completed soon. We will inform you once our job is completed.`;
    } else {
        message.innerHTML = "Error saving customer.";
    }
});
