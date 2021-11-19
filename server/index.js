const express = require('express');

const app = express();

const cors = require('cors');

const bodyParser = require('body-parser');

const router = require('./router');

const db = require('./models/db');
const helper = require('./helpers/db.helpers');

require('dotenv').config();

const corsConfig = {
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
};

app.use(cors(corsConfig))
  .use(bodyParser())
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(router);

// process.setMaxListeners(0);
(async () => {
  try {
    const url = helper.initDBUrl();
    await db.connect(url);
    const PORT = process.env.SERVER_PORT;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.log(e);
  }
})();
