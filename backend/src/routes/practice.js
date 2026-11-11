import express from 'express';
import initSqlJs from 'sql.js';

const router = express.Router();

router.post('/execute', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'No query provided' });

  try {
    // Initialize SQL.js
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // 1. Create a dummy table
    db.run(`
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT,
        department TEXT,
        salary INTEGER
      );
    `);

    // 2. Insert dummy data so students have something to query
    db.run(`
      INSERT INTO employees (name, department, salary) VALUES 
      ('Alice', 'Engineering', 90000),
      ('Bob', 'Engineering', 85000),
      ('Charlie', 'Marketing', 60000),
      ('Diana', 'Sales', 55000),
      ('Eve', 'Engineering', 95000);
    `);

    // 3. Execute the student's query
    const results = db.exec(query);

    // 4. Format the results
    let responseData = { columns: [], values: [] };
    if (results.length > 0) {
      responseData.columns = results[0].columns;
      responseData.values = results[0].values;
    }

    res.json(responseData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;