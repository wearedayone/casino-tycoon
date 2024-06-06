const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.onSeasonUpdate = functions.firestore
  .document('season/{seasonId}')
  .onUpdate(async ({ before, after }, context) => {
    functions.logger.info('Season update', { after, params: context.params });
    const { seasonId } = context.params;

    await admin
      .firestore()
      .collection('season')
      .doc(seasonId)
      .collection('log')
      .add({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        type: '',
        text: '',
        metadata: {
          before: before.data(),
          after: after.data(),
        },
      });
  });
