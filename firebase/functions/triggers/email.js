const functions = require('firebase-functions');
const mailgun = require('mailgun-js');

const environments = require('../utils/environments');
const { MAILGUN_DOMAIN, MAILGUN_API_KEY } = environments;

exports.onEmailCreated = functions.firestore.document('email/{emailId}').onCreate(async (doc, context) => {
  const { from, to, subject, template, variables } = doc.data();

  functions.logger.info(`onEmailCreated`, {
    id: doc.id,
    ...doc.data(),
  });

  try {
    const mailgunInstance = mailgun({
      domain: MAILGUN_DOMAIN,
      apiKey: MAILGUN_API_KEY,
    });

    const mailData = {
      from,
      to,
      subject,
      template,
      'h:X-Mailgun-Variables': JSON.stringify(variables || {}),
    };

    await mailgunInstance.messages().send(mailData, async function (error, body) {
      if (error) {
        console.error(error);
      }

      console.log({ body });
      await doc.ref.update({ status: 'Completed' });
    });
  } catch (err) {
    functions.logger.error(`Err sending email ${doc.id}`, err);
    await doc.ref.update({ status: 'Error' });
  }
});
