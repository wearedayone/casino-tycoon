import { useQuery } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';

import QueryKeys from '../utils/queryKeys';
import { setLastOnlineTime } from '../services/user.service';
import useUserStore from '../stores/user.store';
import useSettingStore from '../stores/setting.store';

const useLastOnlineTime = () => {
  const profile = useUserStore((state) => state.profile);
  const onlineListener = useSettingStore((state) => state.onlineListener);

  useQuery({
    queryKey: [QueryKeys.Online],
    queryFn: setLastOnlineTime,
    enabled: !!profile && onlineListener,
    refetchInterval: 1 * 60 * 1000,
    retry: 3,
    onError: (err) => {
      console.error(err);
      Sentry.captureException(err);
    },
  });
};

export default useLastOnlineTime;
