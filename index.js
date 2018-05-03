const express = require('express');
const mongoose = require('mongoose');
const CookieSession = require('cookie-session');
const passport = require('passport');
const { mongoUri, cookieKey } = require('./config/keys');
require('./models/User');
require('./services/passport');

mongoose.connect(mongoUri);

const app = express();

app.use(
  CookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [cookieKey]
  })
);

app.use(passport.initialize());
app.use(passport.session());

const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT);
