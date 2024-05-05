import api from './api';

export const getOauthRequestToken = () => api.get('/api/v1/twitter/oauth-request-token');

export const submitOauthData = ({ oauth_token, oauth_verifier }) =>
  api.post('/api/v1/twitter/access-token', { oauth_token, oauth_verifier });
