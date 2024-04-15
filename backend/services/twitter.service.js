import crypto from 'crypto';
import axios from 'axios';

import environments from '../utils/environments.js';
import { firestore } from '../configs/firebase.config.js';

const { TWITTER_CONSUMER_API_KEY, TWITTER_CONSUMER_API_SECRET, SITE_URL } = environments;

export const getOauthRequestToken = async () => {
  const { oauth_token, oauth_callback_confirmed } = await obtainOauthRequestToken({
    consumerKey: TWITTER_CONSUMER_API_KEY,
    consumerSecret: TWITTER_CONSUMER_API_SECRET,
    callbackUrl: `${SITE_URL}/verify/twitter`,
    method: 'POST',
    apiUrl: 'https://api.twitter.com/oauth/request_token',
  });

  if (!oauth_callback_confirmed) throw new Error('API error: OAuth callback not confirmed');

  return { oauth_token };
};

export const submitOauthData = async ({ userId, oauth_token, oauth_verifier }) => {
  const data = await obtainOauthAccessToken({
    consumerKey: TWITTER_CONSUMER_API_KEY,
    consumerSecret: TWITTER_CONSUMER_API_SECRET,
    oauthToken: oauth_token,
    oauthVerifier: oauth_verifier,
    method: 'POST',
    apiUrl: 'https://api.twitter.com/oauth/access_token',
  });

  const { oauth_token: oauth_token_response, oauth_token_secret, user_id, screen_name } = data;

  const existed = await firestore.collection('user').where('username', '==', screen_name).get();
  if (!existed.empty) throw new Error('API error: Twitter linked with another account already');

  await firestore
    .collection('user')
    .doc(userId)
    .update({ username: screen_name, socials: { twitter: { verified: true } } });
  await firestore
    .collection('social')
    .doc(userId)
    .set({ twitter: { oauth_token: oauth_token_response, oauth_token_secret, user_id, screen_name } }, { merge: true });

  const promises = [];
  const gamePlaySnapshot = await firestore.collection('gamePlay').where('userId', '==', userId).get();
  gamePlaySnapshot.docs.forEach((doc) => promises.push(doc.ref.update({ username: screen_name })));
  await Promise.all(promises);
};

const obtainOauthAccessToken = async ({ consumerKey, consumerSecret, oauthToken, oauthVerifier, method, apiUrl }) => {
  const params = {
    oauth_consumer_key: consumerKey,
    oauth_version: '1.0',
    oauth_signature_method: 'HMAC-SHA1',
    oauth_token: oauthToken,
    oauth_verifier: oauthVerifier,
    oauth_timestamp: (Date.now() / 1000).toFixed(),
    oauth_nonce: Math.random()
      .toString(36)
      .replace(/[^a-z]/, '')
      .substring(2),
  };

  const oauthSignature = makeSignature(params, method, apiUrl, consumerSecret);

  const res = await axios(apiUrl, {
    method,
    headers: { Authorization: `OAuth ${oauthSignature}` },
  });

  return parseOAuthToken(res.data);
};

const obtainOauthRequestToken = async ({ consumerKey, consumerSecret, callbackUrl, method, apiUrl }) => {
  const oauthSignature = requestTokenSignature({
    method,
    apiUrl,
    callbackUrl,
    consumerKey,
    consumerSecret,
  });

  const res = await axios(apiUrl, {
    method,
    headers: {
      Authorization: `OAuth ${oauthSignature}`,
    },
  });

  return parseOAuthToken(res.data);
};

const requestTokenSignature = ({ method, apiUrl, callbackUrl, consumerKey, consumerSecret }) => {
  const params = {
    oauth_consumer_key: consumerKey,
    oauth_version: '1.0',
    oauth_signature_method: 'HMAC-SHA1',
    oauth_callback: callbackUrl,
    oauth_timestamp: (Date.now() / 1000).toFixed(),
    oauth_nonce: Math.random()
      .toString(36)
      .replace(/[^a-z]/, '')
      .substring(2),
  };

  return makeSignature(params, method, apiUrl, consumerSecret);
};

export const makeSignature = (params, method, apiUrl, consumerSecret) => {
  const paramsBaseString = Object.keys(params)
    .sort()
    .reduce((prev, el) => {
      return (prev += `&${el}=${params[el]}`);
    }, '')
    .substring(1);

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(apiUrl)}&${encodeURIComponent(
    paramsBaseString
  )}`;

  const signingKey = `${encodeURIComponent(consumerSecret)}&`;

  const hmac = crypto.createHmac('sha1', signingKey);
  hmac.update(signatureBaseString);

  const paramsWithSignature = {
    ...params,
    oauth_signature: encodeURIComponent(hmac.digest('base64')),
  };

  return Object.keys(paramsWithSignature)
    .sort()
    .reduce((prev, el) => {
      return (prev += `,${el}="${paramsWithSignature[el]}"`);
    }, '')
    .substring(1);
};

export const parseOAuthToken = (responseText) =>
  responseText.split('&').reduce((prev, el) => {
    const [key, value] = el.split('=');
    return { ...prev, [key]: value };
  }, {});
