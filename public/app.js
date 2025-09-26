// Global state
let customers = [];
let jobs = [];
let inventory = [];
let invoices = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    loadCustomers();
    loadJobs();
    loadInventory();
    loadInvoices();
    
    // Add event listeners for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Add event listeners for modal buttons
    document.querySelectorAll('[data-modal]').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            showModal(modalId);
        });
    });
    
    // Add event listeners for modal close buttons
    document.querySelectorAll('[data-close]').forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-close');
            closeModal(modalId);
        });
    });
    
    // Add event listeners for forms
    document.getElementById('customer-form').addEventListener('submit', submitCustomer);
    document.getElementById('job-form').addEventListener('submit', submitJob);
    document.getElementById('inventory-form').addEventListener('submit', submitInventory);
    document.getElementById('invoice-form').addEventListener('submit', submitInvoice);
    document.getElementById('quality-form').addEventListener('submit', submitQualityCheck);
});

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName + '-section').classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Find and activate the correct nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('data-section') === sectionName) {
            link.classList.add('active');
        }
    });
    
    // Load section-specific data
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'jobs':
            loadJobs();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'invoices':
            loadInvoices();
            break;
    }
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    
    // Load dropdown data for specific modals
    if (modalId === 'job-modal') {
        loadCustomerDropdown();
    }
    if (modalId === 'invoice-modal') {
        loadJobDropdown();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Reset forms
    const form = document.querySelector('#' + modalId + ' form');
    if (form) {
        form.reset();
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// API functions
async function apiRequest(url, method = 'GET', data = null) {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        alert('An error occurred. Please try again.');
        throw error;
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        const stats = await apiRequest('/api/dashboard');
        document.getElementById('total-jobs').textContent = stats.totalJobs;
        document.getElementById('pending-jobs').textContent = stats.pendingJobs;
        document.getElementById('completed-jobs').textContent = stats.completedJobs;
        document.getElementById('total-revenue').textContent = '$' + (stats.totalRevenue || 0).toFixed(2);
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

// Customer functions
async function loadCustomers() {
    try {
        customers = await apiRequest('/api/customers');
        renderCustomersTable();
    } catch (error) {
        console.error('Failed to load customers:', error);
    }
}

function renderCustomersTable() {
    const tbody = document.getElementById('customers-tbody');
    tbody.innerHTML = '';
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.email || ''}</td>
            <td>${customer.phone || ''}</td>
            <td>${customer.address || ''}</td>
            <td>${new Date(customer.created_at).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
    });
}

async function submitCustomer(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const customerData = Object.fromEntries(formData.entries());
    
    try {
        await apiRequest('/api/customers', 'POST', customerData);
        closeModal('customer-modal');
        await loadCustomers();
        alert('Customer added successfully!');
    } catch (error) {
        console.error('Failed to add customer:', error);
    }
}

// Job functions
async function loadJobs() {
    try {
        jobs = await apiRequest('/api/jobs');
        renderJobsTable();
    } catch (error) {
        console.error('Failed to load jobs:', error);
    }
}

function renderJobsTable() {
    const tbody = document.getElementById('jobs-tbody');
    tbody.innerHTML = '';
    
    jobs.forEach(job => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${job.job_number}</td>
            <td>${job.customer_name || 'N/A'}</td>
            <td>${job.description}</td>
            <td><span class="status ${job.status}">${job.status.replace('_', ' ')}</span></td>
            <td>$${(job.quoted_price || 0).toFixed(2)}</td>
            <td>${job.scheduled_date ? new Date(job.scheduled_date).toLocaleDateString() : 'Not scheduled'}</td>
            <td>
                <div class="action-buttons">
                    ${job.status === 'quoted' ? 
                        `<button class="btn btn-warning" data-action="start-job" data-job-id="${job.id}">Start</button>` : 
                        ''
                    }
                    ${job.status === 'in_progress' ? 
                        `<button class="btn btn-success" data-action="complete-job" data-job-id="${job.id}">Complete</button>` : 
                        ''
                    }
                    ${job.status === 'in_progress' || job.status === 'completed' ? 
                        `<button class="btn btn-primary" data-action="quality-check" data-job-id="${job.id}">QC</button>` : 
                        ''
                    }
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners for job action buttons
    document.querySelectorAll('[data-action="start-job"]').forEach(button => {
        button.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            updateJobStatus(jobId, 'in_progress');
        });
    });
    
    document.querySelectorAll('[data-action="complete-job"]').forEach(button => {
        button.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            updateJobStatus(jobId, 'completed');
        });
    });
    
    document.querySelectorAll('[data-action="quality-check"]').forEach(button => {
        button.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            showQualityModal(jobId);
        });
    });
}

async function submitJob(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const jobData = Object.fromEntries(formData.entries());
    
    try {
        await apiRequest('/api/jobs', 'POST', jobData);
        closeModal('job-modal');
        await loadJobs();
        await loadDashboard();
        alert('Job created successfully!');
    } catch (error) {
        console.error('Failed to create job:', error);
    }
}

async function updateJobStatus(jobId, newStatus) {
    try {
        await apiRequest(`/api/jobs/${jobId}/status`, 'PUT', { status: newStatus });
        await loadJobs();
        await loadDashboard();
        alert('Job status updated successfully!');
    } catch (error) {
        console.error('Failed to update job status:', error);
    }
}

function loadCustomerDropdown() {
    const select = document.getElementById('job-customer');
    select.innerHTML = '<option value="">Select Customer</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.name;
        select.appendChild(option);
    });
}

// Quality Control functions
function showQualityModal(jobId) {
    document.getElementById('quality-job-id').value = jobId;
    showModal('quality-modal');
}

async function submitQualityCheck(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const qualityData = Object.fromEntries(formData.entries());
    
    try {
        await apiRequest('/api/quality-checks', 'POST', qualityData);
        closeModal('quality-modal');
        alert('Quality check recorded successfully!');
    } catch (error) {
        console.error('Failed to record quality check:', error);
    }
}

// Inventory functions
async function loadInventory() {
    try {
        inventory = await apiRequest('/api/inventory');
        renderInventoryTable();
    } catch (error) {
        console.error('Failed to load inventory:', error);
    }
}

function renderInventoryTable() {
    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = '';
    
    inventory.forEach(item => {
        const row = document.createElement('tr');
        const lowStock = item.quantity_in_stock <= item.reorder_level;
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.type || 'N/A'}</td>
            <td ${lowStock ? 'style="color: red; font-weight: bold;"' : ''}>${item.quantity_in_stock}</td>
            <td>$${(item.unit_cost || 0).toFixed(2)}</td>
            <td>${item.supplier || 'N/A'}</td>
            <td>${item.reorder_level}</td>
        `;
        tbody.appendChild(row);
    });
}

async function submitInventory(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const inventoryData = Object.fromEntries(formData.entries());
    
    // Convert numeric fields
    inventoryData.quantity_in_stock = parseInt(inventoryData.quantity_in_stock);
    inventoryData.unit_cost = parseFloat(inventoryData.unit_cost);
    inventoryData.reorder_level = parseInt(inventoryData.reorder_level || 0);
    
    try {
        await apiRequest('/api/inventory', 'POST', inventoryData);
        closeModal('inventory-modal');
        await loadInventory();
        alert('Inventory item added successfully!');
    } catch (error) {
        console.error('Failed to add inventory item:', error);
    }
}

// Invoice functions
async function loadInvoices() {
    try {
        invoices = await apiRequest('/api/invoices');
        renderInvoicesTable();
    } catch (error) {
        console.error('Failed to load invoices:', error);
    }
}

function renderInvoicesTable() {
    const tbody = document.getElementById('invoices-tbody');
    tbody.innerHTML = '';
    
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${invoice.invoice_number}</td>
            <td>${invoice.job_number || 'N/A'}</td>
            <td>${invoice.customer_name || 'N/A'}</td>
            <td>$${(invoice.amount || 0).toFixed(2)}</td>
            <td><span class="status ${invoice.status}">${invoice.status}</span></td>
            <td>${invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : 'N/A'}</td>
            <td>${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
}

function loadJobDropdown() {
    const select = document.getElementById('invoice-job');
    select.innerHTML = '<option value="">Select Job</option>';
    
    // Only show completed jobs
    const completedJobs = jobs.filter(job => job.status === 'completed');
    
    completedJobs.forEach(job => {
        const option = document.createElement('option');
        option.value = job.id;
        option.textContent = `${job.job_number} - ${job.customer_name}`;
        option.dataset.amount = job.quoted_price;
        select.appendChild(option);
    });
    
    // Auto-fill amount when job is selected
    select.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.amount) {
            document.getElementById('invoice-amount').value = selectedOption.dataset.amount;
        }
    });
}

async function submitInvoice(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const invoiceData = Object.fromEntries(formData.entries());
    
    // Convert numeric fields
    invoiceData.amount = parseFloat(invoiceData.amount);
    
    try {
        await apiRequest('/api/invoices', 'POST', invoiceData);
        closeModal('invoice-modal');
        await loadInvoices();
        alert('Invoice created successfully!');
    } catch (error) {
        console.error('Failed to create invoice:', error);
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

function formatCurrency(amount) {
    return '$' + (amount || 0).toFixed(2);
}