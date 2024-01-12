const admin = require('firebase-admin');
const gamePlay = require('./triggers/gamePlay');
const season = require('./triggers/season');
const email = require('./triggers/email');

admin.initializeApp();
module.exports = { ...gamePlay, ...season, ...email };
