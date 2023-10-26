import { useEffect, useState } from 'react';

import Navigations from './navigations';
import useSettingStore from './stores/setting.store';

const App = () => {
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [audio] = useState(new Audio('/audios/bg.mp3'));
  const sound = useSettingStore((state) => state.sound);

  useEffect(() => {
    const play = audio.play;
    audio.addEventListener('ended', play);
    return () => {
      audio.removeEventListener('ended', play);
    };
  }, []);

  useEffect(() => {
    userHasInteracted && sound === 'on' ? audio.play().catch((e) => {}) : audio.pause();
  }, [userHasInteracted, sound]);

  return (
    <div onClick={() => setUserHasInteracted(true)}>
      <Navigations />
    </div>
  );
};

export default App;
