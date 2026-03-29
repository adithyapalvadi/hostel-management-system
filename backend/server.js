const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

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
app.get('/api/:table', async (req, res) => {
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
app.get('/api/:table/:id', async (req, res) => {
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
app.post('/api/:table', async (req, res) => {
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
app.put('/api/:table/:id', async (req, res) => {
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
        // Values array needs ID appended at the end for the WHERE clause
        const [result] = await pool.query(sql, [...values, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found or no changes made' });
        res.json({ message: 'Updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generic DELETE
app.delete('/api/:table/:id', async (req, res) => {
    const table = req.params.table.toLowerCase();
    if (!allowedTables[table]) return res.status(400).json({ error: 'Invalid table' });
    const pk = allowedTables[table];

    try {
        const [result] = await pool.query(`DELETE FROM ${table} WHERE ${pk} = ?`, [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        // Handle Foreign Key Constraint errors smoothly
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ error: 'Cannot delete because this record is tied to other data (Foreign Key validation).' });
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
