import pool from '../config/db.js';

export const TextbookModel = {
  getAll: async () => {
    const res = await pool.query('SELECT * FROM textbook ORDER BY id ASC');
    return res.rows;
  },
  update: async (key, title, content, speech) => {
    const res = await pool.query(
      'UPDATE textbook SET title=$1, content=$2, speech_text=$3 WHERE lesson_key=$4 RETURNING *',
      [title, content, speech, key]
    );
    return res.rows[0];
  }
};