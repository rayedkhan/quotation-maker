// Global Data Variables
let tyreDatabase = [];
let customerDataMap = {}; 

async function loadDatabase() {
    try {
        const response = await fetch('database.json');
        if (!response.ok) throw new Error("Could not load database.json");
        tyreDatabase = await response.json();
        console.log("Database loaded:", tyreDatabase.length, "items.");
        // We call addNewRow here to ensure DB is ready before first row exists
        if(typeof addNewRow === "function") addNewRow();
    } catch (error) {
        alert("Error loading database.json.");
        console.error(error);
    }
}

async function loadCustomerDatabase() {
    if (CUSTOMER_SHEET_URL.includes("YOUR_GOOGLE_SHEET")) return;

    try {
        const urlWithCacheBust = CUSTOMER_SHEET_URL + "&t=" + new Date().getTime();
        const response = await fetch(urlWithCacheBust);
        const data = await response.text();
        const rows = data.split('\n').slice(1);
        
        rows.forEach(row => {
                const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                if (cols.length >= 8) { // Updated to check for 8 columns
                    const phone = cols[0];
                    if(phone && phone.length > 5) {
                        customerDataMap[phone] = {
                            name: cols[1],
                            gender: cols[2],
                            orgName: cols[3], // Optional Organization
                            taluk: cols[4],
                            district: cols[5],
                            state: cols[6],
                            pincode: cols[7]
                        };
                    }
                }
            });
        console.log("Customers loaded:", Object.keys(customerDataMap).length);
    } catch (error) {
        console.error("Error loading customer sheet:", error);
    }
}
