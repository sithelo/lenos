const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new sqlite3.Database('lenos.db');

// Initialize database tables
db.serialize(() => {
    // Customers table
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Jobs table
    db.run(`CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        job_number TEXT UNIQUE,
        description TEXT,
        status TEXT DEFAULT 'quoted',
        quoted_price DECIMAL(10,2),
        actual_price DECIMAL(10,2),
        quoted_date DATE,
        scheduled_date DATE,
        completion_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
    )`);

    // Inventory items table
    db.run(`CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT,
        quantity_in_stock INTEGER DEFAULT 0,
        unit_cost DECIMAL(10,2),
        supplier TEXT,
        reorder_level INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Job inventory usage table
    db.run(`CREATE TABLE IF NOT EXISTS job_inventory_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        inventory_id INTEGER,
        quantity_used INTEGER,
        cost_per_unit DECIMAL(10,2),
        FOREIGN KEY (job_id) REFERENCES jobs (id),
        FOREIGN KEY (inventory_id) REFERENCES inventory (id)
    )`);

    // Quality control checks table
    db.run(`CREATE TABLE IF NOT EXISTS quality_checks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        check_type TEXT,
        result TEXT,
        notes TEXT,
        checked_by TEXT,
        checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs (id)
    )`);

    // Invoices table
    db.run(`CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        invoice_number TEXT UNIQUE,
        amount DECIMAL(10,2),
        status TEXT DEFAULT 'pending',
        issue_date DATE,
        due_date DATE,
        paid_date DATE,
        FOREIGN KEY (job_id) REFERENCES jobs (id)
    )`);
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/dashboard', (req, res) => {
    const stats = {};
    
    // Get job counts by status
    db.get("SELECT COUNT(*) as total FROM jobs", (err, totalJobs) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalJobs = totalJobs.total;

        db.get("SELECT COUNT(*) as pending FROM jobs WHERE status = 'in_progress'", (err, pendingJobs) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.pendingJobs = pendingJobs.pending;

            db.get("SELECT COUNT(*) as completed FROM jobs WHERE status = 'completed'", (err, completedJobs) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.completedJobs = completedJobs.completed;

                db.get("SELECT SUM(actual_price) as revenue FROM jobs WHERE status = 'completed'", (err, revenue) => {
                    if (err) return res.status(500).json({ error: err.message });
                    stats.totalRevenue = revenue.revenue || 0;

                    res.json(stats);
                });
            });
        });
    });
});

// Customer routes
app.get('/api/customers', (req, res) => {
    db.all("SELECT * FROM customers ORDER BY created_at DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/customers', (req, res) => {
    const { name, email, phone, address } = req.body;
    db.run("INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)",
        [name, email, phone, address], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Customer created successfully' });
        });
});

// Job routes
app.get('/api/jobs', (req, res) => {
    const query = `
        SELECT j.*, c.name as customer_name 
        FROM jobs j 
        LEFT JOIN customers c ON j.customer_id = c.id 
        ORDER BY j.created_at DESC
    `;
    db.all(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/jobs', (req, res) => {
    const { customer_id, description, quoted_price, scheduled_date } = req.body;
    const job_number = 'JOB-' + Date.now();
    
    db.run(`INSERT INTO jobs (customer_id, job_number, description, quoted_price, scheduled_date, quoted_date) 
            VALUES (?, ?, ?, ?, ?, date('now'))`,
        [customer_id, job_number, description, quoted_price, scheduled_date], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, job_number, message: 'Job created successfully' });
        });
});

app.put('/api/jobs/:id/status', (req, res) => {
    const { status } = req.body;
    const jobId = req.params.id;
    
    let updateQuery = "UPDATE jobs SET status = ?";
    let params = [status, jobId];
    
    if (status === 'completed') {
        updateQuery += ", completion_date = date('now')";
    }
    updateQuery += " WHERE id = ?";
    
    db.run(updateQuery, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Job status updated successfully' });
    });
});

// Inventory routes
app.get('/api/inventory', (req, res) => {
    db.all("SELECT * FROM inventory ORDER BY name", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/inventory', (req, res) => {
    const { name, type, quantity_in_stock, unit_cost, supplier, reorder_level } = req.body;
    db.run(`INSERT INTO inventory (name, type, quantity_in_stock, unit_cost, supplier, reorder_level) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [name, type, quantity_in_stock, unit_cost, supplier, reorder_level], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Inventory item created successfully' });
        });
});

// Quality control routes
app.post('/api/quality-checks', (req, res) => {
    const { job_id, check_type, result, notes, checked_by } = req.body;
    db.run(`INSERT INTO quality_checks (job_id, check_type, result, notes, checked_by) 
            VALUES (?, ?, ?, ?, ?)`,
        [job_id, check_type, result, notes, checked_by], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Quality check recorded successfully' });
        });
});

app.get('/api/quality-checks/:jobId', (req, res) => {
    db.all("SELECT * FROM quality_checks WHERE job_id = ? ORDER BY checked_at DESC", 
        [req.params.jobId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
});

// Invoice routes
app.post('/api/invoices', (req, res) => {
    const { job_id, amount, due_date } = req.body;
    const invoice_number = 'INV-' + Date.now();
    
    db.run(`INSERT INTO invoices (job_id, invoice_number, amount, issue_date, due_date) 
            VALUES (?, ?, ?, date('now'), ?)`,
        [job_id, invoice_number, amount, due_date], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, invoice_number, message: 'Invoice created successfully' });
        });
});

app.get('/api/invoices', (req, res) => {
    const query = `
        SELECT i.*, j.job_number, c.name as customer_name 
        FROM invoices i 
        LEFT JOIN jobs j ON i.job_id = j.id 
        LEFT JOIN customers c ON j.customer_id = c.id 
        ORDER BY i.issue_date DESC
    `;
    db.all(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Lenos server running on port ${PORT}`);
});