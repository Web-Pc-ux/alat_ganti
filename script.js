// Data Store
let equipment = [];
let equipmentIdCounter = 1;
let requests = [];
let requestIdCounter = 1;
let budget = 0;
let budgetUsed = 0;
let Admin = 0;
let stok = {};

// Load data from localStorage on page load
window.addEventListener('DOMContentLoaded', () => {
    // Data Loading
    loadDataFromStorage();
    loadComputerData();

    // UI Initialization
    updateDashboard();
    Dashboardtest();
    updateBudgetDisplay();
    displayRequests();
    displayEquipmentTable();
    displayComputerTable();
    updateRequestJenamaOptions();
    updateRequestEquipmentOptions();

    // Event listeners
    setupEventListeners();
    setupEquipmentListeners();
    setupComputerListeners();
    setupImportListeners();
    setupRequestModalListeners();
    setupStokListeners();
    setupConfirmationModalListeners();
    setupReportListeners();
    setupStockReportListeners();

    // Restore last active section
    const lastSection = localStorage.getItem('activeSection') || 'dashboard';
    showSection(lastSection);
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

    // Close on outside click
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

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

    if (!openReqBtn || !modal || !form || !modelSelect || !statusSelect) return;

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
    });

    // Add change listener for dynamic filtering
    modelSelect.addEventListener('change', () => {
        const selectedModel = modelSelect.value;
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
    modal.addEventListener('click', (e) => { if (e.target === modal) closeRequestModal(); });

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
            showNotification('✓ Peralatan berhasil diubah!', 'success');
        }
    } else {
        // Add new equipment
        const newEquipment = {
            id: equipmentIdCounter++,
            ...equipmentData
        };
        equipment.push(newEquipment);
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
        showNotification('⚠️ Pilih fail CSV terlebih dahulu.', 'warning');
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
    if (!file) { showNotification('⚠️ Pilih fail terlebih dahulu.', 'warning'); return; }
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
                showNotification('⚠️ Gagal memproses file XLSX.', 'warning');
            }
        };
        reader.readAsArrayBuffer(file);
        return;
    }
    showNotification('⚠️ Format file tidak disokong.', 'warning');
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

function addRequest({ cust, model, catat, status = 'Baru' }) {
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
            <td>${idx + 1}</td>
            <td>${r.cust}</td>
            <td>${r.model}</td>
            <td>${r.jenama}</td>
            <td>${r.nosiri}</td>
            <td>${r.Requestitem}</td>
            <td>${r.nosiriganti}</td>

            <td>
                <span class="status-badge ${getStatusClass(r.status)}">
                    ${r.status}
                </span>
            </td>

            <td>${r.juruteknik}</td>
            <td>${r.catat}</td>
            <td>${r.date}</td>
            <td>${r.dateend}</td>
            <td>
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
    document.getElementById('requestModalTitle').textContent = '✏️ Edit Permohonan';
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
        });
    });

    // Open Add Item button inside Inventory section


    // Burger menu toggle (mobile)
    const burgerBtn = document.querySelector('.burger-btn');
    const burgerList = document.getElementById('burgerList');
    if (burgerBtn && burgerList) {
        burgerBtn.addEventListener('click', () => {
            burgerList.classList.toggle('open');
            const open = burgerList.classList.contains('open');
            burgerList.setAttribute('aria-hidden', String(!open));
        });

        document.querySelectorAll('.burger-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                showSection(sectionId);
                burgerList.classList.remove('open');
                burgerList.setAttribute('aria-hidden', 'true');
            });
        });

        // Close burger if click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navbar')) {
                burgerList.classList.remove('open');
                burgerList.setAttribute('aria-hidden', 'true');
            }
        });
    }
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
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active-section');
    });

    // Show target section
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active-section'), 10);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update Navigation Active State
    document.querySelectorAll('.nav-link, .burger-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
        }
    });

    // Save state
    localStorage.setItem('activeSection', sectionId);
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
    if (val <= 0) { showNotification('⚠️ Masukkan jumlah yang sah.', 'warning'); return; }
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

    const newSize = Math.max(6, currentSize + delta);
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
        showNotification('⚠️ Tiada data permohonan "Dalam Proses" untuk laporan.', 'warning');
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
                <div class="report-title" contenteditable="true">Borang Permohonan Alat ganti bagi tujuan penyelenggaraan computer</div>
                <div class="report-subtitle" contenteditable="true">Pembekal dilantik : RONY SDN BHD</div>
    `;

    // Use saved signatures or default
    const signatureHTML = reportSettings.customSignatureHTML || `
                <div class="signature-block">
                    <div>Disediakan oleh</div>
                    <div class="signature-line"></div>
                    <div class="signature-details">
                        <span>Nama: </span>
                        <span>Jawatan: </span>
                        <span>Cop: </span>
                        <span>Tarikh: </span>
                    </div>
                </div>
                <div class="signature-block">
                    <div>Disemak oleh</div>
                    <div class="signature-line"></div>
                    <div class="signature-details">
                        <span>Nama: </span>
                        <span>Jawatan: </span>
                        <span>Cop: </span>
                        <span>Tarikh: </span>
                    </div>
                </div>
                <div class="signature-block">
                    <div>Disahkan oleh</div>
                    <div class="signature-line"></div>
                    <div class="signature-details">
                        <span>Nama: </span>
                        <span>Jawatan: </span>
                        <span>Cop: </span>
                        <span>Tarikh: </span>
                    </div>
                </div>
    `;

    editableArea.innerHTML = `
        <div class="report-page" style="font-size: ${reportSettings.baseFontSize}pt; font-family: ${reportSettings.fontFamily}; line-height: ${reportSettings.lineHeight}">
            <div class="report-header">
                ${headerHTML}
            </div>

            <div class="report-info">MAKLUMAT PERMOHONAN ALAT GANTI</div>

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
                            <td colspan="0" class="text-right">Jumlah</td>
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
                            <td colspan="0" class="text-right">Jumlah</td>
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
                            <td colspan="0" class="text-right">Jumlah</td>
                            <td class="text-right">RM ${resC.totalPrice.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>` : ''}

            <div class="report-grand-total">
                <table class="report-table" style="margin-bottom:0; border:none;">
                    <tr style="border:none;">
                        <td style="border:none; font-weight:bold;" width="60%">JUMLAH KUANTITI BAGI JADUAL A, B, DAN C</td>
                        <td style="border:none; font-weight:bold; text-align:center;" width="10%">${grandTotalQty}</td>
                        <td style="border:none; font-weight:bold;" width="15%">JUMLAH HARGA BAGI A, B, DAN C</td>
                        <td style="border:none; font-weight:bold; text-align:right;" width="15%">RM ${grandTotalPrice.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-top:30px; border-top:1px dashed #ccc; padding-top:10px; font-size:9pt; text-align:center; color:#666;">
                -- BAHAGIAN DIGITAL SIGN --
            </div>

            <div class="report-signature-container">
                ${signatureHTML}
            </div>
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
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#2ecc71' : type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Local Storage Functions
// Local Storage Functions
function saveDataToStorage() {
    // Inventory removed
    localStorage.setItem('equipment', JSON.stringify(equipment));
    localStorage.setItem('equipmentIdCounter', equipmentIdCounter.toString());
    localStorage.setItem('requests', JSON.stringify(requests));
    localStorage.setItem('requestIdCounter', requestIdCounter.toString());
    localStorage.setItem('budget', budget.toString());
    localStorage.setItem('budgetUsed', budgetUsed.toString());
    localStorage.setItem('stok', JSON.stringify(stok));
}

function loadDataFromStorage() {

    const storedEquipment = localStorage.getItem('equipment');
    const storedEquipmentCounter = localStorage.getItem('equipmentIdCounter');


    if (storedEquipment) {
        equipment = JSON.parse(storedEquipment);
    }
    if (storedEquipmentCounter) {
        equipmentIdCounter = parseInt(storedEquipmentCounter);
    }

    const storedRequests = localStorage.getItem('requests');
    const storedRequestCounter = localStorage.getItem('requestIdCounter');
    if (storedRequests) {
        try { requests = JSON.parse(storedRequests); } catch (e) { requests = []; }
    }
    if (storedRequestCounter) {
        requestIdCounter = parseInt(storedRequestCounter);
    }

    const storedBudget = localStorage.getItem('budget');
    const storedBudgetUsed = localStorage.getItem('budgetUsed');
    if (storedBudget) budget = parseFloat(storedBudget) || 0;
    if (storedBudgetUsed) budgetUsed = parseFloat(storedBudgetUsed) || 0;

    const storedStok = localStorage.getItem('stok');
    if (storedStok) {
        try { stok = JSON.parse(storedStok); } catch (e) { stok = {}; }
    }

    // ensure inventory items have used field


    // Initialize with sample data if empty
    if (equipment.length === 0) {
        initializeSampleData();
    }
}
//DALAM SENARAI ALAT GANTI TABLE
// Initialize sample equipment data
function initializeSampleData() {
    const sampleEquipment = [

    ];

    equipment = sampleEquipment;
    saveDataToStorage();
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
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="7" class="text-center">Belum ada data peralatan. Tambahkan peralatan baru untuk memulai.</td></tr>';
        return;
    }
    //Colour Senarai alat ganti table dan susunan table
    tableBody.innerHTML = dataToDisplay.map((item, index) => {
        const statusClass = item.catit === 'Baru' ? 'status-new' : item.catit === 'Rusak' ? 'status-damage' : 'status-good';
        const badgeColor = item.quantity <= 10 ? '#f31212ff' : '#2ecc71';  //kuantiti sebenar colour

        return `
        <tr data-equipment-id="${item.id}">
            <td>${index + 1}</td>
            
            <td><strong>${item.komp1}</strong></td>
            <td>${item.category}</td>
            <td style="text-align: center; font-size: 1.5rem;">${item.namamodell}</td>
            <td><span class="badge" style="background: ${badgeColor}; color: white; padding: 5px 10px; border-radius: 4px;">${item.quantity}</span></td>
            <td>RM ${(item.hargaunit || 0).toFixed(2)}</td>
            <td>RM ${(item.totalrm || 0).toFixed(2)}</td>
            <td style="text-align: center; font-size: 1.5rem;">${item.notaganti}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editEquipment(${item.id})">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deleteEquipment(${item.id})">🗑️ Hapus</button>
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

        // Change modal title
        document.getElementById('modalTitle').textContent = '✏️ Edit Peralatan';

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





//----------------------------------------------------------------------

//bahagian contoh kira

function Dashboardtest() {
    const cardContainer = document.getElementById("stokCards");
    const tableBody = document.getElementById("stokTable");
    const totalEl = document.getElementById("jumlahKeseluruhan");

    let total = 0;



    // buang card item lama (kekalkan card total)
    if (cardContainer) {
        cardContainer.querySelectorAll(".item-card").forEach(card => card.remove());
    }
    if (tableBody) tableBody.innerHTML = "";

    for (const item in stok) {
        total += stok[item];

        // CARD ITEM
        if (cardContainer) {
            const card = document.createElement("div");
            card.className = "card item-card";
            card.innerHTML = `
          <h3>${item}</h3>
          <p>${stok[item]}</p>
          <p>${stok[item]}</p>
        `;
            cardContainer.appendChild(card);
        }

        // TABLE
        // Use data-stok-item attribute and specific classes for event delegation
        if (tableBody) {
            tableBody.innerHTML += `
          <tr data-stok-item="${item.replace(/"/g, '&quot;')}">
            <td>${item}</td>
            <td>${stok[item]}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit btn-edit-stok">✏️</button>
                    <button class="btn btn-danger btn-delete-stok">🗑️</button>
                </div>
            </td>
          </tr>
        `;
        }
    }

    // UPDATE TOTAL
    totalEl.textContent = total;
}

// New Event Listener for Stok Actions
document.addEventListener('click', (e) => {
    // Edit Stok
    if (e.target.closest('.btn-edit-stok')) {
        const button = e.target.closest('.btn-edit-stok');
        const row = button.closest('tr');
        const item = row.dataset.stokItem;
        if (item) editStok(item);
    }
    // Delete Stok
    if (e.target.closest('.btn-delete-stok')) {
        const button = e.target.closest('.btn-delete-stok');
        const row = button.closest('tr');
        const item = row.dataset.stokItem;
        if (item) deleteStok(item);
    }
});

// Edit Stok Function
window.editStok = function (item) {
    const qty = stok[item];
    const form = document.getElementById("tambahstok");

    document.getElementById("item").value = item;
    document.getElementById("kuantiti").value = qty;

    // Set editing state
    form.dataset.editingItem = item;

    // Change UI to Edit Mode
    document.querySelector("#stokForm h2").textContent = "✏️ Edit Stok";
    const submitBtn = document.querySelector("#tambahstok button[type='submit']");
    submitBtn.textContent = "Simpan Perubahan"; // Update button text
    // Store original text
    if (!submitBtn.dataset.originalText) {
        submitBtn.dataset.originalText = "💾 Simpan stok";
    }

    const modal = document.getElementById("stokForm");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
};

// Delete Stok Function
window.deleteStok = function (item) {
    if (confirm(`Adakah anda pasti mahu memadam stok "${item}"?`)) {
        delete stok[item];
        saveDataToStorage();
        Dashboardtest();
        // showNotification('✓ Stok dipadam.', 'success'); // Optional if notification system is available globally
    }
};

function resetStokForm() {
    const form = document.getElementById("tambahstok");
    form.reset();
    delete form.dataset.editingItem;

    document.querySelector("#stokForm h2").textContent = "➕ Tambah Stok";
    const submitBtn = document.querySelector("#tambahstok button[type='submit']");
    if (submitBtn.dataset.originalText) {
        submitBtn.textContent = submitBtn.dataset.originalText;
    } else {
        submitBtn.textContent = "💾 Simpan stok";
    }

    const modal = document.getElementById("stokForm");
    modal.classList.remove("show");
    modal.style.display = ""; // ensuring clean state
    document.body.style.overflow = "auto";
}


function setupStokListeners() {
    // BUKA MODAL
    const openBtn = document.getElementById("openRequestForm1");
    if (openBtn) {
        openBtn.addEventListener("click", () => {
            const modal = document.getElementById("stokForm");
            modal.classList.add("show");
            document.body.style.overflow = "hidden";
        });
    }

    // TUTUP MODAL
    const closeBtn = document.getElementById("closeRequestModal1");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            resetStokForm();
        });
    }

    const cancelBtn = document.getElementById("cancelRequestBtn1");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            resetStokForm();
        });
    }

    // submit form tambah stok
    const form = document.getElementById("tambahstok");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const itemInput = document.getElementById("item");
            const qtyInput = document.getElementById("kuantiti");
            const item = itemInput.value.trim();
            const qty = parseInt(qtyInput.value);

            if (!item || isNaN(qty)) {
                alert("Sila isi semua maklumat dengan betul.");
                return;
            }

            const editingItem = this.dataset.editingItem;

            if (editingItem) {
                // EDIT MODE
                if (editingItem !== item) {
                    delete stok[editingItem];
                }
                stok[item] = qty;
            } else {
                // ADD MODE
                if (!stok[item]) stok[item] = 0;
                stok[item] += qty;
            }

            saveDataToStorage();
            Dashboardtest();
            resetStokForm();
        });
    }
}

//end of kira

// ----------------------------------------------------------------------------
// SENARAI KOMPUTER LOGIC (NEW SECTION)
// ----------------------------------------------------------------------------

let computerList = [];
let computerIdCounter = 1;

function loadComputerData() {
    const storedComputers = localStorage.getItem('computer_list');
    const storedCounter = localStorage.getItem('computerIdCounter');

    if (storedComputers) {
        try { computerList = JSON.parse(storedComputers); } catch (e) { computerList = []; }
    }

    if (storedCounter) {
        computerIdCounter = parseInt(storedCounter);
    }
}

function saveComputerData() {
    localStorage.setItem('computer_list', JSON.stringify(computerList));
    localStorage.setItem('computerIdCounter', computerIdCounter.toString());
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
            <td>${index + 1}</td>
            <td><strong>${item.modelType}</strong></td>
            <td>${item.brandModel}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editComputer(${item.id})">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deleteComputer(${item.id})">🗑️ Hapus</button>
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

        document.getElementById('computerModalTitle').textContent = '✏️ Edit Komputer';

        const modal = document.getElementById('computerModal');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
};

// Custom Delete Confirmation Modal Logic
let deleteCallback = null;

window.showDeleteConfirmation = function (message, onConfirm) {
    const modal = document.getElementById('confirmationModal');
    const msgElement = document.getElementById('confirmationMessage');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    if (modal && msgElement && confirmBtn) {
        msgElement.textContent = message;
        deleteCallback = onConfirm;

        // Clean up previous event listeners (simple approach)
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.addEventListener('click', () => {
            if (deleteCallback) deleteCallback();
            closeConfirmationModal();
        });

        modal.classList.add('show');
    } else {
        // Fallback if modal elements missing
        if (confirm(message)) onConfirm();
    }
};

window.closeConfirmationModal = function () {
    const modal = document.getElementById('confirmationModal');
    if (modal) modal.classList.remove('show');
    deleteCallback = null;
};

// Update Delete Functions to use Custom Modal

window.deleteComputer = function (id) {
    showDeleteConfirmation('Adakah anda pasti mahu memadam komputer ini?', () => {
        computerList = computerList.filter(c => c.id !== id);
        saveComputerData();
        displayComputerTable();
        updateRequestJenamaOptions();
    });
};

window.deleteStok = function (item) {
    showDeleteConfirmation(`Adakah anda pasti mahu memadam stok "${item}"?`, () => {
        delete stok[item];
        saveDataToStorage();
        Dashboardtest();
    });
};

window.deleteEquipment = function (id) {
    const item = equipment.find(e => e.id == id);
    const komp1 = item ? item.komp1 : 'item ini';
    showDeleteConfirmation(`Adakah anda pasti mahu memadam "${komp1}"?`, () => {
        equipment = equipment.filter(e => e.id !== id);
        saveDataToStorage();
        displayEquipmentTable();
        updateRequestEquipmentOptions();
    });
};

window.deleteRequest = function (id) {
    showDeleteConfirmation('Adakah anda pasti mahu memadam permohonan ini?', () => {
        requests = requests.filter(r => r.id !== id);
        saveDataToStorage();
        displayRequests();
    });
};

// Initialize Computer List logic on load
function setupConfirmationModalListeners() {
    // Close confirmation modal on outside click
    const confModal = document.getElementById('confirmationModal');
    if (confModal) {
        confModal.addEventListener('click', (e) => {
            if (e.target === confModal) closeConfirmationModal();
        });
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
        showNotification('⚠️ Sila jana laporan terlebih dahulu!', 'warning');
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
                <h1>📊 LAPORAN STOK ALAT GANTI</h1>
                <p>Sistem Pengurusan Inventori Dan Kewangan</p>
                <p>Tarikh: ${currentDate}</p>
            </div>

            <div class="summary">
                <div class="summary-card">
                    <h3>📦 Jumlah Item</h3>
                    <div class="value">${document.getElementById('totalItemsCount').textContent}</div>
                </div>
                <div class="summary-card">
                    <h3>⚠️ Stok Kritikal</h3>
                    <div class="value">${document.getElementById('criticalStockCount').textContent}</div>
                </div>
                <div class="summary-card">
                    <h3>✅ Stok Mencukupi</h3>
                    <div class="value">${document.getElementById('healthyStockCount').textContent}</div>
                </div>
            </div>

            ${reportTable.outerHTML}

            <div class="footer">
                <p>© 2026 Dashboard Alat Ganti Komputer | Dicetak pada ${new Date().toLocaleString('ms-MY')}</p>
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

// LOGIN FUNCTION
// ===== LOGIN =====
// ===== LOGIN =====
const loginForm = document.getElementById('loginForm');
const loadingOverlay = document.getElementById('loadingOverlay');

function showLoader() {
    loadingOverlay.style.display = 'flex';
}

function hideLoader() {
    loadingOverlay.style.display = 'none';
}

if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        showLoader();

        setTimeout(() => {
            hideLoader();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            // Ambil user dari localStorage
            fetch("data/users.json")
                .then(res => res.json())
                .then(users => {

                    const foundUser = users.find(
                        u => u.id === username && u.password === password
                    );

                    if (!foundUser) {
                        alert("❌ Username atau password salah!");
                        return;
                    }

                    // SIMPAN SESSION (kekalkan logic anda)
                    sessionStorage.setItem("loggedIn", "true");
                    sessionStorage.setItem("currentUser", JSON.stringify(foundUser));

                    window.location.href = "dashboard.html";
                })
                .catch(() => {
                    alert("❌ Gagal load data user");
                });


        }, 1500);
    });
}

// ===== SESSION CHECK =====
if (window.location.pathname.endsWith("dashboard.html")) {
    if (sessionStorage.getItem("loggedIn") !== "true") {
        window.location.href = "index.html";
    }
}

// ===== AUTO LOGOUT + REMINDER =====
let timeoutReminder, autoLogout;
const timeoutLimit = 10 * 60 * 1000; // 10 minit
const reminderTime = 9 * 60 * 1000;  // 1 minit sebelum logout

// Popup reminder
const timeoutReminderDiv = document.createElement('div');
timeoutReminderDiv.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(26,188,156,0.95);color:#fff;padding:18px 25px;border-radius:12px;font-weight:700;box-shadow:0 0 15px #1abc9c,0 0 25px rgba(26,188,156,0.5);text-align:center;display:none;z-index:9999;';
timeoutReminderDiv.innerHTML = '⚠️ Anda akan logout dalam 1 minit kerana tiada aktiviti! <button id="stayLoggedIn" style="margin-top:10px;padding:8px 16px;border:none;border-radius:10px;background:#3498db;color:#fff;cursor:pointer;box-shadow:0 5px 15px rgba(0,0,0,0.4);">Terus Login</button>';
document.body.appendChild(timeoutReminderDiv);
const stayBtn = document.getElementById('stayLoggedIn');

function resetIdleTimer() {
    clearTimeout(timeoutReminder); clearTimeout(autoLogout);
    timeoutReminderDiv.style.display = 'none';
    startIdleTimer();
}

function startIdleTimer() {
    timeoutReminder = setTimeout(() => { timeoutReminderDiv.style.display = 'block'; }, reminderTime);
    autoLogout = setTimeout(() => { sessionStorage.removeItem("loggedIn"); window.location.href = "index.html"; }, timeoutLimit);
}

['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => { document.addEventListener(evt, resetIdleTimer, false); });
stayBtn.addEventListener('click', () => { timeoutReminderDiv.style.display = 'none'; resetIdleTimer(); });
startIdleTimer();

// ===== BURGER MENU LOGOUT CONFIRM =====
const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation(); // ⬅️ INI FIX UTAMA
        // Simpan last section / scroll
        const dashboardState = {
            scrollY: window.scrollY,
            lastSection: window.location.hash || '#dashboard'
        };
        localStorage.setItem('dashboardState', JSON.stringify(dashboardState));

        // Tambah overlay
        let overlayDiv = document.createElement('div');
        overlayDiv.id = "logoutOverlay";
        overlayDiv.style.display = 'block';
        document.body.appendChild(overlayDiv);

        // Buat popup confirm logout
        let confirmDiv = document.createElement('div');
        confirmDiv.id = "confirmLogoutDiv";
        confirmDiv.style.cssText = `
      position:fixed;top:50%;left:50%;
      transform:translate(-50%,-50%);
      background:rgba(44,62,80,0.95);
      color:#fff;
      padding:25px 35px;
      border-radius:15px;
      box-shadow:0 0 20px #3498db,0 0 35px rgba(52,152,219,0.5);
      text-align:center;
      z-index:9999;
    `;
        confirmDiv.innerHTML = `
      <p>⚠️ Anda pasti mahu logout?</p>
      <div style="margin-top:20px;display:flex;justify-content:space-around;gap:15px;">
        <button id="cancelLogoutBtn" style="
          padding:10px 20px;
          border:none;
          border-radius:12px;
          background:#7f8c8d;
          color:#fff;
          font-weight:bold;
          cursor:pointer;
          box-shadow:0 6px 15px rgba(0,0,0,0.4);
        ">Batal</button>
        <button id="confirmLogoutBtn" style="
          padding:10px 20px;
          border:none;
          border-radius:12px;
          background:#e74c3c;
          color:#fff;
          font-weight:bold;
          cursor:pointer;
          box-shadow:0 6px 15px rgba(0,0,0,0.4),0 0 15px #e74c3c;
        ">Logout</button>
      </div>
    `;
        document.body.appendChild(confirmDiv);

        const cancelBtn = document.getElementById('cancelLogoutBtn');
        const confirmBtn = document.getElementById('confirmLogoutBtn');

        // Cancel → remove popup & overlay, restore last section
        cancelBtn.addEventListener('click', () => {
            confirmDiv.remove();
            overlayDiv.remove(); // hilangkan kabur
            const savedState = JSON.parse(localStorage.getItem('dashboardState'));
            if (savedState) {
                window.scrollTo({ top: savedState.scrollY, behavior: 'smooth' });
                if (savedState.lastSection) {
                    const sectionEl = document.querySelector(savedState.lastSection);
                    if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        // Confirm → logout
        confirmDiv.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'confirmLogoutBtn') {
                sessionStorage.removeItem("loggedIn");
                window.location.href = "index.html";


            }
        });
    });
}

let users = JSON.parse(localStorage.getItem("users")) || [];

function renderUsers() {
    const table = document.getElementById("userTable");
    if (!table) return;

    table.innerHTML = "";

    users.forEach((u, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${u.name || "-"}</td>
            <td>${u.id}</td>
            <td>${u.role}</td>
            <td>
                <button class="admin-delete" data-index="${index}">Padam</button>
            </td>
        `;
        table.appendChild(tr);
    });
}

renderUsers();

const addUserForm = document.getElementById("addUserForm");

if (addUserForm) {
    addUserForm.addEventListener("submit", e => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const role = document.getElementById("role").value;
        const password = document.getElementById("password").value;

        if (users.some(u => u.id === email)) {
            alert("User sudah wujud");
            return;
        }

        users.push({
            name,
            id: email,
            password,
            role
        });

        localStorage.setItem("users", JSON.stringify(users));
        e.target.reset();
        renderUsers();
    });
}

document.addEventListener("click", e => {
    if (e.target.classList.contains("admin-delete")) {
        const index = e.target.dataset.index;
        if (!confirm("Padam user ini?")) return;

        users.splice(index, 1);
        localStorage.setItem("users", JSON.stringify(users));
        renderUsers();
    }
});





