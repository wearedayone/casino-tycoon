import { isFirefox } from 'react-device-detect';
import { getUserOS, getPWADisplayMode } from './pwa';

const userAgent = {
  isFirefox,
  os: getUserOS(),
  displayMode: getPWADisplayMode(),
};

export default userAgent;
