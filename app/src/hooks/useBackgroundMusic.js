import { useEffect, useState } from 'react';

import useSettingStore from '../stores/setting.store';

export default function useBackgroundMusic() {
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [audio] = useState(new Audio('/audios/bg.mp3'));
  const sound = useSettingStore((state) => state.sound);

  // useEffect(() => {
  //   const play = audio.play;
  //   audio.addEventListener('ended', play);
  //   return () => {
  //     audio.removeEventListener('ended', play);
  //   };
  // }, []);

  // useEffect(() => {
  //   userHasInteracted && sound === 'on' ? audio.play().catch((e) => {}) : audio.pause();
  // }, [userHasInteracted, sound]);

  return { setUserHasInteracted };
}
