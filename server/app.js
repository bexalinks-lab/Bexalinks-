// app.js
// Entry point. Run with: npm run dev  (after `npm install` and setting up .env)

require('dotenv').config();
const express = require('express');
const path = require('path');

const redirectEngine = require('./redirect-engine');
const apiRoutes = require('./api-routes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true); // so req.ip respects X-Forwarded-For behind a proxy/CDN

app.use(express.json());

// JSON API (dashboard + bots) lives under /api
app.use('/api', apiRoutes);

// Everything else is the public redirection engine: /:code, /:code/verify, etc.
app.use('/', redirectEngine);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bexalink running at http://localhost:${PORT}`);
  console.log(`Try shortening a link, then visiting http://localhost:${PORT}/<short_code>`);
});
