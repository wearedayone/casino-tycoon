import { useState, useEffect, useRef, useMemo } from 'react';
import moment from 'moment';

import useSystemStore from '../stores/system.store';

const useSeasonCountdown = ({ open }) => {
  const activeSeason = useSystemStore((state) => state.activeSeason);
  const [end, setEnd] = useState(null);
  const [isEnded, setIsEnded] = useState(false);

  const interval = useRef();
  useEffect(() => {
    if (!open || !activeSeason) {
      if (interval.current) {
        clearInterval(interval.current);
        interval.current = null;
      }
    } else {
      const calculateEnd = () => {
        const { estimatedEndTime } = activeSeason;
        const now = moment(new Date());
        const endTime = moment(estimatedEndTime.toDate());
        const diff = moment.duration(endTime.diff(now));
        setEnd({
          days: diff.days(),
          hours: diff.hours(),
          minutes: diff.minutes(),
          seconds: diff.seconds(),
        });
      };
      interval.current = setInterval(calculateEnd, 1000);
    }

    return () => {
      if (interval.current) {
        clearInterval(interval.current);
        interval.current = null;
      }
    };
  }, [open, activeSeason?.estimatedEndTime]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const now = Date.now();
      if (activeSeason?.estimatedEndTime) {
        const { estimatedEndTime } = activeSeason;

        const endTimeUnix = estimatedEndTime.toDate().getTime();
        const seasonEnded = now > endTimeUnix;

        setIsEnded(seasonEnded);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [activeSeason?.estimatedEndTime]);

  const countdownString = useMemo(
    () => (end ? `${end.days}d ${end.hours}h ${end.minutes}m ${end.seconds}s` : '--d --h --m --s'),
    [end]
  );

  return { countdownString, isEnded };
};

export default useSeasonCountdown;
