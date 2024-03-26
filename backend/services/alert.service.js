import { firestore } from '../configs/firebase.config.js';
import logger from '../utils/logger.js';

export const sendEmailAlert = async ({ subject, template, variables, level = 'minor' }) => {
  try {
    const alertConfigSnapshot = await firestore.collection('system').doc('alert').get();

    const { minor, major, critical } = alertConfigSnapshot.data();
    let to;
    switch (level) {
      case 'minor':
        to = minor || ['brian@uncharted.gg', 'jack.nguyen@weareday.one', 'ally@weareday.one'];
        break;
      case 'major':
        to = major || ['brian@uncharted.gg', 'jack.nguyen@weareday.one', 'ally@weareday.one'];
        break;
      case 'critical':
        to = critical || ['brian@uncharted.gg', 'jack.nguyen@weareday.one', 'ally@weareday.one'];
        break;
    }

    if (!to) {
      logger.error('Invalid alert severity level');
      return;
    }

    const alert = {
      from: 'Gangster Arena Alerts <alert@gangsterarena.com>',
      to: to.join(','),
      subject: `[${level.toUpperCase()}] ${subject}`,
      template,
      variables,
    };

    console.log(`Adding email alert: `, JSON.stringify(alert, null, 2));
    await firestore.collection('email').add(alert);
  } catch (error) {
    console.error(error);
    logger.error(error.message);
  }
};
