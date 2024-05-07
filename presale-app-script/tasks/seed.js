import admin, { firestore } from '../configs/firebase.config.js';
import whitelisted from '../assets/whitelisted.json' assert { type: 'json' };
import season1 from '../assets/season1.json' assert { type: 'json' };

const main = async () => {
  console.log('creating phases');
  const now = Date.now();
  const phases = [
    {
      id: 1,
      name: 'Whitelist mint', // only for whitelisted users
      startTime: admin.firestore.Timestamp.fromMillis(now),
      endTime: admin.firestore.Timestamp.fromMillis(now + 5 * 24 * 60 * 60 * 1000),
      totalSupply: 500,
      sold: 0,
      maxPerWallet: 10,
      priceInEth: 0.0005,
      type: 'whitelisted',
    },
    {
      id: 2,
      name: 'Season 1 user mint', // only for season 1 users
      startTime: admin.firestore.Timestamp.fromMillis(now + 5 * 24 * 60 * 60 * 1000),
      endTime: admin.firestore.Timestamp.fromMillis(now + 10 * 24 * 60 * 60 * 1000),
      totalSupply: 500,
      sold: 0,
      maxPerWallet: 1,
      priceInEth: 0,
      type: 'whitelisted',
    },
    {
      id: 3,
      name: 'Season 1 user mint then public 24h later', // public but season 1 users can mint 24h earlier
      startTimeForWhitelisted: admin.firestore.Timestamp.fromMillis(now + 4 * 24 * 60 * 60 * 1000),
      startTime: admin.firestore.Timestamp.fromMillis(now + 5 * 24 * 60 * 60 * 1000),
      endTime: admin.firestore.Timestamp.fromMillis(now + 10 * 24 * 60 * 60 * 1000),
      totalSupply: 500,
      sold: 0,
      maxPerWallet: 10,
      priceInEth: 0.001,
      type: 'hybrid', // both whitelisted and public, whitelist can mint earlier
    },
    {
      id: 4,
      name: 'Public mint', // public
      startTime: admin.firestore.Timestamp.fromMillis(now + 10 * 24 * 60 * 60 * 1000),
      endTime: admin.firestore.Timestamp.fromMillis(now + 15 * 24 * 60 * 60 * 1000),
      totalSupply: 500,
      sold: 0,
      maxPerWallet: 10,
      priceInEth: 0.002,
      type: 'public',
    },
  ];
  const phasePromises = phases.map((phase) =>
    firestore
      .collection('phase')
      .doc(`${phase.id}`)
      .set({
        ...phase,
      })
  );
  await Promise.all(phasePromises);
  console.log('created phases');

  // create whitelisted
  console.log('create whitelisted');
  const whitelistedPromises = whitelisted.map((username) =>
    firestore.collection('whitelisted-user').add({ phaseId: '1', username })
  );
  await Promise.all(whitelistedPromises);

  const season1Promises1 = season1.map((username) =>
    firestore.collection('whitelisted-user').add({ phaseId: '2', username })
  );
  await Promise.all(season1Promises1);

  const season1Promises2 = season1.map((username) =>
    firestore.collection('whitelisted-user').add({ phaseId: '3', username })
  );
  await Promise.all(season1Promises2);
  console.log('created whitelisted');
};

main()
  .then(() => {
    console.log('done!');
    process.exit(0);
  })
  .catch((err) => console.error(err));
