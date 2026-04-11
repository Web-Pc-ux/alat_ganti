// Cloud Configuration (Turbo Engine v5.3 Style)
const GS_URL = "https://script.google.com/macros/s/AKfycbzwLTgG82wdNgcvIunoFPjftlp1DImjGUq7_sNwm2AtEWV9qC0TENYCLg1BScctnI3EOA/exec";
const AUTH_TOKEN = "CHRIS_SHEETS_KEY_2026";

// Data Stores
let equipment = [];
let equipmentIdCounter = 1;
let requests = [];
let requestIdCounter = 1;
let computerList = [];
let computerIdCounter = 1;
let budget = 0;
let budgetUsed = 0;
let Admin = 0;
let receivedItems = [];
let receivedIdCounter = 1;
let syarikatList = [];
let syarikatIdCounter = 1;
let juruteknikList = [];
let juruteknikIdCounter = 1;

window.addEventListener('load', async () => {
    // Determine if we are in Dashboard or Login
    const isDashboard = window.location.pathname.includes('dashboard.html');

    if (isDashboard) {
        // Load data from Storage (Cache) first to show something while waiting for cloud
        loadDataFromStorage();

        // UI Initialization (Show cached data immediately)
        updateDashboard();
        updateBudgetDisplay();
        displayRequests();
        displayEquipmentTable();
        displayComputerTable();
        displayReceivedTable();
        displaySyarikatTable();
        displayJuruteknikTable();
        updateRequestJenamaOptions();
        updateRequestEquipmentOptions();

        // Event listeners - Setup BEFORE waiting for cloud
        setupEventListeners();
        setupEquipmentListeners();
        setupComputerListeners();
        setupImportListeners();
        setupRequestModalListeners();
        setupConfirmationModalListeners();
        setupReportListeners();
        setupStockReportListeners();
        setupPenerimaanListeners();
        setupSyarikatListeners();
        setupJuruteknikListeners();

        // Restore UI state from URL hash or localStorage
        let initialSection = window.location.hash.substring(1) || localStorage.getItem('activeSection') || 'dashboard';
        if (!document.getElementById(initialSection)) {
            initialSection = 'dashboard';
        }
        showSection(initialSection);

        // Start cloud sync in background (NO await)
        turboLoadAll().then(() => {
            // Reload UI components that need fresh data after cloud sync finishes
            updateRequestJenamaOptions();
            updateRequestEquipmentOptions();
            displayJuruteknikTable();
        });
    }
});

// Setup Equipment Listeners
function setupEquipmentListeners() {
    const modal = document.getElementById('equipmentModal');
    const openBtn = document.getElementById('openAddEquipmentForm');
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelModalBtn');
    const form = document.getElementById('addEquipmentForm');

    if (!form || !modal || !openBtn) {
        console.error('Required modal elements not found');
        return;
    }

    // Open modal button
    openBtn.addEventListener('click', () => {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    // Close modal function
    const closeModal = () => {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        form.reset();
        document.getElementById('EQuantity').value = '1';
        document.getElementById('modalTitle').textContent = '➕ Tambah Peralatan Baru';
        delete form.dataset.editingId;
    };

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    // Disable close on outside click so form stays open
    // modal.addEventListener('click', (event) => {
    //     if (event.target === modal) {
    //         closeModal();
    //     }
    // });


    // Event listeners for Auto-Sum
    const qtyInput = document.getElementById('EQuantity');
    const priceInput = document.getElementById('EHargaUnit');
    const totalInput = document.getElementById('ETotalRM');

    function calculateTotal() {
        const qty = parseInt(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = qty * price;
        totalInput.value = total.toFixed(2);
    }

    if (qtyInput && priceInput) {
        qtyInput.addEventListener('input', calculateTotal);
        priceInput.addEventListener('input', calculateTotal);
    }

    // Form submission
    form.addEventListener('submit', handleAddEquipment);
}

// Setup import and request listeners
function setupImportListeners() {
    const importBtn = document.getElementById('importEquipmentBtn');
    const importInput = document.getElementById('importEquipmentFile');
    const openReqBtn = document.getElementById('openRequestForm');

    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importEquipmentFile(importInput.files[0]));
    }

    // opening of request form handled by modal listener
}

function setupRequestModalListeners() {
    const openReqBtn = document.getElementById('openRequestForm');
    const modal = document.getElementById('requestModal');
    const closeBtn = document.getElementById('closeRequestModal');
    const cancelBtn = document.getElementById('cancelRequestBtn');
    const form = document.getElementById('addRequestForm');
    const modelSelect = document.getElementById('reqModel');
    const statusSelect = document.getElementById('reqStatus');

    const jenamaSelect = document.getElementById('reqJenama');
    const itemSelect = document.getElementById('reqRequestItem');

    if (!openReqBtn || !modal || !form || !modelSelect || !statusSelect || !jenamaSelect || !itemSelect) return;

    openReqBtn.addEventListener('click', () => {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        form.reset();
        document.getElementById('requestModalTitle').textContent = '➕ Tambah Permohonan';
        delete form.dataset.editingId;

        // Hide advanced fields for new request
        document.getElementById('groupSiriGanti').style.display = 'none';
        document.getElementById('groupStatus').style.display = 'none';
        document.getElementById('groupDateEnd').style.display = 'none';

        // Initial populate with no filter or empty
        updateRequestJenamaOptions();
        updateRequestEquipmentOptions();

        // Disable dependent fields initially for new request
        jenamaSelect.disabled = true;
        itemSelect.disabled = true;
        jenamaSelect.style.cursor = 'not-allowed';
        itemSelect.style.cursor = 'not-allowed';
    });

    // Function to check and show error if model not selected
    const handleDependentClick = (e) => {
        if (!modelSelect.value) {
            showNotification('⚠️ Sila pilih Model Komputer dahulu.', 'warning');
            // If it was a click on the select itself (though disabled selects usually don't fire)
            e.preventDefault();
        }
    };

    // Attach to parent to catch clicks even if select is disabled
    jenamaSelect.parentElement.addEventListener('mousedown', handleDependentClick);
    itemSelect.parentElement.addEventListener('mousedown', handleDependentClick);

    // Add change listener for dynamic filtering
    modelSelect.addEventListener('change', () => {
        const selectedModel = modelSelect.value;
        if (selectedModel) {
            jenamaSelect.disabled = false;
            itemSelect.disabled = false;
            jenamaSelect.style.cursor = 'pointer';
            itemSelect.style.cursor = 'pointer';
        } else {
            jenamaSelect.disabled = true;
            itemSelect.disabled = true;
            jenamaSelect.style.cursor = 'not-allowed';
            itemSelect.style.cursor = 'not-allowed';
        }
        updateRequestJenamaOptions(selectedModel);
        updateRequestEquipmentOptions(selectedModel);
    });

    // Auto-update Date End when status is Selesai or Ditolak
    statusSelect.addEventListener('change', () => {
        const status = statusSelect.value;
        if (status === 'Selesai' || status === 'Ditolak') {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            document.getElementById('reqDateEnd').value = localDateTime;
        }
    });

    closeBtn?.addEventListener('click', closeRequestModal);
    cancelBtn?.addEventListener('click', closeRequestModal);
    // Disable close on outside click so form stays open
    // modal.addEventListener('click', (e) => { if (e.target === modal) closeRequestModal(); });

    form.addEventListener('submit', handleAddRequest);

    function closeRequestModal() {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        form.reset();
        delete form.dataset.editingId;
    }
}


// Handle Add Equipment - ada sambungan ke section senarai alat ganti form edit add dan table
function handleAddEquipment(e) {
    e.preventDefault();

    const form = document.getElementById('addEquipmentForm');
    const editingId = form.dataset.editingId ? parseInt(form.dataset.editingId) : null;

    const equipmentData = {
        komp1: document.getElementById('komp11').value.trim(), //pilih
        category: document.getElementById('NamaPeralatan').value, //pilih nama peralatan
        model: document.getElementById('NamaModel').value.trim(),
        quantity: parseInt(document.getElementById('EQuantity').value),
        hargaunit: parseFloat(document.getElementById('EHargaUnit').value) || 0,
        totalrm: parseFloat(document.getElementById('ETotalRM').value) || 0,
        notaganti: document.getElementById('CatitAlatGanti').value.trim(),
        namamodell: document.getElementById('NamaModel').value,
        syarikat: document.getElementById('E_Syarikat').value,
        dateAdded: new Date().toLocaleDateString('id-ID')
    };

    if (editingId) {
        // Update existing equipment
        const itemIndex = equipment.findIndex(e => e.id == editingId);
        if (itemIndex > -1) {
            equipment[itemIndex] = {
                ...equipment[itemIndex],
                ...equipmentData
            };
            turboSync('update', 'kategori', equipment[itemIndex]);
            showNotification('✓ Peralatan berhasil diubah!', 'success');
        }
    } else {
        // Add new equipment
        const newEquipment = {
            id: equipmentIdCounter++,
            ...equipmentData
        };
        equipment.push(newEquipment);
        turboSync('create', 'kategori', newEquipment);
        showNotification('✓ Selesai!! Peralatan berhasil ditambahkan!', 'success');
    }

    saveDataToStorage();
    updateRequestEquipmentOptions();

    // Update category filter dengan kategori baru jika ada
    updateCategoryFilters();

    // Close modal
    const modal = document.getElementById('equipmentModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';

    // Reset form
    form.reset();
    document.getElementById('EQuantity').value = '1';
    document.getElementById('modalTitle').textContent = '➕ Tambah Peralatan Baru';
    delete form.dataset.editingId;

    updateDashboard();
    displayEquipmentTable();
}

// Import equipment from CSV (simple parser)_Digunakan untuk upload file ke dalam senarai alat ganti
// ni dalam grup senarai alat ganti
function importEquipmentCSV(file) {
    if (!file) {
        showNotification('⚠️ Pilih fail CSV terlebih dahulu.', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        let added = 0;
        for (let i = 0; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            // Expecting: komp1,category,quantity,icon,condition,model,location,notes
            if (!row[0]) continue;
            const newEquipment = {
                id: equipmentIdCounter++,
                komp1: row[0] || 'Unknown',
                category: row[1] || 'General',
                model: row[2] || '',
                namamodell: row[3] || '',
                quantity: row[4] || '', //icon -- iconn
                hargaunit: row[5] || '',
                totalrm: row[6] || '',
                notaganti: row[7] || '',
                dateAdded: new Date().toLocaleDateString('id-ID')
            };
            equipment.push(newEquipment);
            added++;
        }
        saveDataToStorage();
        updateRequestEquipmentOptions();
        updateCategoryFilters();
        displayEquipmentTable();
        showNotification(`✓ ${added} baris berhasil diimpor.`, 'success');
    };
    reader.readAsText(file, 'utf-8');
}

// Unified import handler: CSV or XLSX
// ni pun dalam grop senarai alat ganrti
function importEquipmentFile(file) {
    if (!file) { showNotification('⚠️ Pilih fail terlebih dahulu.', 'warning'); return; }
    const komp1 = file.komp1.toLowerCase();
    if (komp1.endsWith('.csv')) {
        importEquipmentCSV(file);
        return;
    }
    if (komp1.endsWith('.xlsx') || komp1.endsWith('.xls')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
                // parse csv text
                const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(l => l);
                let added = 0;
                for (let i = 0; i < lines.length; i++) {
                    const row = parseCSVLine(lines[i]);
                    if (!row[0]) continue;
                    const newEquipment = {
                        id: equipmentIdCounter++,
                        komp1: row[0] || 'Unknown',
                        category: row[1] || 'General',
                        model: row[2] || '',
                        namamodell: row[3] || '',
                        quantity: row[4] || '', //icon -- iconn
                        hargaunit: row[5] || '',
                        totalrm: row[6] || '',
                        notaganti: row[7] || '',
                        dateAdded: new Date().toLocaleDateString('id-ID')
                    };
                    equipment.push(newEquipment);
                    added++;
                }
                saveDataToStorage();
                updateRequestEquipmentOptions();
                updateCategoryFilters();
                displayEquipmentTable();
                showNotification(`✓ ${added} baris berhasil diimpor.`, 'success');
            } catch (err) {
                console.error(err);
                showNotification('⚠️ Gagal memproses file XLSX.', 'warning');
            }
        };
        reader.readAsArrayBuffer(file);
        return;
    }
    showNotification('⚠️ Format file tidak disokong.', 'warning');
}

// Basic CSV line parser supporting quoted fields
function parseCSVLine(line) {
    const values = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; continue; }
            inQuotes = !inQuotes;
            continue;
        }
        if (ch === ',' && !inQuotes) {
            values.push(cur);
            cur = '';
            continue;
        }
        cur += ch;
    }
    values.push(cur);
    return values;
}

// Update category filters dynamically
function updateCategoryFilters() {
    // Get unique categories from equipment array
    const uniqueCategories = [...new Set(equipment.map(e => e.category))].filter(cat => cat);

    // Update category filter select in Inventory section
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        const currentSelected = categoryFilter.value;
        const existingOptions = Array.from(categoryFilter.options).map(opt => opt.value).slice(1); // Skip "Semua Kategori"

        // Add new categories that don't exist yet
        uniqueCategories.forEach(category => {
            if (!existingOptions.includes(category)) {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            }
        });
    }
}



// Contoh: panggil simulateProcess bila user klik button
// document.getElementById('addItemBtn').addEventListener('click', simulateProcess);


// -----------------------
// Requests (Permohonan user)
// -----------------------

function addRequest({ cust, model, jenama, nosiri, Requestitem, nosiriganti, juruteknik, catat, status = 'Baru' }) {
    const newReq = {
        id: requestIdCounter++,
        cust: cust || 'Unknown',
        model: model,
        jenama: jenama,
        nosiri: nosiri,
        Requestitem: Requestitem || '-',
        nosiriganti: nosiriganti,
        status: status,
        juruteknik: juruteknik,
        catat: catat,
        date: new Date().toLocaleDateString('id-ID')
    };
    requests.push(newReq);
    saveDataToStorage();
    displayRequests();
    updateDashboard();
    showNotification('✓ Beyul Permohonan berhasil ditambahkan!', 'success');
}

// Handle add/edit request from permohonan alat ganti user form
function handleAddRequest(e) {
    e.preventDefault();
    const form = document.getElementById('addRequestForm');
    const editingId = form.dataset.editingId ? parseInt(form.dataset.editingId) : null;
    const cust = document.getElementById('reqCust').value.trim();
    const model = document.getElementById('reqModel').value.trim();
    const jenama = document.getElementById('reqJenama').value.trim();
    const nosiri = document.getElementById('reqNoSiri').value.trim();
    const Requestitem = document.getElementById('reqRequestItem').value.trim();
    const nosiriganti = document.getElementById('reqSiriGanti').value.trim();
    const status = document.getElementById('reqStatus').value.trim();
    const catat = document.getElementById('reqcatat').value.trim();
    const dateend = document.getElementById('reqDateEnd').value.trim();
    const juruteknik = document.getElementById('reqJuruteknik').value.trim();

    if (editingId) {
        const idx = requests.findIndex(r => r.id === editingId);
        if (idx > -1) {
            requests[idx] = { ...requests[idx], cust, model, jenama, nosiri, Requestitem, nosiriganti, status, catat, dateend, juruteknik };
            turboSync('update', 'permohonan', requests[idx]);
            showNotification('✓ Permohonan dikemaskini.', 'success');
        }
    } else { //table permohonan user punya
        const newReq = {
            id: requestIdCounter++,
            cust,
            model,
            jenama,
            nosiri,
            Requestitem,
            nosiriganti,
            status,
            juruteknik,
            catat,
            dateend,
            date: new Date().toLocaleDateString('id-ID')

        };
        requests.push(newReq);
        turboSync('create', 'permohonan', newReq);
        showNotification('✓ Permohonan User ditambahkan.', 'success');
    }

    saveDataToStorage();
    displayRequests();
    updateDashboard();

    // close modal
    const modal = document.getElementById('requestModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    form.reset();
    delete form.dataset.editingId;
}








function displayRequests() {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody) return;
    if (requests.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7" class="text-center">Belum ada permohonan.</td></tr>';
        return;
    }

    // masih permohonan user
    tbody.innerHTML = requests.map((r, idx) => `
        <tr data-req-id="${r.id}">
            <td data-label="No">${idx + 1}</td>
            <td data-label="Nama">${r.cust}</td>
            <td data-label="Model">${r.model}</td>
            <td data-label="Jenama">${r.jenama}</td>
            <td data-label="No Siri">${r.nosiri}</td>
            <td data-label="Item">${r.Requestitem}</td>
            <td data-label="No Siri Ganti">${r.nosiriganti}</td>

            <td data-label="Status">
                <span class="status-badge ${getStatusClass(r.status)}">
                    ${r.status}
                </span>
            </td>

            <td data-label="Petugas">${r.juruteknik}</td>
            <td data-label="Catatan">${r.catat}</td>
            <td data-label="Tarikh">${r.date}</td>
            <td data-label="Selesai">${r.dateend}</td>
            <td data-label="Tindakan">
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="promptEditRequest(${r.id})">✏️</button>
                    <button class="btn btn-danger" onclick="deleteRequest(${r.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ------------------
// Usage (Penggunaan Item)
// ------------------
// Usage functions removed


function promptEditRequest(id) {
    const r = requests.find(x => x.id === id);
    if (!r) return;
    // open modal with data for editing permohonan user
    const form = document.getElementById('addRequestForm');
    if (!form) return;

    document.getElementById('reqCust').value = r.cust || '';
    document.getElementById('reqModel').value = r.model || '';

    // Trigger populate based on current model
    updateRequestJenamaOptions(r.model);
    updateRequestEquipmentOptions(r.model);

    // Enable fields if model is present (it should be when editing)
    if (r.model) {
        document.getElementById('reqJenama').disabled = false;
        document.getElementById('reqRequestItem').disabled = false;
        document.getElementById('reqJenama').style.cursor = 'pointer';
        document.getElementById('reqRequestItem').style.cursor = 'pointer';
    }

    document.getElementById('reqJenama').value = r.jenama || '';
    document.getElementById('reqNoSiri').value = r.nosiri || '';
    document.getElementById('reqRequestItem').value = r.Requestitem || '';
    document.getElementById('reqSiriGanti').value = r.nosiriganti || '';
    document.getElementById('reqStatus').value = r.status || 'Baru';
    document.getElementById('reqcatat').value = r.catat || ''; // Use r.catat instead of r.notes
    document.getElementById('reqDateEnd').value = r.dateend || '';
    document.getElementById('reqJuruteknik').value = r.juruteknik || '';

    // Show advanced fields for editing
    document.getElementById('groupSiriGanti').style.display = 'block';
    document.getElementById('groupStatus').style.display = 'block';
    document.getElementById('groupDateEnd').style.display = 'block';

    form.dataset.editingId = id;
    document.getElementById('requestModal').classList.add('show');
    document.getElementById('requestModalTitle').textContent = '✅ Edit Permohonan';
    document.body.style.overflow = 'hidden';
}

function deleteRequest(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus permohonan ini?')) return;
    requests = requests.filter(r => r.id !== id);
    saveDataToStorage();
    displayRequests();
    updateDashboard();
    showNotification('✓ Permohonan dihapus.', 'success');
}

// Setup Event Listeners
function setupEventListeners() {
    // Listeners cleaned up
    // Budget controls
    const setBudgetBtn = document.getElementById('setBudgetBtn');
    const recordExpenseBtn = document.getElementById('recordExpenseBtn') || document.getElementById('recordExpenseBtn');
    if (setBudgetBtn) setBudgetBtn.addEventListener('click', () => setBudget(document.getElementById('budgetAmount').value));
    if (recordExpenseBtn) recordExpenseBtn.addEventListener('click', () => recordExpense(document.getElementById('expenseAmount').value));

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            showSection(sectionId);

            // Tutup dropdown apabila page dipilih (klik page tutup balik)
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('expanded');
                menu.style.maxHeight = null;
                const toggle = menu.previousElementSibling;
                if (toggle) toggle.classList.remove('active');
            });
        });
    });

    // Sidebar Dropdown Nav
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            const menu = toggle.nextElementSibling;
            if (menu.classList.contains('expanded')) {
                menu.classList.remove('expanded');
                menu.style.maxHeight = null;
            } else {
                // Remove existing expanded dropdowns for accordion behavior
                document.querySelectorAll('.dropdown-menu').forEach(m => {
                    m.classList.remove('expanded');
                    m.style.maxHeight = null;
                    const prev = m.previousElementSibling;
                    if (prev) prev.classList.remove('active');
                });

                menu.classList.add('expanded');
                menu.style.maxHeight = menu.scrollHeight + "px";
            }
        });
    });

    // Sidebar Navigation - Links are already handled by .nav-link listener above
    // No extra burger toggle needed for the fixed/bottom sidebar
}

// Add Item Handler
// Inventory functions removed (handleAddItem, displayInventory, filterInventory, deleteItem, editItem)

// Update Dashboard Stats
// ------------------
// Budget functions
// ------------------
function setBudget(amount) {
    budget = parseFloat(amount) || 0;
    saveDataToStorage();
    updateBudgetDisplay();
    showNotification('✓ Bajet disimpan.', 'success');
}

// Computer Stats
function updateDashboard() {
    // Requests stats dashboard permohonan user
    const reqNew = requests.filter(r => r.status.toLowerCase() === 'baru').length;

    // Equipment Stats (Restored)
    const totalEquipment = equipment.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    const elTotalEquipment = document.getElementById('totalEquipment');
    if (elTotalEquipment) elTotalEquipment.textContent = totalEquipment;

    const reqInProgress = requests.filter(r => r.status.toLowerCase() === 'dalam proses').length;
    const reqDone = requests.filter(r => r.status.toLowerCase() === 'selesai').length;
    const reqRejected = requests.filter(r => r.status.toLowerCase() === 'ditolak').length;

    const elReqNew = document.getElementById('reqNew');
    if (elReqNew) elReqNew.textContent = reqNew;
    const elReqIn = document.getElementById('reqInProgress');
    if (elReqIn) elReqIn.textContent = reqInProgress;
    const elReqDone = document.getElementById('reqDone');
    if (elReqDone) elReqDone.textContent = reqDone;
    const elReqRejected = document.getElementById('reqRejected');
    if (elReqRejected) elReqRejected.textContent = reqRejected;

    // Computer Stats
    const totalComputers = computerList.length;
    const totalDesktops = computerList.filter(c => c.modelType === 'Desktop').length;
    const totalLaptops = computerList.filter(c => c.modelType === 'Laptop').length;

    if (document.getElementById('totalComputers')) document.getElementById('totalComputers').textContent = totalComputers;
    if (document.getElementById('totalDesktops')) document.getElementById('totalDesktops').textContent = totalDesktops;
    if (document.getElementById('totalLaptops')) document.getElementById('totalLaptops').textContent = totalLaptops;
}

// Show Section Function
function showSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (!target) return;

    // Hide all sections by removing the active-section class
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active-section');
        section.style.display = 'none'; // Keep as fallback/reset
    });

    // Show target section
    target.style.display = 'block';
    // Small delay to trigger CSS transitions if added later
    setTimeout(() => {
        target.classList.add('active-section');
    }, 10);

    // Update Navigation Active State
    document.querySelectorAll('.nav-link, .burger-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
        }
    });

    // Save state
    localStorage.setItem('activeSection', sectionId);

    // Auto-scroll to top when switching
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Dynamically update 'Jenama Komputer' dropdown in Request Form
function updateRequestJenamaOptions(filterModel = null) {
    const dropdown = document.getElementById('reqJenama');
    if (!dropdown) return;

    // Save current selection if any
    const currentValue = dropdown.value;

    // Clear existing options except the first one
    dropdown.innerHTML = '<option value="">-- Pilih Jenama --</option>';

    // Add options from computerList pilihan dari section senarai komputer
    // Filter by model if provided
    const filteredList = filterModel
        ? computerList.filter(comp => comp.modelType.toLowerCase() === filterModel.toLowerCase())
        : computerList;

    filteredList.forEach(comp => {
        const option = document.createElement('option');
        option.value = comp.brandModel;
        option.textContent = comp.brandModel;
        dropdown.appendChild(option);
    });

    // Restore selection if it still exists
    dropdown.value = currentValue;
}

// Dynamically update 'Alat Ganti Dipohon' dropdown in Request Form
function updateRequestEquipmentOptions(filterModel = null) {
    const dropdown = document.getElementById('reqRequestItem');
    if (!dropdown) return;

    // Save current selection if any
    const currentValue = dropdown.value;

    // Clear existing options except the first one
    dropdown.innerHTML = '<option value="">-- Pilih Item --</option>';

    // Add options from equipment list pilihan dari section senarai alat
    // Filter by model if provided (komp1 stores the model type in equipment list)
    const filteredEquipment = filterModel
        ? equipment.filter(e => e.komp1.toLowerCase() === filterModel.toLowerCase())
        : equipment;

    const itemNames = [...new Set(filteredEquipment.map(e => e.category))];
    itemNames.sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        dropdown.appendChild(option);
    });

    // Restore selection if it still exists
    dropdown.value = currentValue;
}

function recordExpense(amount) {
    const val = parseFloat(amount) || 0;
    if (val <= 0) { showNotification('⚠️  Masukkan jumlah yang sah.', 'warning'); return; }
    budgetUsed = (parseFloat(budgetUsed) || 0) + val;
    saveDataToStorage();
    updateBudgetDisplay();
    showNotification('✓ Perbelanjaan direkod.', 'success');
}

function updateBudgetDisplay() {
    const totalEl = document.getElementById('budgetTotal');
    const usedEl = document.getElementById('budgetUsed');
    const remEl = document.getElementById('budgetRemaining');
    const pctEl = document.getElementById('budgetPercent');

    const total = parseFloat(budget) || 0;
    const used = parseFloat(budgetUsed) || 0;
    const remaining = Math.max(0, total - used);
    const percent = total > 0 ? Math.round((used / total) * 100) + '%' : '0%';

    if (totalEl) totalEl.textContent = `RM ${total.toFixed(2)}`;
    if (usedEl) usedEl.textContent = `RM ${used.toFixed(2)}`;
    if (remEl) remEl.textContent = `RM ${remaining.toFixed(2)}`;
    if (pctEl) pctEl.textContent = percent;
}

// Help function for rich text editing
window.formatDoc = function (cmd, value = null) {
    if (cmd === 'justifyLeft' || cmd === 'justifyCenter' || cmd === 'justifyRight' || cmd === 'justifyFull' || cmd === 'bold' || cmd === 'italic' || cmd === 'underline' || cmd === 'foreColor' || cmd === 'fontName') {
        document.execCommand(cmd, false, value);
    }
};

window.switchRibbonTab = function (tabId) {
    document.querySelectorAll('.ribbon-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.ribbon-panel').forEach(panel => panel.classList.remove('active'));

    document.querySelector(`[onclick="switchRibbonTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
};

window.updateLineHeight = function (val) {
    const editableArea = document.getElementById('reportEditableArea');
    if (editableArea) {
        editableArea.style.lineHeight = val;
        reportSettings.lineHeight = val;
    }
};

window.transformText = function (type) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const text = range.toString();
        const transformed = type === 'uppercase' ? text.toUpperCase() : text.toLowerCase();

        const span = document.createElement('span');
        span.textContent = transformed;
        range.deleteContents();
        range.insertNode(span);
    }
};

let reportSettings = {
    logo: null,
    logoWidth: 150,
    baseFontSize: 10,
    fontFamily: 'Inter, sans-serif',
    lineHeight: '1.2',
    customHeaderHTML: null,
    customSignatureHTML: null
};

function saveReportSettings() {
    const editableArea = document.getElementById('reportEditableArea');
    if (!editableArea) return;

    // Save Logo Settings
    const logoImg = document.getElementById('reportLogoPreview');
    if (logoImg) {
        reportSettings.logo = logoImg.src;
    }

    const logoSlider = document.getElementById('logoWidthSlider');
    if (logoSlider) {
        reportSettings.logoWidth = logoSlider.value;
    }

    reportSettings.baseFontSize = parseInt(editableArea.style.fontSize) || 10;
    reportSettings.fontFamily = document.getElementById('fontFamilySelect').value;
    reportSettings.lineHeight = document.getElementById('lineHeightSelect').value;

    // NEW: Save the actual HTML of header and signatures to persist ALL Word-like edits (colors, layout, etc)
    const header = editableArea.querySelector('.report-header');
    const signatures = editableArea.querySelector('.report-signature-container');

    if (header) reportSettings.customHeaderHTML = header.innerHTML;
    if (signatures) reportSettings.customSignatureHTML = signatures.innerHTML;

    localStorage.setItem('reportSettings', JSON.stringify(reportSettings));
    showNotification('✓ Tetapan dan gaya laporan disimpan!', 'success');
}

function loadReportSettings() {
    const stored = localStorage.getItem('reportSettings');
    if (stored) {
        try {
            reportSettings = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading report settings', e);
        }
    }
}

window.initResizableLogo = function () {
    const logoArea = document.getElementById('reportLogoArea');
    if (!logoArea) return;

    let logoImg = logoArea.querySelector('img');
    if (!logoImg) return;

    // Remove old wrapper if exists
    if (logoImg.parentElement.classList.contains('logo-wrapper')) {
        const wrapper = logoImg.parentElement;
        const parent = wrapper.parentElement;
        parent.insertBefore(logoImg, wrapper);
        wrapper.remove();
    }

    // Create Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'logo-wrapper';
    wrapper.style.display = 'inline-block';

    logoImg.parentNode.insertBefore(wrapper, logoImg);
    wrapper.appendChild(logoImg);

    // Add Handles
    const handles = ['tl', 'tm', 'tr', 'mr', 'br', 'bm', 'bl', 'ml'];
    handles.forEach(h => {
        const div = document.createElement('div');
        div.className = `logo-resizer resizer-${h}`;
        wrapper.appendChild(div);

        div.addEventListener('mousedown', startResize);
    });

    wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.logo-wrapper').forEach(w => w.classList.remove('active'));
        wrapper.classList.add('active');
    });

    let currentResizer;
    let originalWidth, originalHeight, originalX, originalY;

    function startResize(e) {
        e.preventDefault();
        e.stopPropagation();
        currentResizer = e.target;
        originalWidth = logoImg.offsetWidth;
        originalHeight = logoImg.offsetHeight;
        originalX = e.pageX;
        originalY = e.pageY;

        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResize);
    }

    function resize(e) {
        let width = originalWidth;
        const deltaX = e.pageX - originalX;
        const deltaY = e.pageY - originalY;
        const aspectRatio = originalWidth / originalHeight;

        // Handles that primarily use X movement
        if (currentResizer.classList.contains('resizer-mr') || currentResizer.classList.contains('resizer-br') || currentResizer.classList.contains('resizer-tr')) {
            width = originalWidth + deltaX;
        } else if (currentResizer.classList.contains('resizer-ml') || currentResizer.classList.contains('resizer-bl') || currentResizer.classList.contains('resizer-tl')) {
            width = originalWidth - deltaX;
        }
        // Handles that use Y movement (like the bottom-middle handle)
        else if (currentResizer.classList.contains('resizer-bm')) {
            const newHeight = originalHeight + deltaY;
            width = newHeight * aspectRatio;
        } else if (currentResizer.classList.contains('resizer-tm')) {
            const newHeight = originalHeight - deltaY;
            width = newHeight * aspectRatio;
        }

        // If it's a corner handle, we might want to take the larger delta for a smoother feel, 
        // but for now, the X-based one (already calculated) is sufficient for proportional scaling.

        if (width > 20) {
            logoImg.style.width = width + 'px';
            logoImg.style.height = 'auto'; // Ensure height follows width proportionally
            reportSettings.logoWidth = width;
            const slider = document.getElementById('logoWidthSlider');
            if (slider) slider.value = width;
            const label = document.getElementById('logoWidthValue');
            if (label) label.textContent = `${Math.round(width)}px`;
        }
    }

    function stopResize() {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResize);
    }
};

// Global click to deselect handles
document.addEventListener('click', () => {
    document.querySelectorAll('.logo-wrapper').forEach(w => w.classList.remove('active'));
});

function setupReportListeners() {
    loadReportSettings(); // Load at start

    const reportBtn = document.getElementById('generateReportBtn');
    if (reportBtn) {
        reportBtn.addEventListener('click', generateReport);
    }

    // Modal close listeners
    document.getElementById('closeReportPreview')?.addEventListener('click', closeReportPreview);
    document.getElementById('cancelReportPreview')?.addEventListener('click', closeReportPreview);

    // Logo Upload
    document.getElementById('reportLogoInput')?.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const logoContainer = document.getElementById('reportLogoArea');
                if (logoContainer) {
                    logoContainer.innerHTML = `<img src="${event.target.result}" id="reportLogoPreview" alt="Report Logo" style="width:${reportSettings.logoWidth}px">`;
                    reportSettings.logo = event.target.result;
                    // Initialize interactive resizing
                    setTimeout(window.initResizableLogo, 100);
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Logo Resize Slider
    const logoSlider = document.getElementById('logoWidthSlider');
    const logoWidthValue = document.getElementById('logoWidthValue');
    if (logoSlider) {
        logoSlider.value = reportSettings.logoWidth;
        if (logoWidthValue) logoWidthValue.textContent = `${reportSettings.logoWidth}px`;

        logoSlider.addEventListener('input', function () {
            const logoPreview = document.getElementById('reportLogoPreview');
            if (logoPreview) {
                logoPreview.style.width = this.value + 'px';
            }
            if (logoWidthValue) logoWidthValue.textContent = `${this.value}px`;
            reportSettings.logoWidth = this.value;
        });
    }

    // Save Settings Button
    document.getElementById('saveReportSettingsBtn')?.addEventListener('click', saveReportSettings);

    // Font Size Controls (Selective)
    const fontSizeInput = document.getElementById('fontSizeInput');

    document.getElementById('increaseFontSize')?.addEventListener('click', () => {
        modifySelectionFontSize(1);
    });
    document.getElementById('decreaseFontSize')?.addEventListener('click', () => {
        modifySelectionFontSize(-1);
    });

    fontSizeInput?.addEventListener('input', (e) => {
        setSelectionFontSize(e.target.value);
    });

    // Laporan A4 Button
    document.getElementById('laporanA4Btn')?.addEventListener('click', () => {
        const reportContent = document.getElementById('reportEditableArea').innerHTML;
        const printWindow = window.open('', '_blank');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Alat Ganti</title>
                <link rel="stylesheet" href="style.css">
                <style>
                    * { box-sizing: border-box; }
                    body { background: white !important; margin: 0; padding: 0; }
                    .report-page { 
                        box-shadow: none !important; 
                        margin: 0 !important; 
                        width: 210mm !important; 
                        padding: 20mm !important;
                        border: none !important;
                    }
                    @media print {
                        @page { margin: 0; size: A4 portrait; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="report-editable-container" style="background:white; padding:0;">
                    ${reportContent}
                </div>
                <script>
                    // Remove interactive elements
                    document.querySelectorAll('.resizer, .logo-wrapper::before, .logo-wrapper::after').forEach(el => el.remove());
                    document.querySelectorAll('.logo-wrapper').forEach(el => {
                        el.style.border = 'none';
                    });
                    
                    window.onload = function() {
                        window.print();
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    });

    // Final Print Button (Simplified Restore)
    document.getElementById('confirmPrintBtn')?.addEventListener('click', () => {
        // Deselect logo and blur to hide handles/cursors
        document.querySelectorAll('.logo-wrapper').forEach(w => w.classList.remove('active'));
        document.getElementById('reportEditableArea')?.blur();

        // Just print the window - CSS will handle hiding the UI
        window.print();
    });
}

/**
 * Sets a specific font size for selected text
 * @param {string|number} size - Font size in pt
 */
function setSelectionFontSize(size) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = `${size}pt`;

    try {
        range.surroundContents(span);
    } catch (e) {
        // Fallback for complex selections (e.g. crossing tags)
        document.execCommand('fontSize', false, '7'); // Dummy size
        const fonts = document.querySelectorAll('font[size="7"]');
        fonts.forEach(f => {
            f.removeAttribute('size');
            f.style.fontSize = `${size}pt`;
            const s = document.createElement('span');
            s.style.fontSize = `${size}pt`;
            s.innerHTML = f.innerHTML;
            f.parentNode.replaceChild(s, f);
        });
    }
}

/**
 * Modifies font size for selected text only
 * @param {number} delta - Amount to increase/decrease in pt
 */
function modifySelectionFontSize(delta) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    let currentSize = 10;
    const parent = selection.anchorNode.parentElement;
    if (parent) {
        const style = window.getComputedStyle(parent);
        currentSize = parseFloat(style.fontSize) || 13.33;
        currentSize = Math.round(currentSize * 0.75); // px to pt
    }

    const newSize = Math.max(1, currentSize + delta);
    setSelectionFontSize(newSize);

    // Sync the input field
    const input = document.getElementById('fontSizeInput');
    if (input) input.value = newSize;
}

function closeReportPreview() {
    const modal = document.getElementById('reportPreviewModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    // Clear the print container to avoid ghosting glitches
    const printContainer = document.getElementById('reportContainer');
    if (printContainer) printContainer.innerHTML = '';
}

function generateReport() {
    const editableArea = document.getElementById('reportEditableArea');
    if (!editableArea) return;

    // Filter requests to only show "Dalam Proses" status
    const inProgressRequests = requests.filter(r => r.status === 'Dalam Proses');

    if (inProgressRequests.length === 0) {
        showNotification('⚠️  Tiada data permohonan "Dalam Proses" untuk laporan.', 'warning');
        return;
    }

    // Filter requests by Jadual from the in-progress list
    const jadualA = inProgressRequests.filter(r => r.model === 'Desktop');
    const jadualB = inProgressRequests.filter(r => r.model === 'Laptop');
    const jadualC = inProgressRequests.filter(r => r.model === 'Bahan Pakai Habis');

    const getPrice = (itemName) => {
        const item = equipment.find(e => e.category === itemName);
        return item ? parseFloat(item.hargaunit) || 0 : 0;
    };

    const buildTableRows = (items) => {
        let totalQty = 0;
        let totalPrice = 0;

        // GROUP ikut Item + Jenama (Model Komputer)
        const grouped = {};

        items.forEach(r => {
            const key = `${r.Requestitem}||${r.jenama}`;

            if (!grouped[key]) {
                grouped[key] = {
                    item: r.Requestitem,
                    jenama: r.jenama,
                    qty: 0
                };
            }

            grouped[key].qty += 1;
        });

        // Bina row table
        const rows = Object.values(grouped).map((g, idx) => {
            const price = getPrice(g.item);
            const rowTotal = price * g.qty;

            totalQty += g.qty;
            totalPrice += rowTotal;

            return `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${g.item} (${g.jenama})</td>
                <td class="text-center">${g.qty}</td>
                <td class="text-right">RM ${price.toFixed(2)}</td>
                <td class="text-right">RM ${rowTotal.toFixed(2)}</td>
            </tr>
        `;
        }).join('');

        return { rows, totalQty, totalPrice };
    };

    const resA = buildTableRows(jadualA);
    const resB = buildTableRows(jadualB);
    const resC = buildTableRows(jadualC);

    const grandTotalQty = resA.totalQty + resB.totalQty + resC.totalQty;
    const grandTotalPrice = resA.totalPrice + resB.totalPrice + resC.totalPrice;

    // Load saved settings display
    const currentLogoHTML = reportSettings.logo ? `<img src="${reportSettings.logo}" id="reportLogoPreview" alt="Report Logo" style="width:${reportSettings.logoWidth}px">` : '🏢';

    // Sync UI controls with settings
    const fontSelect = document.getElementById('fontFamilySelect');
    if (fontSelect) fontSelect.value = reportSettings.fontFamily;

    const lhSelect = document.getElementById('lineHeightSelect');
    if (lhSelect) lhSelect.value = reportSettings.lineHeight;

    const logoSlider = document.getElementById('logoWidthSlider');
    if (logoSlider) logoSlider.value = reportSettings.logoWidth;

    const logoLabel = document.getElementById('logoWidthValue');
    if (logoLabel) logoLabel.textContent = `${reportSettings.logoWidth}px`;

    // Use saved header or default
    const headerHTML = reportSettings.customHeaderHTML || `
                <div id="reportLogoArea" class="report-logo-placeholder">${currentLogoHTML}</div>
                <div class="report-title" contenteditable="true">BORANG PERMOHONAN ALAT GANTI BAGI TUJUAN PENYELENGGARAAN KOMPUTER UMS UMS/BEN/S2/2025 (100) JADUAL A, JADUAL B DAN JADUAL C</div>
                <div class="report-subtitle" contenteditable="true" style="text-align: left; margin-top: 15px;">Pembekal Dilantik : DATATECHNET</div>
    `;

    // Use saved signatures or default
    const signatureHTML = reportSettings.customSignatureHTML || `
                <div class="signature-block">
                    <div style="font-weight: bold; margin-bottom: 40px;">Disediakan Oleh;</div>
                    <div class="signature-details">
                        <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Nama</span> <span>: _______________________</span></div>
                        <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Jawatan</span> <span>: </span></div>
                        <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Cop</span> <span>: </span></div>
                        <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Tarikh</span> <span>: </span></div>
                    </div>
                </div>
                <div class="signature-block">
                    <div style="font-weight: bold; margin-bottom: 40px;">Disemak Oleh;</div>
                    <div class="signature-details">
                        <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Nama</span> <span>: _______________________</span></div>
                        <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Jawatan</span> <span>: </span></div>
                        <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Cop</span> <span>: </span></div>
                        <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Tarikh</span> <span>: </span></div>
                    </div>
                </div>
                <div class="signature-block">
                    <div style="font-weight: bold; margin-bottom: 40px;">Disahkan Oleh;</div>
                    <div class="signature-details">
                        <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Nama</span> <span>: _______________________</span></div>
                        <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Jawatan</span> <span>: </span></div>
                        <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Cop</span> <span>: </span></div>
                        <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Tarikh</span> <span>: </span></div>
                    </div>
                </div>
    `;

    // ADDED: Contractor Section dedicated string
    const contractorHTML = `
            <div style="margin-top:40px; margin-bottom: 20px; text-align:center; position: relative;">
                <div style="border-top: 1px dashed #000; width: 100%; position: absolute; top: 50%; z-index: 1;"></div>
                <span style="background: #fff; padding: 0 15px; position: relative; z-index: 2; font-weight: bold; font-size: 10pt;">BAHAGIAN KONTRAKTOR</span>
            </div>
            <div style="font-size: 9pt; margin-bottom: 15px;">
                Pengesahan penerimaan borang permohonan JTMK kepada Pembekal pada tarikh : _______________________
            </div>
            <div style="margin-top:10px; font-weight:bold; font-size:9pt;">
                Diterima Oleh;
            </div>
            <div class="signature-block" style="margin-top:10px; width:40%;">
                <div class="signature-details">
                    <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Nama</span> <span>: _______________________</span></div>
                    <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Jawatan</span> <span>: </span></div>
                    <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Cop</span> <span>: </span></div>
                    <div style="display: flex; gap: 5px;"><span style="display: inline-block; width: 60px;">Tarikh</span> <span>: </span></div>
                </div>
            </div>
    `;

    editableArea.innerHTML = `
        <div class="report-page" style="font-size: ${reportSettings.baseFontSize}pt; font-family: ${reportSettings.fontFamily}; line-height: ${reportSettings.lineHeight}">
            <div class="report-header">
                ${headerHTML}
            </div>

            <div class="report-info" contenteditable="true" style="text-align: left; text-decoration: none; margin: 30px 0 15px 0;">MAKLUMAT PERMOHONAN ALAT GANTI UMS/BEN/S2/2025 (100) KALI KE-</div>

            ${jadualA.length > 0 ? `
            <div class="report-section">
                <div class="report-section-title">Permohonan bagi Jadual A (Alat Ganti bagi perkakasan computer meja Desktop)</div>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th width="5%">No.</th>
                            <th width="55%">Deskripsi</th>
                            <th width="10%" class="text-center">Kuantiti</th>
                            <th width="15%" class="text-right">Harga seunit (RM)</th>
                            <th width="15%" class="text-right">Jumlah (RM)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resA.rows}
                        <tr class="report-total-row">
                            <td colspan="2" class="text-right">Jumlah Kuantiti</td>
                            <td class="text-center">${resA.totalQty}</td>
                            <td class="text-right">Jumlah</td>
                            <td class="text-right">RM ${resA.totalPrice.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>` : ''}

            ${jadualB.length > 0 ? `
            <div class="report-section">
                <div class="report-section-title">Permohonan bagi jadual b (Alat ganti bagi perkakasan Laptop / Notebook )</div>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th width="5%">No.</th>
                            <th width="55%">Deskripsi</th>
                            <th width="10%" class="text-center">Kuantiti</th>
                            <th width="15%" class="text-right">Harga seunit (RM)</th>
                            <th width="15%" class="text-right">Jumlah (RM)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resB.rows}
                        <tr class="report-total-row">
                            <td colspan="2" class="text-right">Jumlah Kuantiti</td>
                            <td class="text-center">${resB.totalQty}</td>
                            <td class="text-right">Jumlah</td>
                            <td class="text-right">RM ${resB.totalPrice.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>` : ''}

            ${jadualC.length > 0 ? `
            <div class="report-section">
                <div class="report-section-title">Permohonan jadual c (bahan pakai habis)</div>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th width="5%">No.</th>
                            <th width="55%">Deskripsi</th>
                            <th width="10%" class="text-center">Kuantiti</th>
                            <th width="15%" class="text-right">Harga seunit (RM)</th>
                            <th width="15%" class="text-right">Jumlah (RM)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resC.rows}
                        <tr class="report-total-row">
                            <td colspan="2" class="text-right">Jumlah Kuantiti</td>
                            <td class="text-center">${resC.totalQty}</td>
                            <td class="text-right">Jumlah</td>
                            <td class="text-right">RM ${resC.totalPrice.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>` : ''}

            <div class="report-grand-total">
                <table class="report-table-grand">
                    <tr>
                        <td width="30%">
                            <strong>Jumlah Kuantiti bagi Jadual A Dan Jadual B</strong>
                        </td>
                        <td width="10%" class="text-center">
                            <strong>${resA.totalQty + resB.totalQty}</strong>
                        </td>
                        <td width="30%">
                           <strong>Jumlah harga keseluruhan bagi Jadual A Dan Jadual B</strong>
                        </td>
                        <td width="30%" class="text-right">
                            <strong>RM ${(resA.totalPrice + resB.totalPrice).toFixed(2)}</strong>
                        </td>
                    </tr>
                </table>
            </div>

            <div style="margin-top:60px; margin-bottom: 20px; text-align:center; position: relative;">
                <div style="border-top: 1px dashed #000; width: 100%; position: absolute; top: 50%; z-index: 1;"></div>
                <span style="background: #fff; padding: 0 15px; position: relative; z-index: 2; font-weight: bold; font-size: 10pt;">BAHAGIAN JTMK</span>
            </div>

            <div class="report-signature-container">
                ${signatureHTML}
            </div>

            ${contractorHTML}
        </div>
    `;

    // Show the preview modal
    const modal = document.getElementById('reportPreviewModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Initialize interactive resizing
        setTimeout(window.initResizableLogo, 100);
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'Baru':
            return 'status-baru';
        case 'Dalam Proses':
            return 'status-dalam-proses';
        case 'Diluluskan':
            return 'status-diluluskan';
        case 'Ditolak':
            return 'status-ditolak';
        case 'Selesai':
            return 'status-selesai';
        default:
            return '';
    }
}





// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Icon mapping
    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s forwards';
        setTimeout(() => notification.remove(), 400);
    }, 4000);
}

// ==========================================
// Penerimaan Alat Ganti Logic
// ==========================================

function setupPenerimaanListeners() {
    const modal = document.getElementById('penerimaanModal');
    const openBtn = document.getElementById('openAddPenerimaanForm');
    const closeBtn = document.getElementById('closePenerimaanModal');
    const closeBtn2 = document.getElementById('closePenerimaanBtn');
    const form = document.getElementById('addPenerimaanForm');
    const recvJenis = document.getElementById('recvJenis');

    if (!modal || !form) return;

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            form.reset();
            // Set default date to today
            document.getElementById('recvDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('penerimaanModalTitle').textContent = '➕ Daftar Penerimaan Alat Ganti';
            delete form.dataset.editingId;
            updateRecvItemOptions();
        });
    }

    const closeModal = () => {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        form.reset();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Filter Nama Alat Ganti based on Jenis Model
    if (recvJenis) {
        recvJenis.addEventListener('change', () => {
            updateRecvItemOptions(recvJenis.value);
        });
    }

    form.addEventListener('submit', handleAddReceivedEquipment);

    // QR Scan Placeholder
    const scanBtn = document.getElementById('scanQRBtn');
    if (scanBtn) {
        scanBtn.addEventListener('click', () => {
            const simulatedQR = "QR-" + Math.random().toString(36).substr(2, 9).toUpperCase();
            document.getElementById('recvSiri').value = simulatedQR;
            showNotification('ðŸ“· QR Scanned: ' + simulatedQR, 'info');
        });
    }

    // Import Excel Placeholder
    const importBtn = document.getElementById('importPenerimaanBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            showNotification('📥 Sila pilih fail Excel template penerimaan.', 'info');
        });
    }
}

function updateRecvItemOptions(filterJenis = null) {
    const dropdown = document.getElementById('recvItem');
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">-- Pilih Alat Ganti --</option>';

    if (!filterJenis || filterJenis === "") {
        dropdown.disabled = true;
        dropdown.style.opacity = "0.5";
        return;
    }

    dropdown.disabled = false;
    dropdown.style.opacity = "1";

    // Tarik data dari table senarai alat ganti (equipment)
    const filteredEquipment = filterJenis
        ? equipment.filter(e => e.komp1.toLowerCase() === filterJenis.toLowerCase())
        : equipment;

    const itemNames = [...new Set(filteredEquipment.map(e => e.category))];
    itemNames.sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        dropdown.appendChild(option);
    });
}

async function handleAddReceivedEquipment(e) {
    e.preventDefault();
    const form = document.getElementById('addPenerimaanForm');
    const editingId = form.dataset.editingId ? parseInt(form.dataset.editingId) : null;

    const data = {
        vendor: document.getElementById('recvVendor').value.trim(),
        jenisModel: document.getElementById('recvJenis').value,
        namaAlatGanti: document.getElementById('recvItem').value,
        namaModel: document.getElementById('recvModel').value.trim(),
        noSiri: document.getElementById('recvSiri').value.trim(),
        tarikhTerima: document.getElementById('recvDate').value,
        warranty: document.getElementById('recvWarranty').value.trim(),
        juruteknik: document.getElementById('recvTech').value,
        status: document.getElementById('recvStatus').value
    };

    if (editingId) {
        const idx = receivedItems.findIndex(item => item.id == editingId);
        if (idx > -1) {
            receivedItems[idx] = { ...receivedItems[idx], ...data };
            await turboSync('update', 'penerimaan', receivedItems[idx]);
            showNotification('✓ Rekod penerimaan dikemaskini.', 'success');
        }
    } else {
        const newItem = {
            id: receivedIdCounter++,
            ...data
        };
        receivedItems.push(newItem);
        await turboSync('create', 'penerimaan', newItem);
        showNotification('✓ Rekod penerimaan berjaya disimpan!', 'success');
    }

    displayReceivedTable();
    updateDashboard();

    // Reset form sepenuhnya selepas simpan
    form.reset();
    delete form.dataset.editingId;
    updateRecvItemOptions(); // Pastikan box Alat Ganti disekat semula
}

function displayReceivedTable() {
    const tbody = document.getElementById('penerimaanTableBody');
    if (!tbody) return;

    if (receivedItems.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="9" class="text-center">Belum ada rekod penerimaan.</td></tr>';
        return;
    }

    // Sort by latest
    const sorted = [...receivedItems].reverse();

    tbody.innerHTML = sorted.map((item, idx) => {
        const syarikatObj = syarikatList.find(s => s.namaSyarikat === item.vendor);
        const vendorDisplay = syarikatObj ? `${syarikatObj.namaSyarikat} (${syarikatObj.umsbenID})` : (item.vendor || '-');

        return `
        <tr>
            <td data-label="No">${sorted.length - idx}</td>
            <td data-label="Syarikat/Vendor"><strong>${vendorDisplay}</strong></td>
            <td data-label="Jenis">${item.jenisModel}</td>
            <td data-label="Item">${item.namaAlatGanti}</td>
            <td data-label="Model">${item.namaModel}</td>
            <td data-label="No Siri">${item.noSiri || '-'}</td>
            <td data-label="Tarikh">${item.tarikhTerima}</td>
            <td data-label="Status">
                <span class="status-badge ${getStatusClassRecv(item.status)}">
                    ${item.status}
                </span>
            </td>
            <td data-label="Tindakan">
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editReceived(${item.id})">✓ï¸</button>
                    <button class="btn btn-danger" onclick="deleteReceived(${item.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `;
    }).join('');

    // Update Dashboard Counts
    const newItems = receivedItems.filter(i => i.status === 'Belum digunakan').length;
    const usedItems = receivedItems.filter(i => i.status === 'Telah digunakan').length;

    if (document.getElementById('countNewReceived')) document.getElementById('countNewReceived').textContent = newItems;
    if (document.getElementById('countUsedReceived')) document.getElementById('countUsedReceived').textContent = usedItems;
}

function getStatusClassRecv(status) {
    if (status === 'Belum digunakan') return 'status-baru';
    if (status === 'Telah digunakan') return 'status-selesai';
    if (status === 'Rosak') return 'status-ditolak';
    return '';
}

window.editReceived = function (id) {
    const item = receivedItems.find(i => i.id == id);
    if (!item) return;

    const modal = document.getElementById('penerimaanModal');
    const form = document.getElementById('addPenerimaanForm');

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    document.getElementById('recvVendor').value = item.vendor;
    document.getElementById('recvJenis').value = item.jenisModel;
    updateRecvItemOptions(item.jenisModel);
    document.getElementById('recvItem').value = item.namaAlatGanti;
    document.getElementById('recvModel').value = item.namaModel;
    document.getElementById('recvSiri').value = item.noSiri || '';
    document.getElementById('recvDate').value = item.tarikhTerima;
    document.getElementById('recvWarranty').value = item.warranty || '';
    document.getElementById('recvTech').value = item.juruteknik;
    document.getElementById('recvStatus').value = item.status;

    form.dataset.editingId = id;
    document.getElementById('penerimaanModalTitle').textContent = '✓ï¸ Edit Penerimaan';
};

window.deleteReceived = function (id) {
    showDeleteConfirmation('Adakah anda pasti mahu memadam rekod penerimaan ini?', async () => {
        receivedItems = receivedItems.filter(i => i.id != id);
        await turboSync('delete', 'penerimaan', { id: id });
        displayReceivedTable();
        updateDashboard();
    });
};

// Local Storage Functions
function saveDataToStorage() {
    localStorage.setItem('equipment', JSON.stringify(equipment));
    localStorage.setItem('requests', JSON.stringify(requests));
    localStorage.setItem('computerList', JSON.stringify(computerList));
    localStorage.setItem('receivedItems', JSON.stringify(receivedItems));
    localStorage.setItem('syarikatList', JSON.stringify(syarikatList));
    localStorage.setItem('budget', budget);
    localStorage.setItem('budgetUsed', budgetUsed);
    localStorage.setItem('requestIdCounter', requestIdCounter);
    localStorage.setItem('equipmentIdCounter', equipmentIdCounter);
    if (typeof computerIdCounter !== 'undefined') localStorage.setItem('computerIdCounter', computerIdCounter);
    if (typeof receivedIdCounter !== 'undefined') localStorage.setItem('receivedIdCounter', receivedIdCounter);
    if (typeof syarikatIdCounter !== 'undefined') localStorage.setItem('syarikatIdCounter', syarikatIdCounter);
    localStorage.setItem('juruteknikList', JSON.stringify(juruteknikList));
    if (typeof juruteknikIdCounter !== 'undefined') localStorage.setItem('juruteknikIdCounter', juruteknikIdCounter);
}

function loadDataFromStorage() {
    try {
        equipment = JSON.parse(localStorage.getItem('equipment')) || [];
        requests = JSON.parse(localStorage.getItem('requests')) || [];
        computerList = JSON.parse(localStorage.getItem('computerList')) || [];
        receivedItems = JSON.parse(localStorage.getItem('receivedItems')) || [];
        syarikatList = JSON.parse(localStorage.getItem('syarikatList')) || [];
        budget = parseFloat(localStorage.getItem('budget')) || 0;
        budgetUsed = parseFloat(localStorage.getItem('budgetUsed')) || 0;
        requestIdCounter = parseInt(localStorage.getItem('requestIdCounter')) || 1;
        equipmentIdCounter = parseInt(localStorage.getItem('equipmentIdCounter')) || 1;
        if (localStorage.getItem('computerIdCounter')) computerIdCounter = parseInt(localStorage.getItem('computerIdCounter'));
        if (localStorage.getItem('receivedIdCounter')) receivedIdCounter = parseInt(localStorage.getItem('receivedIdCounter'));
        if (localStorage.getItem('syarikatIdCounter')) syarikatIdCounter = parseInt(localStorage.getItem('syarikatIdCounter'));

        juruteknikList = JSON.parse(localStorage.getItem('juruteknikList')) || [];
        if (localStorage.getItem('juruteknikIdCounter')) juruteknikIdCounter = parseInt(localStorage.getItem('juruteknikIdCounter'));

        updateSyarikatDropdowns();
        updateJuruteknikDropdowns();
    } catch (e) {
        console.error("Gagal memuat cache:", e);
    }
}
/**
 * TURBO SYNC ENGINE (Web Side Implementation)
 * Manages incremental updates to Google Sheets instead of bulk sync
 */
async function turboSync(action, sheet, data) {
    if (!GS_URL) return;

    const payload = {
        token: AUTH_TOKEN,
        action: action,
        sheet: sheet,
        data: data
    };

    try {
        // Gunakan 'text/plain' untuk POST supaya dianggap sebagai "simple request"
        // Ini mengelakkan isu CORS preflight (OPTIONS) yang tidak disokong oleh GAS
        await fetch(GS_URL, {
            method: 'POST',
            mode: 'no-cors', // Tetap gunakan no-cors untuk POST ke GAS
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        console.log(`🚀 TurboSync ${action} pada ${sheet} dihantar ke cloud.`);
    } catch (err) {
        console.error(`âŒ TurboSync Gagal: ${action} ${sheet}`, err);
    }
}

async function turboLoadAll() {
    if (!GS_URL) return;
    showNotification('🔄 Menghubungkan ke Turbo Engine...', 'info');

    try {
        // Gunakan mode cors dan redirect follow untuk Google Apps Script
        const fullUrl = `${GS_URL}?token=${encodeURIComponent(AUTH_TOKEN)}&action=read&sheet=all`;
        const response = await fetch(fullUrl, {
            method: 'GET',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success') {
            const cloudData = result.data;

            // Map data dari cloud ke variable local
            if (cloudData.permohonan && cloudData.permohonan.length > 0) {
                requests = cloudData.permohonan;
                requestIdCounter = Math.max(...requests.map(r => parseInt(r.id) || 0)) + 1;
            }
            if (cloudData.kategori && cloudData.kategori.length > 0) {
                equipment = cloudData.kategori;
                equipmentIdCounter = Math.max(...equipment.map(e => parseInt(e.id) || 0)) + 1;
            }
            if (cloudData.komputer && cloudData.komputer.length > 0) {
                computerList = cloudData.komputer;
                computerIdCounter = Math.max(...computerList.map(c => parseInt(c.id) || 0)) + 1;
            }
            if (cloudData.penerimaan && cloudData.penerimaan.length > 0) {
                receivedItems = cloudData.penerimaan;
                receivedIdCounter = Math.max(...receivedItems.map(p => parseInt(p.id) || 0)) + 1;
            }
            if (cloudData.syarikat && cloudData.syarikat.length > 0) {
                syarikatList = cloudData.syarikat;
                syarikatIdCounter = Math.max(...syarikatList.map(s => parseInt(s.id) || 0)) + 1;
            }
            if (cloudData.juruteknik && cloudData.juruteknik.length > 0) {
                juruteknikList = cloudData.juruteknik;
                juruteknikIdCounter = Math.max(...juruteknikList.map(j => parseInt(j.id) || 0)) + 1;
            }

            // Sync cache with cloud data after load
            saveDataToStorage();

            // Update UI selepas load
            updateDashboard();
            displayRequests();
            displayEquipmentTable();
            displayComputerTable();
            displayReceivedTable();
            displaySyarikatTable();
            displayJuruteknikTable();
            updateJuruteknikDropdowns();

            showNotification('✅ Data diselaraskan dengan Cloud Turbo.', 'success');
        } else {
            showNotification('⚠️ Cloud: ' + (result.message || 'Ralat tidak diketahui'), 'warning');
        }
    } catch (err) {
        console.error('TurboLoad Failure:', err);
        showNotification('❌ Gagal menyelaraskan dengan Cloud. Sila semak sambungan Internet atau Token.', 'warning');
    }
}


// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Equipment List Functions - Event delegation for Edit and Delete buttons
// Event listener removed to prevent conflict with inline onclick handlers
document.addEventListener('click', (e) => {
    // Keep only the listeners that are NOT handled by inline onclicks

    // Stok actions are handled by the separate listener below
});

function displayEquipmentTable(filteredEquipment = equipment) {
    const tableBody = document.getElementById('equipmentTableBody');
    if (!tableBody) return;

    const dataToDisplay = filteredEquipment && filteredEquipment.length > 0 ? filteredEquipment : equipment;

    // Update category filters
    updateCategoryFilters();

    if (dataToDisplay.length === 0) {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="10" class="text-center">Belum ada data peralatan. Tambahkan peralatan baru untuk memulai.</td></tr>';
        return;
    }
    //Colour Senarai alat ganti table dan susunan table
    tableBody.innerHTML = dataToDisplay.map((item, index) => {
        const syarikatObj = syarikatList.find(s => s.namaSyarikat === item.syarikat);
        const syarikatDisplay = syarikatObj ? `${syarikatObj.namaSyarikat} (${syarikatObj.umsbenID})` : (item.syarikat || '-');

        const statusClass = item.catit === 'Baru' ? 'status-new' : item.catit === 'Rusak' ? 'status-damage' : 'status-good';
        const badgeColor = item.quantity <= 10 ? '#f31212ff' : '#2ecc71';

        return `
        <tr data-equipment-id="${item.id}">
            <td data-label="No">${index + 1}</td>
            <td data-label="Syarikat/Vendor"><strong>${syarikatDisplay}</strong></td>
            <td data-label="Model"><strong>${item.komp1}</strong></td>
            <td data-label="Item">${item.category}</td>
            <td data-label="Jenama" style="text-align: center;">${item.namamodell}</td>
            <td data-label="Stok"><span class="badge" style="background: ${badgeColor}; color: white; padding: 5px 10px; border-radius: 4px;">${item.quantity}</span></td>
            <td data-label="Harga Unit">RM ${(item.hargaunit || 0).toFixed(2)}</td>
            <td data-label="Jumlah">RM ${(item.totalrm || 0).toFixed(2)}</td>
            <td data-label="Nota" style="text-align: center;">${item.notaganti}</td>
            <td data-label="Tindakan">
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editEquipment(${item.id})">✓ï¸ Edit</button>
                    <button class="btn btn-danger" onclick="deleteEquipment(${item.id})">🗑️ Hapus</button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function editEquipment(equipmentId) {
    const item = equipment.find(e => e.id == equipmentId);
    if (item) {
        // Fill form with equipment data
        //connect sama form new dan edit senarai alat ganti
        document.getElementById('komp11').value = item.komp1 || ''; //ganti equipmentCategory kepada ModelKategori
        document.getElementById('NamaModel').value = item.namamodell || '';//name ganti kepada namaperalatan
        document.getElementById('NamaPeralatan').value = item.category || '';
        document.getElementById('EQuantity').value = item.quantity || 1;
        document.getElementById('EHargaUnit').value = item.hargaunit || 0;
        document.getElementById('ETotalRM').value = item.totalrm || 0;
        document.getElementById('CatitAlatGanti').value = item.notaganti || '';
        document.getElementById('E_Syarikat').value = item.syarikat || '';

        // Change modal title
        document.getElementById('modalTitle').textContent = '✓ï¸ Edit Peralatan';

        // Store equipment ID for update
        const form = document.getElementById('addEquipmentForm');
        form.dataset.editingId = equipmentId;

        // Show modal
        const modal = document.getElementById('equipmentModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function deleteEquipment(equipmentId) {
    if (confirm('Apakah Anda yakin ingin menghapus peralatan ini?')) {
        equipment = equipment.filter(e => e.id != equipmentId);
        saveDataToStorage();
        displayEquipmentTable();
        updateDashboard();
        showNotification('✓ Peralatan berhasil dihapus!', 'success');
    }
}

// Initialize
function initialize() {
    updateDashboard();
}






// ----------------------------------------------------------------------------
// SENARAI KOMPUTER LOGIC (NEW SECTION)
// ----------------------------------------------------------------------------

function loadComputerData() {
    loadDataFromStorage();
}

function saveComputerData() {
    saveDataToStorage();
}

function displayComputerTable() {
    const tableBody = document.getElementById('computerTableBody');
    if (!tableBody) return;

    if (computerList.length === 0) {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="4" class="text-center">Belum ada data komputer. Tambahkan komputer baru untuk memulai.</td></tr>';
        return;
    }

    tableBody.innerHTML = computerList.map((item, index) => {
        return `
        <tr data-computer-id="${item.id}">
            <td data-label="No">${index + 1}</td>
            <td data-label="Model"><strong>${item.modelType}</strong></td>
            <td data-label="Jenama & Model">${item.brandModel}</td>
            <td data-label="Tindakan">
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editComputer(${item.id})">✓ï¸ Edit</button>
                    <button class="btn btn-danger" onclick="deleteComputer(${item.id})">🗑️ Hapus</button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function setupComputerListeners() {
    const openBtn = document.getElementById('openAddComputerForm');
    const modal = document.getElementById('computerModal');
    const closeBtn = document.getElementById('closeComputerModalBtn');
    const cancelBtn = document.getElementById('cancelComputerModalBtn');
    const form = document.getElementById('addComputerForm');

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (modal) {
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
                form.reset();
                document.getElementById('computerModalTitle').textContent = '➕ Tambah Komputer Baru';
                delete form.dataset.editingId;
            }
        });
    }

    function closeModal() {
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            form.reset();
            delete form.dataset.editingId;
        }
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    if (form) {
        form.addEventListener('submit', handleAddComputer);
    }
}

function handleAddComputer(e) {
    e.preventDefault();
    const form = document.getElementById('addComputerForm');
    const editingId = form.dataset.editingId ? parseInt(form.dataset.editingId) : null;

    const modelType = document.getElementById('komp2').value;
    const brandModel = document.getElementById('NamaPC').value.trim();

    if (!modelType || !brandModel) {
        alert("Sila isi semua maklumat yang wajib.");
        return;
    }

    if (editingId) {
        // Edit Mode
        const index = computerList.findIndex(c => c.id === editingId);
        if (index !== -1) {
            computerList[index].modelType = modelType;
            computerList[index].brandModel = brandModel;
            turboSync('update', 'komputer', computerList[index]);
            // showNotification('Data komputer dikemaskini', 'success');
        }
    } else {
        // Add Mode
        const newItem = {
            id: computerIdCounter++,
            modelType: modelType, // Desktop/Laptop
            brandModel: brandModel, // Dell Optiplex...
            dateAdded: new Date().toISOString()
        };
        computerList.push(newItem);
        turboSync('create', 'komputer', newItem);
        // showNotification('Komputer baru ditambah', 'success');
    }

    saveComputerData();
    displayComputerTable();
    updateRequestJenamaOptions();

    // Close modal
    const modal = document.getElementById('computerModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    form.reset();
    delete form.dataset.editingId;
}

window.editComputer = function (id) {
    const item = computerList.find(c => c.id === id);
    if (item) {
        document.getElementById('komp2').value = item.modelType;
        document.getElementById('NamaPC').value = item.brandModel;

        const form = document.getElementById('addComputerForm');
        form.dataset.editingId = id;

        document.getElementById('computerModalTitle').textContent = '✓ï¸ Edit Komputer';

        const modal = document.getElementById('computerModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
};

// ===== PREMIUM CONFIRMATION MODAL =====
window.showDeleteConfirmation = function (message, onConfirm) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
        <div class="modal-actions">
            <button id="cancelConfBtn" class="btn btn-secondary">Batal</button>
            <button id="confirmConfBtn" class="btn btn-primary" style="background: var(--danger); box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.4);">Hapus</button>
        </div>
    `;
    document.body.appendChild(modal);

    const close = () => {
        modal.remove();
        overlay.remove();
    };

    document.getElementById('cancelConfBtn').onclick = close;
    overlay.onclick = close;
    document.getElementById('confirmConfBtn').onclick = () => {
        onConfirm();
        close();
    };
};

window.closeConfirmationModal = function () {
    // No longer needed as handled by closure, but keep for compatibility if called elsewhere
    const modals = document.querySelectorAll('.confirm-modal, .modal-overlay');
    modals.forEach(m => m.remove());
};

// Update Delete Functions to use Custom Modal

window.deleteComputer = function (id) {
    showDeleteConfirmation('Adakah anda pasti mahu memadam komputer ini?', () => {
        computerList = computerList.filter(c => c.id !== id);
        turboSync('delete', 'komputer', { id: id });
        saveComputerData();
        displayComputerTable();
        updateRequestJenamaOptions();
    });
};


window.deleteEquipment = function (id) {
    const item = equipment.find(e => e.id == id);
    const komp1 = item ? item.komp1 : 'item ini';
    showDeleteConfirmation(`Adakah anda pasti mahu memadam "${komp1}"?`, () => {
        equipment = equipment.filter(e => e.id !== id);
        turboSync('delete', 'kategori', { id: id });
        saveDataToStorage();
        displayEquipmentTable();
        updateRequestEquipmentOptions();
    });
};

window.deleteRequest = function (id) {
    showDeleteConfirmation('Adakah anda pasti mahu memadam permohonan ini?', () => {
        requests = requests.filter(r => r.id !== id);
        turboSync('delete', 'permohonan', { id: id });
        saveDataToStorage();
        displayRequests();
    });
};

// Initialize Computer List logic on load
function setupConfirmationModalListeners() {
    // Close confirmation modal on outside click (disabled per user request)
    const confModal = document.getElementById('confirmationModal');
    if (confModal) {
        // confModal.addEventListener('click', (e) => {
        //     if (e.target === confModal) closeConfirmationModal();
        // });
    }
}

// ==========================================
// Stock Report Functions laporan stok print
// ==========================================

function generateStockReport() {
    const reportBody = document.getElementById('stockReportBody');
    if (!reportBody) return;

    // Clear existing rows
    reportBody.innerHTML = '';

    // Group equipment by model and category
    const stockData = {};

    equipment.forEach(item => {
        const key = `${item.komp1}|${item.category}`;
        if (!stockData[key]) {
            stockData[key] = {
                model: item.komp1,
                category: item.category,
                totalStock: 0,
                usage: 0
            };
        }
        stockData[key].totalStock += item.quantity || 0;
    });

    // Calculate usage from requests - match by "catat" field (Alat Ganti Dipohon)
    // and use Requestitem quantity for accurate usage tracking
    requests.forEach(req => {
        // pastikan ada item dan model
        if (req.Requestitem && req.model && req.status !== 'Ditolak') {
            Object.keys(stockData).forEach(key => {
                const [model, category] = key.split('|');

                const reqItemLower = req.Requestitem.toLowerCase().trim();
                const categoryLower = category.toLowerCase().trim();
                const reqModelLower = req.model.toLowerCase().trim();
                const modelLower = model.toLowerCase().trim();

                // Match item + model komputer, hanya kira yang tidak ditolak
                if (reqItemLower === categoryLower && reqModelLower === modelLower) {
                    stockData[key].usage += 1; // tambah 1 setiap permohonan
                }
            });
        }
    });




    // Convert to array and sort
    const reportData = Object.values(stockData).sort((a, b) => {
        if (a.model !== b.model) return a.model.localeCompare(b.model);
        return a.category.localeCompare(b.category);
    });

    if (reportData.length === 0) {
        reportBody.innerHTML = '<tr class="empty-row"><td colspan="7" class="text-center">Tiada data untuk dipaparkan.</td></tr>';
        document.getElementById('stockSummaryCards').style.display = 'none';
        return;
    }

    // Calculate summary statistics
    let totalItems = reportData.length;
    let criticalStock = 0;
    let healthyStock = 0;

    // Generate table rows
    reportData.forEach((item, index) => {
        const balance = item.totalStock - item.usage;
        const usagePercent = item.totalStock > 0 ? ((item.usage / item.totalStock) * 100).toFixed(1) : 0;

        // Count stock health
        if (usagePercent > 80) criticalStock++;
        else if (usagePercent < 50) healthyStock++;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.model}</td>
            <td>${item.category}</td>
            <td>${item.totalStock}</td>
            <td>${item.usage}</td>
            <td>${balance}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="flex: 1; background: #e0e0e0; border-radius: 10px; height: 20px; overflow: hidden;">
                        <div style="width: ${usagePercent}%; background: ${usagePercent > 80 ? '#e74c3c' : usagePercent > 50 ? '#f39c12' : '#27ae60'}; height: 100%;"></div>
                    </div>
                    <span style="min-width: 50px; text-align: right;">${usagePercent}%</span>
                </div>
            </td>
        `;
        reportBody.appendChild(row);
    });

    // Update summary cards
    document.getElementById('totalItemsCount').textContent = totalItems;
    document.getElementById('criticalStockCount').textContent = criticalStock;
    document.getElementById('healthyStockCount').textContent = healthyStock;
    document.getElementById('stockSummaryCards').style.display = 'grid';

    showNotification('✓ Laporan stok berjaya dijana!', 'success');
}

function printStockReport() {
    const reportTable = document.getElementById('stockReportTable');
    const summaryCards = document.getElementById('stockSummaryCards');

    if (!reportTable || reportTable.querySelector('.empty-row')) {
        showNotification('⚠️ Sila jana laporan terlebih dahulu!', 'warning');
        return;
    }

    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString('ms-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Laporan Stok - ${currentDate}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #005a9e;
                    padding-bottom: 15px;
                }
                .header h1 {
                    margin: 0;
                    color: #005a9e;
                    font-size: 24px;
                }
                .header p {
                    margin: 5px 0;
                    color: #666;
                }
                .summary {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-bottom: 25px;
                }
                .summary-card {
                    border: 2px solid #ddd;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }
                .summary-card h3 {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    color: #666;
                }
                .summary-card .value {
                    font-size: 28px;
                    font-weight: bold;
                    color: #005a9e;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 10px;
                    text-align: left;
                }
                th {
                    background-color: #005a9e;
                    color: white;
                    font-weight: bold;
                }
                tr:nth-child(even) {
                    background-color: #f4e5e5ff;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #999;
                }
                @media print {
                    body { padding: 10px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ðŸ“Š LAPORAN STOK ALAT GANTI</h1>
                <p>Sistem Pengurusan Inventori Dan Kewangan</p>
                <p>Tarikh: ${currentDate}</p>
            </div>

            <div class="summary">
                <div class="summary-card">
                    <h3>📦 Jumlah Item</h3>
                    <div class="value">${document.getElementById('totalItemsCount').textContent}</div>
                </div>
                <div class="summary-card">
                    <h3>⚠️ Stok Kritikal</h3>
                    <div class="value">${document.getElementById('criticalStockCount').textContent}</div>
                </div>
                <div class="summary-card">
                    <h3>✓… Stok Mencukupi</h3>
                    <div class="value">${document.getElementById('healthyStockCount').textContent}</div>
                </div>
            </div>

            ${reportTable.outerHTML}

            <div class="footer">
                <p>Â© 2026 Dashboard Alat Ganti Komputer | Sistem Pengurusan Inventori Alat Ganti Komputer | Dicetak pada ${new Date().toLocaleString('ms-MY')}</p>
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

function setupStockReportListeners() {
    const refreshBtn = document.getElementById('refreshStockReportBtn');
    const printBtn = document.getElementById('printStockReportBtn');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', generateStockReport);
    }

    if (printBtn) {
        printBtn.addEventListener('click', printStockReport);
    }
}

//login page script

// LOGIN handled by Firebase in index.html


// ===== SESSION CHECK =====
if (window.location.pathname.endsWith("dashboard.html")) {
    if (sessionStorage.getItem("loggedIn") !== "true") {
        if (window.location.pathname.includes("/Dashboard/")) {
            window.location.href = "../index.html";
        } else {
            window.location.href = "index.html";
        }
    }
}

// ===== AUTO LOGOUT + REMINDER =====
let timeoutReminder, autoLogout;
const timeoutLimit = 10 * 60 * 1000; // 10 minit
const reminderTime = 9 * 60 * 1000;  // 1 minit sebelum logout

// Popup reminder toast
const timeoutReminderDiv = document.createElement('div');
timeoutReminderDiv.className = 'timeout-toast';
timeoutReminderDiv.style.display = 'none';
timeoutReminderDiv.innerHTML = `
    <i class="fas fa-clock"></i>
    <span>Sesi anda akan berakhir dalam 1 minit kerana tiada aktiviti.</span>
    <button id="stayLoggedIn" class="btn-stay">Kekal Log Masuk</button>
`;
document.body.appendChild(timeoutReminderDiv);

function resetIdleTimer() {
    clearTimeout(timeoutReminder);
    clearTimeout(autoLogout);
    timeoutReminderDiv.style.display = 'none';
    startIdleTimer();
}

function startIdleTimer() {
    timeoutReminder = setTimeout(() => {
        timeoutReminderDiv.style.display = 'flex';
    }, reminderTime);

    autoLogout = setTimeout(() => {
        sessionStorage.removeItem("loggedIn");
        const loginUrl = window.location.pathname.includes("/Dashboard/") ? "../index.html" : "index.html";
        window.location.href = loginUrl;
    }, timeoutLimit);
}

['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetIdleTimer, false);
});

const stayBtn = document.getElementById('stayLoggedIn');
if (stayBtn) {
    stayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        timeoutReminderDiv.style.display = 'none';
        resetIdleTimer();
    });
}
startIdleTimer();

// ===== LOGOUT CONFIRMATION =====
const handleLogout = (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Create Overlay
    const overlayDiv = document.createElement('div');
    overlayDiv.className = 'modal-overlay';
    document.body.appendChild(overlayDiv);

    // Create Confirm Modal
    const confirmDiv = document.createElement('div');
    confirmDiv.className = 'confirm-modal';
    confirmDiv.innerHTML = `
        <i class="fas fa-sign-out-alt"></i>
        <p>Adakah anda pasti mahu menamatkan sesi ini?</p>
        <div class="modal-actions">
            <button id="cancelLogoutBtn" class="btn btn-secondary">Batal</button>
            <button id="confirmLogoutBtn" class="btn btn-primary" style="background: var(--danger); box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.4);">Log Keluar</button>
        </div>
    `;
    document.body.appendChild(confirmDiv);

    const closeModal = () => {
        confirmDiv.remove();
        overlayDiv.remove();
    };

    const cancelBtn = document.getElementById('cancelLogoutBtn');
    const confirmBtn = document.getElementById('confirmLogoutBtn');

    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (overlayDiv) overlayDiv.addEventListener('click', closeModal);

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            sessionStorage.removeItem("loggedIn");
            const loginUrl = window.location.pathname.includes("/Dashboard/") ? "../index.html" : "index.html";
            window.location.href = loginUrl;
        });
    }
};

const logoutBtn = document.getElementById('logoutBtn');
const logoutBtnHeader = document.getElementById('logoutBtnHeader');

if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
if (logoutBtnHeader) logoutBtnHeader.addEventListener('click', handleLogout);


// ==========================================
// SYARIKAT / VENDOR MANAGEMENT
// ==========================================

function setupSyarikatListeners() {
    const modal = document.getElementById('syarikatModal');
    const openBtn = document.getElementById('openAddSyarikatForm');
    const closeBtn = document.getElementById('closeSyarikatModal');
    const cancelBtn = document.getElementById('cancelSyarikatBtn');
    const form = document.getElementById('syarikatForm');

    if (!modal || !form) return;

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            form.reset();
            document.getElementById('syarikatModalTitle').textContent = '➕ Daftar Syarikat Baru';
            delete form.dataset.editingId;
        });
    }

    const closeModal = () => {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        form.reset();
        delete form.dataset.editingId;
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    form.addEventListener('submit', handleSyarikatForm);
}

function handleSyarikatForm(e) {
    e.preventDefault();
    const form = e.target;
    const editingId = form.dataset.editingId ? parseInt(form.dataset.editingId) : null;

    const data = {
        umsbenID: document.getElementById('syarikatID').value.trim(),
        namaSyarikat: document.getElementById('syarikatNama').value.trim(),
        namaPemilik: document.getElementById('syarikatPemilik').value.trim(),
        status: document.getElementById('syarikatStatus').value,
        tarikhMula: document.getElementById('syarikatMula').value,
        tarikhAkhir: document.getElementById('syarikatAkhir').value,
        bajet: parseFloat(document.getElementById('syarikatBajet').value) || 0
    };

    if (editingId) {
        // Edit Mode
        const idx = syarikatList.findIndex(s => s.id === editingId);
        if (idx > -1) {
            syarikatList[idx] = { ...syarikatList[idx], ...data };
            turboSync('update', 'syarikat', syarikatList[idx]);
            showNotification('✓ Maklumat syarikat dikemaskini.', 'success');
        }
    } else {
        // Add Mode
        const newItem = {
            id: syarikatIdCounter++,
            ...data
        };
        syarikatList.push(newItem);
        turboSync('create', 'syarikat', newItem);
        showNotification('✓ Syarikat berjaya didaftarkan!', 'success');
    }

    saveDataToStorage();
    displaySyarikatTable();
    updateSyarikatDropdowns();

    // Close modal
    const modal = document.getElementById('syarikatModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    form.reset();
    delete form.dataset.editingId;
}

function displaySyarikatTable() {
    const tbody = document.getElementById('syarikatTableBody');
    if (!tbody) return;

    if (syarikatList.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8" class="text-center">Belum ada data syarikat.</td></tr>';
        return;
    }

    // Sort by name
    const sorted = [...syarikatList].sort((a, b) => a.namaSyarikat.localeCompare(b.namaSyarikat));

    tbody.innerHTML = sorted.map((item, idx) => `
        <tr>
            <td data-label="No">${idx + 1}</td>
            <td data-label="ID UMSBEN">${item.umsbenID}</td>
            <td data-label="Syarikat"><strong>${item.namaSyarikat}</strong></td>
            <td data-label="Pemilik">${item.namaPemilik}</td>
            <td data-label="Kontrak">${item.tarikhMula} - ${item.tarikhAkhir}</td>
            <td data-label="Status">
                <span class="status-badge ${item.status === 'Aktif' ? 'status-selesai' : 'status-ditolak'}">
                    ${item.status}
                </span>
            </td>
            <td data-label="Bajet">RM ${item.bajet.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</td>
            <td data-label="Tindakan">
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editSyarikat(${item.id})">✓ï¸</button>
                    <button class="btn btn-danger" onclick="deleteSyarikat(${item.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.editSyarikat = function (id) {
    const item = syarikatList.find(s => s.id === id);
    if (!item) return;

    const modal = document.getElementById('syarikatModal');
    const form = document.getElementById('syarikatForm');

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    document.getElementById('syarikatID').value = item.umsbenID;
    document.getElementById('syarikatNama').value = item.namaSyarikat;
    document.getElementById('syarikatPemilik').value = item.namaPemilik;
    document.getElementById('syarikatStatus').value = item.status;
    document.getElementById('syarikatMula').value = item.tarikhMula;
    document.getElementById('syarikatAkhir').value = item.tarikhAkhir;
    document.getElementById('syarikatBajet').value = item.bajet;

    form.dataset.editingId = id;
    document.getElementById('syarikatModalTitle').textContent = '✓ï¸ Edit Maklumat Syarikat';
};

window.deleteSyarikat = function (id) {
    const item = syarikatList.find(s => s.id === id);
    if (!item) return;

    showDeleteConfirmation(`Adakah anda pasti mahu memadam "${item.namaSyarikat}"?`, () => {
        syarikatList = syarikatList.filter(s => s.id !== id);
        turboSync('delete', 'syarikat', { id: id });
        saveDataToStorage();
        displaySyarikatTable();
    });
};

function updateSyarikatDropdowns() {
    const dropdowns = ['E_Syarikat', 'recvVendor'];
    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">-- Pilih Syarikat --</option>';

        syarikatList.forEach(s => {
            const option = document.createElement('option');
            option.value = s.namaSyarikat;
            option.textContent = `${s.namaSyarikat} (${s.umsbenID})`;
            select.appendChild(option);
        });

        if (currentValue) select.value = currentValue;
    });
}

// ==========================================
// JURUTEKNIK MANAGEMENT
// ==========================================

function setupJuruteknikListeners() {
    const modal = document.getElementById('juruteknikModal');
    const openBtn = document.getElementById('openAddJuruteknikForm');
    const closeBtn = document.getElementById('closeJuruteknikModal');
    const cancelBtn = document.getElementById('cancelJuruteknikBtn');
    const form = document.getElementById('juruteknikForm');

    if (!modal || !form) return;

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            form.reset();
            document.getElementById('juruteknikModalTitle').textContent = '➕ Daftar Juruteknik Baru';
            delete form.dataset.editingId;
        });
    }

    const closeModal = () => {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        form.reset();
        delete form.dataset.editingId;
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    // modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); }); // Disabled close on outside click so form stays open

    form.addEventListener('submit', handleJuruteknikForm);
}

function handleJuruteknikForm(e) {
    e.preventDefault();
    const form = e.target;
    const editingId = form.dataset.editingId ? parseInt(form.dataset.editingId) : null;

    const data = {
        nama: document.getElementById('juruteknikNama').value.trim(),
        email: document.getElementById('juruteknikEmail').value.trim()
    };

    if (editingId) {
        const idx = juruteknikList.findIndex(j => j.id === editingId);
        if (idx > -1) {
            juruteknikList[idx] = { ...juruteknikList[idx], ...data };
            turboSync('update', 'juruteknik', juruteknikList[idx]);
            showNotification('✓ Maklumat juruteknik dikemaskini.', 'success');
        }
    } else {
        const newItem = {
            id: juruteknikIdCounter++,
            ...data
        };
        juruteknikList.push(newItem);
        turboSync('create', 'juruteknik', newItem);
        showNotification('✓ Juruteknik berjaya didaftarkan!', 'success');
    }

    saveDataToStorage();
    displayJuruteknikTable();
    updateJuruteknikDropdowns();

    const modal = document.getElementById('juruteknikModal');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    form.reset();
    delete form.dataset.editingId;
}

function displayJuruteknikTable() {
    const tbody = document.getElementById('juruteknikTableBody');
    if (!tbody) return;

    if (juruteknikList.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="4" class="text-center">Belum ada data juruteknik.</td></tr>';
        return;
    }

    const sorted = [...juruteknikList].sort((a, b) => a.nama.localeCompare(b.nama));

    tbody.innerHTML = sorted.map((item, idx) => `
        <tr>
            <td data-label="No">${idx + 1}</td>
            <td data-label="Nama Juruteknik"><strong>${item.nama}</strong></td>
            <td data-label="Email">${item.email}</td>
            <td data-label="Tindakan">
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editJuruteknik(${item.id})">✓ï¸</button>
                    <button class="btn btn-danger" onclick="deleteJuruteknik(${item.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.editJuruteknik = function (id) {
    const item = juruteknikList.find(j => j.id === id);
    if (!item) return;

    const modal = document.getElementById('juruteknikModal');
    const form = document.getElementById('juruteknikForm');

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    document.getElementById('juruteknikNama').value = item.nama;
    document.getElementById('juruteknikEmail').value = item.email;

    form.dataset.editingId = id;
    document.getElementById('juruteknikModalTitle').textContent = '✓ï¸ Edit Maklumat Juruteknik';
};

window.deleteJuruteknik = function (id) {
    const item = juruteknikList.find(j => j.id === id);
    if (!item) return;

    showDeleteConfirmation(`Adakah anda pasti mahu memadam "${item.nama}"?`, () => {
        juruteknikList = juruteknikList.filter(j => j.id !== id);
        turboSync('delete', 'juruteknik', { id: id });
        saveDataToStorage();
        displayJuruteknikTable();
        updateJuruteknikDropdowns();
    });
};

function updateJuruteknikDropdowns() {
    const dropdowns = ['reqJuruteknik', 'recvTech'];
    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">-- Pilih Juruteknik --</option>';

        juruteknikList.forEach(j => {
            const option = document.createElement('option');
            option.value = j.nama;
            option.textContent = j.nama;
            select.appendChild(option);
        });

        if (currentValue) select.value = currentValue;
    });
}
