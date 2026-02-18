let rowCount = 0;

// --- MODAL FUNCTIONS ---
function openModal() {
    document.getElementById('customerModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('customerModal').style.display = 'none';
    ['new-phone', 'new-name','new-taluk','new-dist','new-state','new-pin'].forEach(id => document.getElementById(id).value = '');
}

async function saveNewCustomer() {
    const btn = document.querySelector('.btn-save');
    const originalText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    const phone = document.getElementById('new-phone').value.toString().trim();
    
    if(phone.length !== 10) {
        alert("Please enter a valid 10-digit phone number.");
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    const payload = {
        phone: phone,
        name: document.getElementById('new-name').value,
        taluk: document.getElementById('new-taluk').value,
        district: document.getElementById('new-dist').value,
        state: document.getElementById('new-state').value,
        pincode: document.getElementById('new-pin').value
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if(result.result === 'success') {
            const savedPhone = result.phone;
            customerDataMap[savedPhone] = payload;
            document.getElementById('customer-phone').value = savedPhone;
            closeModal();
            alert(`Success! Customer ${savedPhone} registered and selected.`);
        } else if (result.result === 'error') {
            alert(result.message);
            closeModal();
            document.getElementById('customer-phone').value = phone;
        }

    } catch (error) {
        console.error(error);
        alert("Failed to connect. Check internet or script URL.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// --- ROW MANAGEMENT ---
function addNewRow() {
    rowCount++;
    const container = document.getElementById('rows-container');

    if (rowCount > 1) {
        const prevRowId = rowCount - 1;
        const prevDescInfo = document.getElementById(`desc-info-${prevRowId}`);
        const prevCalcInfo = document.getElementById(`calc-info-${prevRowId}`);
        if (prevDescInfo) prevDescInfo.style.display = 'none';
        if (prevCalcInfo) prevCalcInfo.style.display = 'none';
    }

    const rowHtml = `
        <div class="tyre-row" id="row-${rowCount}">
            <div class="input-group">
                <div class="autocomplete-wrapper">
                    <label>Tyre Description / Variant</label>
                    <input type="text" id="search-${rowCount}" placeholder="Start typing tyre name..." autocomplete="off">
                    <ul class="suggestions-list" id="suggestions-${rowCount}"></ul>
                    <div class="helper-text" id="desc-info-${rowCount}"></div>
                    <input type="hidden" id="base-price-${rowCount}" value="0">
                    <input type="hidden" id="product-code-${rowCount}" value="">
                </div>
                <div>
                    <label>Markup (+/-)</label>
                    <input type="number" id="markup-${rowCount}" placeholder="0" value="0">
                    <div class="helper-text" id="calc-info-${rowCount}"></div>
                </div>
                <div>
                    <label>Quantity</label>
                    <input type="number" id="qty-${rowCount}" value="1" min="1">
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    setupRowEvents(rowCount);
}

function setupRowEvents(id) {
    const searchInput = document.getElementById(`search-${id}`);
    const suggestionsBox = document.getElementById(`suggestions-${id}`);
    const markupInput = document.getElementById(`markup-${id}`);
    const descInfo = document.getElementById(`desc-info-${id}`);
    const basePriceInput = document.getElementById(`base-price-${id}`);
    const productCodeInput = document.getElementById(`product-code-${id}`);

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        suggestionsBox.innerHTML = '';
        
        if (query.length < 2) {
            suggestionsBox.style.display = 'none';
            return;
        }

        const matches = tyreDatabase.filter(item => 
            (item.product_description && item.product_description.toLowerCase().includes(query)) ||
            (item.product_code && item.product_code.toString().includes(query))
        ).slice(0, 10);

        if (matches.length > 0) {
            suggestionsBox.style.display = 'block';
            matches.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.product_description} (Code: ${item.product_code})`;
                li.onclick = () => {
                    searchInput.value = item.product_description;
                    basePriceInput.value = item.cmp_set || 0;
                    productCodeInput.value = item.product_code;
                    suggestionsBox.style.display = 'none';
                    descInfo.style.display = 'block';
                    descInfo.innerText = `${item.category} | Code: ${item.product_code} | NBP: ${item.nbp_gst_18 || 'N/A'} | Base CMP: ${item.cmp_set}`;
                    updatePrice(id);
                };
                suggestionsBox.appendChild(li);
            });
        } else {
            suggestionsBox.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target !== searchInput) suggestionsBox.style.display = 'none';
    });

    markupInput.addEventListener('input', () => updatePrice(id));
}

function updatePrice(id) {
    const basePrice = parseFloat(document.getElementById(`base-price-${id}`).value) || 0;
    const markup = parseFloat(document.getElementById(`markup-${id}`).value) || 0;
    const calcInfo = document.getElementById(`calc-info-${id}`);

    if (basePrice > 0) {
        const finalPrice = basePrice + markup;
        calcInfo.style.display = 'block';
        calcInfo.innerText = `Final: ${finalPrice.toFixed(2)}`;
    }
}