const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hostel_key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// --- AUTH ROUTES ---

// Registration
app.post('/api/auth/register', async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO USERS (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role || 'Manager']);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
        res.status(500).json({ error: err.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM USERS WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.user_id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user: { username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve static frontend files
const frontendPath = path.join(__dirname, '../frontend');
console.log('Serving static files from:', frontendPath);
app.use(express.static(frontendPath));

// List of allowed tables mapped to their Primary Keys to strictly prevent SQL Injection
const allowedTables = {
    'zip': 'zip_code',
    'hostel': 'hostel_id',
    'room': 'room_id',
    'student': 'student_id',
    'room_allocation': 'allocation_id',
    'visitor': 'visitor_id',
    'entry_log': 'entry_id',
    'complaint': 'complaint_id',
    'fine': 'fine_id'
};

// Generic GET all
app.get('/api/:table', authenticateToken, async (req, res) => {
    const table = req.params.table.toLowerCase();
    if (!allowedTables[table]) return res.status(400).json({ error: 'Invalid table' });
    
    try {
        const [rows] = await pool.query(`SELECT * FROM ${table}`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generic GET by ID
app.get('/api/:table/:id', authenticateToken, async (req, res) => {
    const table = req.params.table.toLowerCase();
    if (!allowedTables[table]) return res.status(400).json({ error: 'Invalid table' });
    const pk = allowedTables[table];

    try {
        const [rows] = await pool.query(`SELECT * FROM ${table} WHERE ${pk} = ?`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generic POST (Create)
app.post('/api/:table', authenticateToken, async (req, res) => {
    const table = req.params.table.toLowerCase();
    if (!allowedTables[table]) return res.status(400).json({ error: 'Invalid table' });

    const data = req.body;
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    if (keys.length === 0) return res.status(400).json({ error: 'Empty body' });

    const placeholders = keys.map(() => '?').join(',');
    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;

    try {
        const [result] = await pool.query(sql, values);
        res.status(201).json({ message: 'Created successfully', id: result.insertId || data[allowedTables[table]] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generic PUT (Update)
app.put('/api/:table/:id', authenticateToken, async (req, res) => {
    const table = req.params.table.toLowerCase();
    if (!allowedTables[table]) return res.status(400).json({ error: 'Invalid table' });
    const pk = allowedTables[table];

    const data = req.body;
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    if (keys.length === 0) return res.status(400).json({ error: 'Empty body' });

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${pk} = ?`;

    try {
        const [result] = await pool.query(sql, [...values, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found or no changes made' });
        res.json({ message: 'Updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generic DELETE
app.delete('/api/:table/:id', authenticateToken, async (req, res) => {
    const table = req.params.table.toLowerCase();
    if (!allowedTables[table]) return res.status(400).json({ error: 'Invalid table' });
    const pk = allowedTables[table];

    try {
        const [result] = await pool.query(`DELETE FROM ${table} WHERE ${pk} = ?`, [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'Cannot delete because this record is tied to other data.' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Catch-all route to serve the frontend for any non-API request
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Server running on http://0.0.0.0:${PORT}`);
});
