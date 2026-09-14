require('dotenv').config();
const express = require('express');
const path = require('path');

const redirectEngine = require('./redirect-engine');
const apiRoutes = require('./api-routes');
const { runMigrations } = require('./migrate');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true);

app.use(express.json());

app.use('/api', apiRoutes);
app.use('/', redirectEngine);

const PORT = process.env.PORT || 3000;

runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Bexalink running at http://localhost:${PORT}`);
    console.log(`Try shortening a link, then visiting http://localhost:${PORT}/<short_code>`);
  });
});
