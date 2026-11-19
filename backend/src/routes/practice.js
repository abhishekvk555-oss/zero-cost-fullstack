import express from 'express';
import initSqlJs from 'sql.js';
import { sql } from '../config/db.js';

const router = express.Router();

// TEMPORARY: This will be your dummy database schema for the editor
const setupDatabase = (db) => {
  db.run(`
    CREATE TABLE employees (
      id INTEGER PRIMARY KEY,
      name TEXT,
      department TEXT,
      salary INTEGER
    );
  `);
  db.run(`
    INSERT INTO employees (name, department, salary) VALUES 
    ('Alice', 'Engineering', 90000),
    ('Bob', 'Engineering', 85000),
    ('Charlie', 'Marketing', 60000),
    ('Diana', 'Sales', 55000),
    ('Eve', 'Engineering', 95000);
  `);
};

// The actual correct answers for our validation engine
const solutions = {
  'Day 1': "SELECT * FROM employees;",
  'Day 2': "SELECT department, SUM(salary) FROM employees GROUP BY department;",
  'Day 3': "SELECT * FROM employees WHERE department = 'Engineering';", // Simplified for now
  'Day 4': "SELECT * FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);",
  'Day 5': "SELECT name, CASE WHEN salary > 70000 THEN 'High' ELSE 'Low' END FROM employees;",
  'Day 6': "SELECT name, ROW_NUMBER() OVER(ORDER BY salary DESC) FROM employees;",
  'Day 7': "SELECT * FROM employees ORDER BY salary DESC LIMIT 3;"
};

// 1. Execute Query Route
router.post('/execute', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'No query provided' });

  try {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    setupDatabase(db);

    const results = db.exec(query);
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

// 2. Validate Answer Route (NEW)
router.post('/validate', async (req, res) => {
  const { query, day, questionId, clientId } = req.body;

  try {
    // Check if the query matches the solution for that day
    const correctAnswer = solutions[day];
    
    // Simple string matching (You can make this smarter later)
    const isCorrect = query.trim().toLowerCase() === correctAnswer.toLowerCase();

    if (isCorrect) {
      // Save score to Neon Database
      await sql`
        INSERT INTO student_progress (client_id, day_number, question_id, is_correct)
        VALUES (${clientId}, ${day}, ${questionId}, true)
      `;
      res.json({ success: true, message: 'Correct! Score updated.' });
    } else {
      res.json({ success: false, message: 'Incorrect. Try again!' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get Score Route (NEW)
router.get('/score', async (req, res) => {
  const { clientId } = req.query;
  try {
    const result = await sql`
      SELECT COUNT(*) as score FROM student_progress 
      WHERE client_id = ${clientId} AND is_correct = true
    `;
    res.json({ score: parseInt(result[0].score) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;