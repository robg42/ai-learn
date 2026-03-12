// Local development entry point — Vercel uses api/index.js directly
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path = require('path');
const express = require('express');
const app = require('../api/index');
const PORT = process.env.PORT || 3001;

// Serve the React build when running locally in production mode
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, 'public');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\nAI Learn server running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Client dev server should be running on http://localhost:3000');
  }
});
