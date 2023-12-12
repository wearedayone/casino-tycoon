import { useQuery } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';

import QueryKeys from '../utils/queryKeys';
import { setLastOnlineTime } from '../services/user.service';
import useUserStore from '../stores/user.store';

const useLastOnlineTime = () => {
  const profile = useUserStore((state) => state.profile);

  useQuery({
    queryKey: [QueryKeys.Online],
    queryFn: setLastOnlineTime,
    enabled: !!profile,
    refetchInterval: 1 * 60 * 1000,
    retry: 3,
    onError: (err) => {
      console.error(err);
      Sentry.captureException(err);
    },
  });
};

export default useLastOnlineTime;
