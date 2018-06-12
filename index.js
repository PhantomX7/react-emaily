const express = require('express');
const mongoose = require('mongoose');
const CookieSession = require('cookie-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const { mongoUri, cookieKey } = require('./config/keys');
require('./models/User');
require('./services/passport');

mongoose.connect(mongoUri);

const app = express();

app.use(bodyParser.json());
app.use(
  CookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [cookieKey],
  })
);

app.use(passport.initialize());
app.use(passport.session());

const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const billingRoutes = require('./routes/billingRoutes');
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/billing', billingRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));

  const path = require('path');
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 8000;
app.listen(PORT);
