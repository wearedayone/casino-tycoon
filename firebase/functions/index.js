const admin = require('firebase-admin');
const gamePlay = require('./triggers/gamePlay');
const season = require('./triggers/season');

admin.initializeApp();
module.exports = { ...gamePlay, ...season };
