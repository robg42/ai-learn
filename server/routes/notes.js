const express = require('express');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/notes/:subsectionId
router.get('/:subsectionId', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT content, updated_at FROM notes WHERE user_id = ? AND subsection_id = ?',
      args: [req.user.id, req.params.subsectionId]
    });
    res.json({ content: result.rows[0]?.content || '', updated_at: result.rows[0]?.updated_at || null });
  } catch (err) {
    console.error('GET /notes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notes/:subsectionId
router.put('/:subsectionId', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (content === undefined) return res.status(400).json({ error: 'content is required' });
  if (typeof content !== 'string' || content.length > 50000) {
    return res.status(400).json({ error: 'Note content must be a string under 50,000 characters' });
  }
  try {
    await db.execute({
      sql: `INSERT INTO notes (user_id, subsection_id, content, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, subsection_id)
            DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP`,
      args: [req.user.id, req.params.subsectionId, content]
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /notes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
