require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');

const redirectEngine = require('./redirect-engine');
const apiRoutes = require('./api-routes');
const authRoutes = require('./auth-routes');
const { runMigrations } = require('./migrate');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true);

app.use(express.json());

// Signed, httpOnly session cookie — this is what makes login/signup/logout
// actually stick between requests. SESSION_SECRET must be set in production;
// a dev fallback is used locally so `npm run dev` works out of the box.
app.use(cookieSession({
  name: 'bexalink.sid',
  secret: process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  sameSite: 'lax',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
}));

app.get('/', (req, res) => {
  res.status(200).send('Bexalink is running ✅');
});

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Safety-net route in case something links straight to the Express server's
// own /logout instead of the Next.js /logout page (which calls the API and
// redirects). Must sit BEFORE the redirect engine's catch-all /:code route,
// or "/logout" would be treated as an unknown short link.
app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.use('/', redirectEngine);

const PORT = process.env.PORT || 3000;

runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Bexalink running at http://localhost:${PORT}`);
    console.log(`Try shortening a link, then visiting http://localhost:${PORT}/<short_code>`);
  });
});
