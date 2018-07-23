const express = require('express');
const _ = require('lodash');
const Path = require('path-parser').default;
const { URL } = require('url');
const mongoose = require('mongoose');
const router = express.Router();
const keys = require('../config/keys');
const stripe = require('stripe')(keys.stripeSecretKey);
const requireLogin = require('../middlewares/requireLogin');
const requireCredits = require('../middlewares/requireCredits');
const Mailer = require('../services/Mailer');
const surveyTemplate = require('../services/emailTemplates/surveyTemplate');

const Survey = mongoose.model('surveys');

router.get('/surveys', requireLogin, async (req, res) => {
  const surveys = await Survey.find({ _user: req.user.id }).select({
    recipients: false,
  });

  res.send(surveys);
});

router.get('/surveys/:surveyId/:choice', (req, res) => {
  res.send('thanks for voting');
});

router.post('/surveys/webhooks', (req, res) => {
  console.log(req.body);
  const p = new Path('/api/surveys/:surveyId/:choice');
  _.chain(req.body)
    .map(({ email, url }) => {
      const match = p.test(new URL(url).pathname);
      if (match) {
        return { email, ...match };
      }
    })
    .compact()
    .uniqBy('email', 'surveyId')
    .each(({ surveyId, email, choice }) => {
      Survey.updateOne(
        {
          _id: surveyId,
          recipients: {
            $elemMatch: { email, responded: false },
          },
        },
        {
          $inc: { [choice]: 1 },
          $set: { 'recipients.$.responded': true },
          lastResponded: new Date(),
        }
      ).exec();
    })
    .value();

  res.send({});
});

router.post('/stripe', requireLogin, async (req, res) => {
  if (!req.user) {
    return res.status(401).send({ error: 'you must logged in' });
  }

  const charge = await stripe.charges.create({
    amount: 500,
    currency: 'usd',
    description: '5$ for 5 credits',
    source: req.body.id,
  });

  req.user.credits += 5;
  const user = await req.user.save();

  res.send(user);
});

router.post('/surveys', requireLogin, requireCredits, async (req, res) => {
  const { title, subject, body, recipients } = req.body;

  const survey = new Survey({
    title,
    subject,
    body,
    recipients: recipients.split(',').map(email => ({ email: email.trim() })),
    _user: req.user.id,
    dateSent: Date.now(),
  });

  const mailer = new Mailer(survey, surveyTemplate(survey));

  try {
    await mailer.send();
    await survey.save();
    req.user.credits -= 1;
    const user = await req.user.save();

    res.send(user);
  } catch (e) {
    res.status(422).send(err);
  }
});

module.exports = router;
