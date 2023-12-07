import { PrivyClient } from '@privy-io/server-auth';
import environments from '../utils/environments.js';
const { PRIVY_APP_ID, PRIVY_APP_SECRET } = environments;
const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

export default privy;
