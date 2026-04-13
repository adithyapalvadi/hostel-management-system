const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : '/api';

// Auth Guard: Redirect to login if no token
if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}

const getToken = () => localStorage.getItem('token');
const getAuthHeader = () => ({ 'Authorization': `Bearer ${getToken()}` });

// Toast Notification Logic
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Schema Definition for dynamic tables and forms
// Every table now includes all attributes, including Primary Keys
const schemas = {
    hostel: {
        pk: 'hostel_id',
        fields: [
            { name: 'hostel_id', label: 'Hostel ID', type: 'text', isPk: true, autoInc: false },
            { name: 'hostel_name', label: 'Hostel Name', type: 'text', required: true },
            { name: 'type', label: 'Type', type: 'select', options: ['Boys', 'Girls', 'Coed'], required: true },
            { name: 'street', label: 'Street', type: 'text', required: true },
            { name: 'zip_code', label: 'Zip Code', type: 'text' }
        ]
    },
    zip: {
        pk: 'zip_code',
        fields: [
            { name: 'zip_code', label: 'Zip Code', type: 'text', required: true, isPk: true, autoInc: false },
            { name: 'city', label: 'City', type: 'text', required: true },
            { name: 'state', label: 'State', type: 'text', required: true }
        ]
    },
    room: {
        pk: 'room_id',
        fields: [
            { name: 'room_id', label: 'Room ID', type: 'number', isPk: true, autoInc: false },
            { name: 'room_number', label: 'Room Number', type: 'text', required: true },
            { name: 'capacity', label: 'Capacity', type: 'number', required: true },
            { name: 'floor', label: 'Floor', type: 'number', required: true },
            { name: 'hostel_id', label: 'Hostel ID', type: 'text', required: true }
        ]
    },
    student: {
        pk: 'student_id',
        fields: [
            { name: 'student_id', label: 'Student ID', type: 'text', isPk: true, autoInc: false },
            { name: 'name', label: 'Student Name', type: 'text', required: true },
            { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
            { name: 'department', label: 'Department', type: 'select', options: ['CSE', 'ECE', 'MECH', 'EEE', 'CIVIL', 'IT'], required: true },
            { name: 'phone', label: 'Phone', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true }
        ]
    },
    room_allocation: {
        pk: 'allocation_id',
        fields: [
            { name: 'allocation_id', label: 'Allocation ID', type: 'number', isPk: true, autoInc: false },
            { name: 'student_id', label: 'Student ID', type: 'text', required: true },
            { name: 'room_id', label: 'Room ID', type: 'number', required: true },
            { name: 'from_date', label: 'From Date', type: 'date', required: true },
            { name: 'to_date', label: 'To Date', type: 'date' }
        ]
    },
    visitor: {
        pk: 'visitor_id',
        fields: [
            { name: 'visitor_id', label: 'Visitor ID', type: 'number', isPk: true, autoInc: false },
            { name: 'visitor_name', label: 'Visitor Name', type: 'text', required: true },
            { name: 'relation', label: 'Relation', type: 'select', options: ['Father', 'Mother', 'Local Guardian', 'Sibling', 'Friend', 'Other'], required: true },
            { name: 'phone', label: 'Phone', type: 'text', required: true },
            { name: 'student_id', label: 'Student ID', type: 'text', required: true }
        ]
    },
    entry_log: {
        pk: 'entry_id',
        fields: [
            { name: 'entry_id', label: 'Entry ID', type: 'number', isPk: true, autoInc: false },
            { name: 'visitor_id', label: 'Visitor ID', type: 'number', required: true },
            { name: 'entry_time', label: 'Entry Time (YYYY-MM-DD HH:MM:SS)', type: 'text', required: true },
            { name: 'exit_time', label: 'Exit Time', type: 'text' },
            { name: 'visit_duration', label: 'Visit Duration (mins)', type: 'number' }
        ]
    },
    complaint: {
        pk: 'complaint_id',
        fields: [
            { name: 'complaint_id', label: 'Complaint ID', type: 'number', isPk: true, autoInc: false },
            { name: 'student_id', label: 'Student ID', type: 'text', required: true },
            { name: 'complaint_type', label: 'Complaint Type', type: 'select', options: ['Maintenance', 'Food', 'Security', 'Hygiene', 'Electrical', 'Other'], required: true },
            { name: 'description', label: 'Description', type: 'text', required: true },
            { name: 'complaint_date', label: 'Complaint Date', type: 'date', required: true },
            { name: 'status', label: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Resolved', 'Rejected'] }
        ]
    },
    fine: {
        pk: 'fine_id',
        fields: [
            { name: 'fine_id', label: 'Fine ID', type: 'number', isPk: true, autoInc: false },
            { name: 'complaint_id', label: 'Complaint ID (Optional)', type: 'number' },
            { name: 'amount', label: 'Amount', type: 'number', step: '0.01', required: true },
            { name: 'fine_date', label: 'Fine Date', type: 'date', required: true },
            { name: 'reason', label: 'Reason', type: 'text', required: true },
            { name: 'status', label: 'Status', type: 'select', options: ['Unpaid', 'Paid'] }
        ]
    }
};

let currentTable = 'hostel';
let editId = null;
let allData = []; // Store full dataset for searching
let currentSortCol = null;
let isAsc = true;

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('page-title');
const tableHeaders = document.getElementById('table-headers');
const tableBody = document.getElementById('table-body');
const modal = document.getElementById('form-modal');
const closeBtns = document.querySelectorAll('.close-btn, .close-btn-bottom');
const dynamicForm = document.getElementById('dynamic-form');
const formFieldsContainer = document.getElementById('form-fields');
const addNewBtn = document.getElementById('add-new-btn');
const modalTitle = document.getElementById('modal-title');
const logoutBtn = document.getElementById('logout-btn');
const globalSearch = document.getElementById('global-search');

// Initialize Layout bindings
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        navItems.forEach(n => n.classList.remove('active'));
        e.target.classList.add('active');
        currentTable = e.target.dataset.table;
        pageTitle.innerText = e.target.innerText;
        loadData();
    });
});

addNewBtn.addEventListener('click', () => openModal());
closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

globalSearch.addEventListener('input', (e) => {
    filterData(e.target.value);
});

// Form submission logic (Handles Create and Update dynamically)
dynamicForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(dynamicForm);
    const data = Object.fromEntries(formData.entries());
    
    // Convert empty strings to null for backend
    Object.keys(data).forEach(k => {
        if(data[k] === '') data[k] = null;
    });

    try {
        const method = editId ? 'PUT' : 'POST';
        const url = editId ? `${API_URL}/${currentTable}/${editId}` : `${API_URL}/${currentTable}`;
        
        const response = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(data)
        });

        if(!response.ok) {
            const err = await response.json();
            showToast(err.error || 'Failed to save changes. Check if the ID already exists!', 'error');
            return;
        }

        showToast(editId ? 'Record updated successfully!' : 'Record created successfully!', 'success');
        closeModal();
        loadData();
    } catch (err) {
        showToast('Network request failed. Is the backend running?', 'error');
    }
});

// Load table data and bind Add/Edit actions
async function loadData() {
    try {
        const response = await fetch(`${API_URL}/${currentTable}`, {
            headers: getAuthHeader()
        });
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }
        if (!response.ok) throw new Error('API Error');
        allData = await response.json();
        currentSortCol = null; // Reset sort on table change
        renderTable(allData);
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 40px; color:#ee5d50;">Failed to load data. Ensure the Node backend (localhost:5000) and MySQL database are running.</td></tr>`;
    }
}

// Function to filter data locally without refetching
function filterData(query) {
    const q = query.toLowerCase();
    const filtered = allData.filter(row => {
        return Object.values(row).some(val => 
            String(val).toLowerCase().includes(q)
        );
    });
    renderTable(filtered);
}

// Function to sort data
function handleSort(col) {
    if (currentSortCol === col) {
        isAsc = !isAsc;
    } else {
        currentSortCol = col;
        isAsc = true;
    }

    const sortedData = [...allData].sort((a, b) => {
        let valA = a[col];
        let valB = b[col];

        // Handle nulls
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        // Numeric sort
        if (typeof valA === 'number' && typeof valB === 'number') {
            return isAsc ? valA - valB : valB - valA;
        }

        // String sort
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
        
        if (valA < valB) return isAsc ? -1 : 1;
        if (valA > valB) return isAsc ? 1 : -1;
        return 0;
    });

    renderTable(sortedData);
}

// Separate rendering logic from data loading
function renderTable(data) {
    const schema = schemas[currentTable];
    tableHeaders.innerHTML = '';
        
        // Dynamically build TH
        schema.fields.forEach(f => {
            const th = document.createElement('th');
            th.innerHTML = `${f.label} <span class="sort-icon">${currentSortCol === f.name ? (isAsc ? '▲' : '▼') : '↕'}</span>`;
            if (currentSortCol === f.name) th.classList.add('active-sort');
            
            th.onclick = () => handleSort(f.name);
            tableHeaders.appendChild(th);
        });
        const actionsTh = document.createElement('th');
        actionsTh.style.cursor = 'default';
        actionsTh.innerText = 'Actions';
        actionsTh.style.textAlign = 'right';
        tableHeaders.appendChild(actionsTh);

        // Dynamically build TR/TD
        tableBody.innerHTML = '';
        if(data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${schema.fields.length + 1}" style="text-align:center; padding: 40px; color:#8f9bba;">No entries found. Click Add Record to create one.</td></tr>`;
            return;
        }

        data.forEach(row => {
            const tr = document.createElement('tr');
            schema.fields.forEach(f => {
                const td = document.createElement('td');
                let val = row[f.name];
                // Cleanup dates (only for ISO date strings)
                if (val && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
                    const parts = val.split('T');
                    const datePart = parts[0]; // YYYY-MM-DD
                    const timePart = parts[1] ? parts[1].split('.')[0] : ''; // HH:MM:SS
                    
                    const [y, m, d] = datePart.split('-');
                    val = `${d}-${m}-${y}${timePart ? ' ' + timePart : ''}`; 
                }
                // Strong 0 handling
                if (val === 0) val = '0';

                // Status Badge Logic
                if (f.name === 'status' && val) {
                    let badgeClass = 'badge-pending';
                    const lowerVal = String(val).toLowerCase();
                    if (lowerVal.includes('resolved') || lowerVal === 'paid') badgeClass = 'badge-resolved';
                    else if (lowerVal.includes('progress')) badgeClass = 'badge-progress';
                    else if (lowerVal.includes('rejected') || lowerVal === 'unpaid') badgeClass = 'badge-rejected';
                    
                    td.innerHTML = `<span class="badge ${badgeClass}">${val}</span>`;
                } else {
                    td.innerText = (val !== null && val !== undefined && val !== '') ? val : '-';
                }
                tr.appendChild(td);
            });

            const actionTd = document.createElement('td');
            actionTd.style.textAlign = 'right';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-small btn-edit';
            editBtn.innerText = 'Edit';
            editBtn.onclick = () => openModal(row);

            const delBtn = document.createElement('button');
            delBtn.className = 'btn-small btn-delete';
            delBtn.innerText = 'Delete';
            delBtn.onclick = () => deleteRecord(row[schema.pk]);

            actionTd.appendChild(editBtn);
            actionTd.appendChild(delBtn);
            tr.appendChild(actionTd);
            
            tableBody.appendChild(tr);
        });

}

// Generate the modal form dynamically based on schema
function openModal(rowData = null) {
    const isEdit = rowData !== null;
    const schema = schemas[currentTable];
    
    editId = isEdit ? rowData[schema.pk] : null;
    modalTitle.innerText = isEdit ? `Edit ${pageTitle.innerText}` : `Add New ${pageTitle.innerText}`;
    
    formFieldsContainer.innerHTML = '';

    schema.fields.forEach(f => {
        // All fields (including Primary Keys) will now render during "Add Record"

        const div = document.createElement('div');
        div.className = 'form-group';
        
        let inputHtml = '';
        // In "Add Record", require the primary key since the user generates it manually
        const requiredAttr = (f.required || f.isPk) ? 'required' : '';
        const stepAttr = f.step ? `step="${f.step}"` : '';
        let val = isEdit ? rowData[f.name] : '';
        
        if (val && typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val) && f.type === 'date') val = val.split('T')[0];
        if (val === null || val === undefined) val = '';

        // All Primary keys become read-only ONLY during edit so we don't accidentally update the ID of an existing record
        const disabledAttr = (isEdit && f.isPk) ? 'readonly' : '';

        if (f.type === 'select') {
            const options = f.options.map(opt => `<option value="${opt}" ${val === String(opt) ? 'selected' : ''}>${opt}</option>`).join('');
            inputHtml = `<select name="${f.name}" class="form-control" ${requiredAttr} ${disabledAttr}>
                <option value="">-- Select --</option>
                ${options}
            </select>`;
        } else {
            inputHtml = `<input type="${f.type}" name="${f.name}" class="form-control" value="${val}" ${requiredAttr} ${stepAttr} ${disabledAttr}>`;
        }

        div.innerHTML = `<label>${f.label}</label>${inputHtml}`;
        formFieldsContainer.appendChild(div);
    });

    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
    dynamicForm.reset();
}

// Delete row handler
async function deleteRecord(id) {
    if(!confirm('Are you certain you wish to delete this record? This action cannot be undone.')) return;
    try {
        const response = await fetch(`${API_URL}/${currentTable}/${id}`, { 
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if(!response.ok) {
            const err = await response.json();
            showToast('Failed to delete: ' + (err.error || 'Server error'), 'error');
            return;
        }
        showToast('Record deleted successfully!', 'error');
        loadData();
    } catch(err) {
        showToast('Network request failed. Is the backend running?', 'error');
    }
}

// Kickoff
loadData();
