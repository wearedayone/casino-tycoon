import fs from 'fs';
import path from 'path';

import { firestore } from '../configs/admin.config.js';
const JSON_PATH = path.join(process.cwd(), `assets/jsons/mismatchedWhitelistUsers.json`);

const main = async () => {
  try {
    const whitelistSnapshot = await firestore.collection('whitelisted').get();
    const usersSnapshot = await firestore.collection('user').get();

    const whitelist = whitelistSnapshot.docs.map((doc) => ({
      username: doc.data().username,
      usernameLowercase: doc.data().username.toLowerCase(),
    }));

    const users = usersSnapshot.docs.map((doc) => ({
      username: doc.data().username,
      isWhitelisted: doc.data().isWhitelisted,
      usernameLowercase: doc.data().username.toLowerCase(),
    }));

    const duplicateUsers = [];
    const usersNotLoggedIn = [];
    const mismatchedUsers = [];

    for (let whitelisted of whitelist) {
      const matchingUsers = users.filter((u) => u.usernameLowercase === whitelisted.usernameLowercase);
      const user = matchingUsers[0];
      if (!user) {
        usersNotLoggedIn.push(whitelisted);
        continue;
      }

      if (!user.isWhitelisted || user.username !== whitelisted.username) {
        mismatchedUsers.push({
          username: user.username,
          whitelistUsername: whitelisted.username,
          isWhitelisted: user.isWhitelisted,
        });
      }
    }

    for (let user of users) {
      const matchingUsers = users.filter((u) => u.usernameLowercase === user.usernameLowercase);
      if (matchingUsers.length > 1) {
        const isInWhitelist = whitelist.findIndex((u) => u.usernameLowercase === user.usernameLowercase);
        duplicateUsers.push({
          username: matchingUsers[0].username,
          storedUsers: matchingUsers.map(({ username, isWhitelisted }) => ({ username, isWhitelisted })),
          isInWhitelist,
        });
      }
    }

    console.log(`${usersNotLoggedIn.length} whitelisted users but not logged in`, usersNotLoggedIn);
    console.log(`\n\n${mismatchedUsers.length} mismatchedUsers`, mismatchedUsers);
    console.log(`\n\n${duplicateUsers.length} duplicateUsers in db:`, duplicateUsers);
    fs.writeFileSync(JSON_PATH, JSON.stringify(mismatchedUsers, null, 2), 'utf8', () => {});
  } catch (err) {
    console.error(err);
  }
  console.log('done');
};

main();
