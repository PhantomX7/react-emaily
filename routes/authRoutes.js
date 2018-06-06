const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google'),
  (req, res) => {
    res.redirect('/surveys');
  }
);

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');

});

router.get('/getme', (req, res) => {
  res.send(req.user);
});

module.exports = router;
