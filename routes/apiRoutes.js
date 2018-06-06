const express = require('express');
const router = express.Router();
const keys = require('../config/keys');
const stripe = require('stripe')(keys.stripeSecretKey);

router.get('/stripe', (req, res) => {

});

module.exports = router;
