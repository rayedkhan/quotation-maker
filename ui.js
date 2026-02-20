let rowCount = 0;

// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    
    container.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- MODAL FUNCTIONS ---
function openModal() {
    document.getElementById('customerModal').style.display = 'block';
    setupLocationAutocomplete(); // Initialize listeners
}

function closeModal() {
    document.getElementById('customerModal').style.display = 'none';
    
    // Clear text fields (Removed 'new-gender' from this list)
    ['new-name', 'new-phone', 'new-org', 'new-state', 'new-dist', 'new-taluk', 'new-pin'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });

    // Reset Gender specifically to 'M'
    document.getElementById('new-gender').value = 'M';

    // Clear suggestions
    document.querySelectorAll('.modal .suggestions-list').forEach(ul => ul.innerHTML = '');
}

// --- CUSTOM AUTOCOMPLETE LOGIC ---
function setupLocationAutocomplete() {
    const stateInput = document.getElementById('new-state');
    const distInput = document.getElementById('new-dist');
    const talukInput = document.getElementById('new-taluk');

    // 1. State Listener
    stateInput.oninput = function() {
        const query = this.value.toLowerCase();
        const list = document.getElementById('state-suggestions');
        list.innerHTML = '';
        
        if (!query) return;

        Object.keys(locationData).forEach(state => {
            if (state.toLowerCase().includes(query)) {
                addSuggestionItem(list, state, () => {
                    stateInput.value = state;
                    list.innerHTML = ''; // Hide list
                    distInput.value = ''; // Reset child fields
                    talukInput.value = '';
                });
            }
        });
        list.style.display = list.innerHTML ? 'block' : 'none';
    };

    // 2. District Listener
    distInput.oninput = function() {
        const query = this.value.toLowerCase();
        const stateName = stateInput.value;
        const list = document.getElementById('dist-suggestions');
        list.innerHTML = '';

        if (!query || !stateName || !locationData[stateName]) return;

        Object.keys(locationData[stateName]).forEach(dist => {
            if (dist.toLowerCase().includes(query)) {
                addSuggestionItem(list, dist, () => {
                    distInput.value = dist;
                    list.innerHTML = '';
                    talukInput.value = '';
                });
            }
        });
        list.style.display = list.innerHTML ? 'block' : 'none';
    };

    // 3. Taluk Listener
    talukInput.oninput = function() {
        const query = this.value.toLowerCase();
        const stateName = stateInput.value;
        const distName = distInput.value;
        const list = document.getElementById('taluk-suggestions');
        list.innerHTML = '';

        if (!query || !stateName || !distName || !locationData[stateName][distName]) return;

        locationData[stateName][distName].forEach(taluk => {
            if (taluk.toLowerCase().includes(query)) {
                addSuggestionItem(list, taluk, () => {
                    talukInput.value = taluk;
                    list.innerHTML = '';
                });
            }
        });
        list.style.display = list.innerHTML ? 'block' : 'none';
    };

    // Close lists when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.autocomplete-wrapper')) {
            document.querySelectorAll('.modal .suggestions-list').forEach(ul => ul.style.display = 'none');
        }
    });
}

function addSuggestionItem(listElement, text, onClick) {
    const li = document.createElement('li');
    li.textContent = text;
    li.onclick = onClick;
    listElement.appendChild(li);
}

// --- SAVE CUSTOMER ---
async function saveNewCustomer() {
    const btn = document.querySelector('.btn-save');
    const originalText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    const phone = document.getElementById('new-phone').value.toString().trim();
    
    if(phone.length !== 10) {
        showToast("Please enter a valid 10-digit phone number.");
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    // Capture individual name and org name, and convert to UPPERCASE
    const individualName = document.getElementById('new-name').value.trim().toUpperCase();
    let orgName = document.getElementById('new-org').value.trim().toUpperCase();
    
    // IF org name is left blank, automatically fill it with the individual name
    if (orgName === "") {
        orgName = individualName;
    }

    const payload = {
        phone: phone,
        name: individualName,
        gender: document.getElementById('new-gender').value.toUpperCase(),
        org: orgName, 
        state: document.getElementById('new-state').value.trim().toUpperCase(),
        district: document.getElementById('new-dist').value.trim().toUpperCase(),
        taluk: document.getElementById('new-taluk').value.trim().toUpperCase(),
        pincode: document.getElementById('new-pin').value.trim() // Numbers don't need uppercase
    };
    
    if(!payload.name || !payload.state || !payload.district || !payload.taluk || !payload.pincode) {
        showToast("Please fill in all required fields.");
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
       if(result.result === 'success') {
            const savedPhone = result.phone;
            customerDataMap[savedPhone] = {
                name: payload.name,
                gender: payload.gender,
                orgName: payload.org,
                taluk: payload.taluk,
                district: payload.district,
                state: payload.state,
                pincode: payload.pincode
            };

            // Update both the visible search bar and the hidden phone input
            const displayText = (payload.org && payload.org !== payload.name) ? `${payload.org} (${payload.name})` : payload.name;
            document.getElementById('customer-search').value = displayText;
            document.getElementById('customer-phone').value = savedPhone;
            
            closeModal();
            showToast(`Success! Customer ${savedPhone} registered.`, 'success');
        } else if (result.result === 'error') {
            showToast(result.message);
            closeModal();
            document.getElementById('customer-phone').value = phone;
        }

    } catch (error) {
        console.error(error);
        showToast("Failed to connect. Check internet.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// --- ROW MANAGEMENT (Kept same, just minimal structure) ---
function addNewRow() {
    rowCount++;
    const container = document.getElementById('rows-container');

    // ... (This part of logic remains identical to previous, just re-pasting for context if needed, 
    // but focusing on the toast/dropdown changes requested) ...
    // Note: Assuming the rest of addNewRow and setupRowEvents is unchanged.
    
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
                <div>
                    <label>&nbsp;</label>
                    <button class="btn-delete" title="Delete Tyre" onclick="deleteRow(${rowCount})">X</button>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', rowHtml);
    setupRowEvents(rowCount);
}

function deleteRow(id) {
    const row = document.getElementById(`row-${id}`);
    if (row) {
        row.remove();
    }
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

// --- CUSTOMER SEARCH AUTOCOMPLETE ---
function setupCustomerSearch() {
    const searchInput = document.getElementById('customer-search');
    const suggestionsBox = document.getElementById('customer-suggestions');
    const hiddenPhoneInput = document.getElementById('customer-phone');

    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        suggestionsBox.innerHTML = '';
        
        // Clear the hidden phone if they start typing a new search
        hiddenPhoneInput.value = ''; 
        
        if (query.length < 2) {
            suggestionsBox.style.display = 'none';
            return;
        }

        // Convert the customer object into an array we can filter
        const customers = Object.entries(customerDataMap).map(([phone, data]) => ({ phone, ...data }));
        
        // Filter by Organization Name OR Individual Name
        const matches = customers.filter(c => 
            (c.orgName && c.orgName.toLowerCase().includes(query)) || 
            (c.name && c.name.toLowerCase().includes(query))
        ).slice(0, 10); // Show top 10 matches

        if (matches.length > 0) {
            suggestionsBox.style.display = 'block';
            matches.forEach(c => {
                const li = document.createElement('li');
                
                // Format: Organization Name (Individual Name)
                // If they are identical (because org was left blank), just show the name once.
                const displayText = (c.orgName && c.orgName !== c.name) ? `${c.orgName} (${c.name})` : c.name;
                
                li.textContent = displayText;
                
                // When clicked, fill the visible input and the hidden phone input
                li.onclick = () => {
                    searchInput.value = displayText;
                    hiddenPhoneInput.value = c.phone; 
                    suggestionsBox.style.display = 'none';
                };
                suggestionsBox.appendChild(li);
            });
        } else {
            suggestionsBox.style.display = 'none';
        }
    });

    // Hide list when clicking anywhere else on the page
    document.addEventListener('click', function(e) {
        if (e.target !== searchInput && suggestionsBox) {
            suggestionsBox.style.display = 'none';
        }
    });
}

// Initialize the search box listener immediately
setupCustomerSearch();
