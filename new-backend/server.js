const express = require('express');
const path = require('path');
const cors = require('cors');
const { initDb } = require('./db');
const seed = require('./seed');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from /public in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

app.use('/api/tasks', tasksRouter);

// SPA catch-all: serve index.html for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Initialise database, seed, and optionally start listening.
// The exported `ready` promise lets tests wait for init to complete.
const ready = initDb()
  .then(() => {
    seed();
    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`TaskFlow API running on http://localhost:${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });

module.exports = app;
module.exports.ready = ready;
