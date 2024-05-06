import { useLayoutEffect, useState } from 'react';

const useBrowser = () => {
  // const [ osType, setOsType ] = useState<string>(OSType.Unknown);
  const [isBrowser, setIsBrowser] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useLayoutEffect(() => {
    const matchBrowser = typeof window !== 'undefined';
    const matchSafari =
      (matchBrowser &&
        window.navigator.vendor.match(/apple/i) &&
        !window.navigator.userAgent.match(/crios/i) &&
        !window.navigator.userAgent.match(/fxios/i) &&
        !window.navigator.userAgent.match(/Opera|OPT\//)) ||
      false;

    setIsBrowser(matchBrowser);
    setIsSafari(matchSafari);

    const matchWindows = /windows/i.test(navigator.userAgent);
    const matchMacOs = /mac/i.test(navigator.userAgent);

    // setOsType(matchWindows ? OSType.Windows : matchMacOs ? OSType.MacOS : OSType.Unknown);
  }, []);

  return {
    // osType,
    isBrowser,
    isSafari,
  };
};

export default useBrowser;
