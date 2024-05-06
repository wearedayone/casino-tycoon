import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Components
import { UnchartedLogo } from './UnchartedLogo';
import { Button } from './Button';
import { Clip } from './Clip';

// Icons
import { DiscordIcon } from './DiscordIcon';
import { XIcon } from './XIcon';
import { MediumIcon } from './MediumIcon';
import { ChevronIcon } from './ChevronIcon';

import useAppContext from '../contexts/useAppContext';
import useBrowser from '../hooks/useBrowser';

// Data
import { links } from '../utils/links';

import { toast } from 'sonner';
import { stripWalletAddress } from '../utils/strings';
import { getOauthRequestToken } from '../services/twitter.service';

const Header = () => {
  const { isBrowser } = useBrowser();
  const lastScrollTop = useRef(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isTwitterConnecting, setIsTwitterConnecting] = useState(false);

  const {
    walletState: { logout },
    connectWalletState: { logout: logoutConnectWallet },
    userState: { user },
  } = useAppContext();

  const nav = useRef(null);
  const indicator = useRef(null);
  const navLinks = useRef([]);
  const launchpadRef = useRef(null);
  const rewardsRef = useRef(null);

  const { pathname } = useLocation();

  /**
   * initiates connecting to twitter
   * generates ssoProvider link and should redirect into it
   */
  const onConnectToTwitter = useCallback(async () => {
    if (!user || isTwitterConnecting) return;

    setIsTwitterConnecting(true);
    try {
      const res = await getOauthRequestToken();
      const { oauth_token } = res.data;
      const url = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}`;
      window.location.href = url;
    } catch (err) {
      toast.error(err.message);
    }
    setIsTwitterConnecting(false);
  }, [user]);

  const onLogoutClick = useCallback(async () => {
    try {
      await logout();
      await logoutConnectWallet();
    } catch (ex) {
      console.error(ex);
      toast.error(`Failed to logout`);
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!isBrowser) return;

    const st = window.scrollY || document.documentElement.scrollTop;
    if (st > lastScrollTop.current && window.scrollY > 80) {
      // downscroll code
      if (nav.current) {
        nav.current.classList.add('-translate-y-[80px]');
      }
    } else {
      // upscroll code
      if (nav.current) {
        nav.current.classList.remove('-translate-y-[80px]');
      }
    }
    lastScrollTop.current = st <= 0 ? 0 : st;
  }, [isBrowser]);

  useEffect(() => {
    if (!pathname || pathname.length !== 1) return;

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  navLinks.current = links.map((_, i) => navLinks.current[i] ?? createRef());
  navLinks.current.push(launchpadRef, rewardsRef);

  const handleToggleMenu = useCallback(() => {
    const id = setTimeout(() => setIsDisabled(false), 1000);
    if (nav.current) {
      nav.current.classList.toggle('is-opened');
      document.documentElement.classList.toggle('scroll-disabled');

      if (nav.current.classList.contains('is-opened')) {
        const event = new CustomEvent('stopLenis');
        window.dispatchEvent(event);
      } else {
        const event = new CustomEvent('resumeLenis');
        window.dispatchEvent(event);
      }
    }

    return () => clearTimeout(id);
  }, [nav.current]);

  // INITIAL indicator position
  useEffect(() => {
    const activeLink = navLinks.current.find((link) => link.current && link.current.classList.contains('active'));
    if (indicator.current && activeLink?.current && activeLink?.current.offsetParent instanceof HTMLElement) {
      const index = navLinks.current.indexOf(activeLink);

      // Setting left position of indicator
      window.innerWidth >= 1512
        ? (indicator.current.style.left = `${
            (window.innerWidth >= 1512 ? activeLink?.current.offsetParent.offsetLeft : 0) -
            (index <= 4 && window.innerWidth >= 1512 ? activeLink?.current.offsetParent.offsetWidth / 2 : 0) +
            activeLink.current.offsetLeft +
            8
          }px`)
        : (indicator.current.style.left = `${activeLink.current.offsetLeft + 8}px`);

      // Setting width of indicator
      indicator.current.style.width = `${activeLink.current.offsetWidth - 16}px`;
    }
  }, [user]);

  // ON HOVER indicator position
  useEffect(() => {
    if (!isBrowser) return;

    if (indicator.current && navLinks.current.length > 0) {
      const clickHandlers = [];
      const mouseOverHandlers = [];
      const mouseLeaveHandlers = [];

      navLinks.current.forEach((link, index) => {
        if (link.current) {
          const clickHandler = (event) => {
            navLinks.current.forEach((link) => link.current && link.current.classList.remove('active'));
            if (event.target instanceof HTMLElement) {
              event.target.classList.add('active');
            }
          };
          link.current.addEventListener('click', clickHandler);
          clickHandlers.push(clickHandler);

          const mouseOverHandler = (event) => {
            if (
              indicator.current &&
              event.target instanceof HTMLElement &&
              event.target.offsetParent instanceof HTMLElement
            ) {
              //  eslint-disable-next-line
              event.target.offsetLeft > 100
                ? window.innerWidth >= 1512
                  ? (indicator.current.style.left = `${
                      event.target.offsetParent.offsetLeft -
                      (index <= 4 && window.innerWidth >= 1512 ? event.target.offsetParent?.offsetWidth / 2 : 0) +
                      event.target.offsetLeft +
                      8
                    }px`)
                  : (indicator.current.style.left = `${event.target.offsetLeft + 8}px`)
                : null;
              // Setting width of indicator
              indicator.current.style.width = `${event.target.offsetWidth - 16}px`;
            }
          };
          link.current.addEventListener('mouseover', mouseOverHandler);
          mouseOverHandlers.push(mouseOverHandler);

          const mouseLeaveHandler = () => {
            const activeLink = navLinks.current.find(
              (link) => link.current && link.current.classList.contains('active')
            );
            if (indicator.current && activeLink?.current && activeLink?.current.offsetParent instanceof HTMLElement) {
              const activeIndex = navLinks.current.indexOf(activeLink);
              indicator.current.style.left = `${
                activeLink?.current.offsetParent.offsetLeft -
                (activeIndex <= 4 && window.innerWidth >= 1512 ? activeLink?.current.offsetParent.offsetWidth / 2 : 0) +
                activeLink.current.offsetLeft +
                8
              }px`;
              indicator.current.style.width = `${activeLink.current.offsetWidth - 16}px`;
            }
          };
          link.current.addEventListener('mouseleave', mouseLeaveHandler);
          mouseLeaveHandlers.push(mouseLeaveHandler);
        }
      });

      return () => {
        navLinks.current.forEach((link, index) => {
          if (link.current) {
            link.current.removeEventListener('click', clickHandlers[index]);
            link.current.removeEventListener('mouseover', mouseOverHandlers[index]);
            link.current.removeEventListener('mouseleave', mouseLeaveHandlers[index]);
          }
        });
      };
    }
  }, [indicator.current, navLinks.current, isBrowser]);

  return (
    <div
      ref={nav}
      id="nav"
      className={`group w-[100vw] h-dvh fixed top-0 left-0 z-[100] pointer-events-none transition-all duration-500 ease-easeInOutCubic`}>
      <nav
        className={`tracking-normal relative z-[100] w-full mx-auto h-[80px] px-[20px] sm:px-16 bg-default flex flex-row items-center justify-between xl:border-b border-white/10 pointer-events-auto`}
        style={{ transform: 'translate3d(0,0,0)' }}>
        <UnchartedLogo style="2xl:absolute 2xl:left-16 2xl:top-1/2 2xl:-translate-y-1/2 w-[clamp(150px,16vw,170px)]" />
        <div className="2xl:absolute z-[3] h-full 2xl:top-1/2 2xl:left-1/2 2xl:-translate-y-1/2 2xl:-translate-x-1/2 hidden xl:flex flex-row items-center justify-center px-3">
          {links.map(({ name, url, sublinks }, index) =>
            url ? (
              <a
                key={name + '_' + index}
                ref={navLinks.current[index]}
                target="_blank"
                href={url}
                className={`nav-link relative z-[1] h-full flex flex-row items-center gap-2 text-white text-base font-normal uppercase whitespace-nowrap px-2 lg:px-3 2xl:px-[20px] ${
                  index === 0 && 'active opacity-100'
                }`}>
                {name === 'Token' ? (
                  <>
                    <video autoPlay playsInline loop muted className="w-[20px] h-[20px]">
                      <source src="/videos/coin-safari.mp4" type="video/mp4" />
                      <source src="/videos/coin-vp9.mp4" type="video/webp" />
                    </video>
                  </>
                ) : null}
                {name}
              </a>
            ) : (
              <div
                key={name + '_' + index}
                ref={navLinks.current[navLinks.current.length - 3]}
                className="group/menu nav-link relative z-[3] h-full flex flex-row items-center gap-2 text-white text-base font-normal px-2 lg:px-3 2xl:px-[20px] uppercase whitespace-nowrap cursor-pointer">
                {name}
                <ChevronIcon style="w-3 text-seagull" />
                <div
                  className="
										group-hover/menu:visible group-hover/menu:opacity-100 translate-y-[calc(80%+10px)] group-hover/menu:translate-y-[80%] invisible opacity-0 absolute z-[3] bottom-0 right-3
										flex flex-row items-center justify-center p-px bg-gradient-to-r from-violet/20 to-seagull/20
										transition-all duration-300 ease-out
									">
                  <div className="p-[18px] flex flex-col items-center gap-4 bg-default">
                    {sublinks?.map(({ name, url }, index) => (
                      <a
                        key={name + '_' + index}
                        href={url}
                        target="_blank"
                        className="group/link w-full flex justify-center">
                        {name === 'Medium' ? (
                          <MediumIcon style="w-6 fill-white group-hover/link:opacity-80 transition-opacity duration-150 ease-out" />
                        ) : name === 'X' ? (
                          <XIcon style="w-5 fill-white group-hover/link:opacity-80 transition-opacity duration-150 ease-out" />
                        ) : (
                          <DiscordIcon style="w-6 fill-white group-hover/link:opacity-80 transition-opacity duration-150 ease-out" />
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
        <div className="2xl:absolute z-[3] 2xl:right-16 2xl:top-1/2 2xl:-translate-y-1/2 flex h-full flex-row items-center justify-end gap-3 2xl:gap-6">
          {user && pathname !== '/login' ? (
            <div className="h-full flex flex-row items-center justify-end 2xl:gap-2">
              <a
                href="https://uncharted.gg/"
                target="_blank"
                ref={launchpadRef}
                className="nav-link hidden xl:flex relative z-[1] h-full flex flex-row items-center gap-2 text-white text-base font-normal uppercase whitespace-nowrap px-2 lg:px-3 2xl:px-[20px]">
                launchpad
              </a>
              <a
                href="https://uncharted.gg/dashboard/rewards"
                target="_blank"
                ref={rewardsRef}
                className="nav-link hidden xl:flex relative z-[1] h-full flex flex-row items-center gap-2 text-white text-base font-normal uppercase whitespace-nowrap px-2 lg:px-3 2xl:px-[20px]">
                rewards
              </a>
              <div className="group/user h-full relative flex flex-row gap-2 items-center ml-2">
                <div className="relative size-12 flex items-center justify-center bg-gradient-to-r from-violet to-seagull rounded-full overflow-hidden">
                  <div className="absolute top-px left-px size-[calc(100%-2px)] rounded-full overflow-hidden bg-default">
                    <img
                      src={user?.avatarURL || '/images/mobster.png'}
                      width={48}
                      height={48}
                      alt="avatar"
                      className="absolute size-full object-cover object-center"
                    />
                  </div>
                </div>
                <p className="hidden sm:block text-white text-sm font-medium uppercase drop-shadow-[0_0px_10px_rgba(144,74,255,1.0)]">
                  {user?.username || stripWalletAddress(user?.id)}
                </p>
                <div
                  className="
											group-hover/user:visible group-hover/user:opacity-100 group-hover/user:translate-y-[calc(100%+24px)] translate-y-[calc(100%+32px)] invisible opacity-0 absolute z-[5] bottom-[36px] -right-[54px]
											flex flex-row items-center justify-center p-px bg-gradient-to-r from-violet/20 to-seagull/20 min-w-[360px]
											transition-all duration-300 ease-out
										">
                  <div className="p-[28px] flex flex-col items-center gap-8 bg-default w-full">
                    <p className="text-white text-xl/tight font-medium whitespace-nowrap">
                      Welcome back{' '}
                      <span className="text-gradient">{user?.username || stripWalletAddress(user?.id)}</span>
                    </p>
                    <div className="w-full flex flex-col items-center gap-[20px]">
                      <div className="w-full h-px bg-gradient-to-r from-violet to-seagull" />
                      {!!user?.socials?.twitter?.verified ? (
                        <>
                          <div className="w-full max-w-[300px] flex flex-row items-center justify-between gap-2">
                            <p className="text-sm/none text-neutral-100 text-left font-medium">Twitter connected</p>
                            <p className="text-sm/none text-neutral-100 text-left font-medium">{user.username}</p>
                          </div>
                          <div className="w-full h-px bg-gradient-to-r from-violet to-seagull" />
                        </>
                      ) : (
                        <>
                          <Button
                            style="!bg-black group/connect hover:!bg-white hover:text-black"
                            icon
                            disabled={isTwitterConnecting}
                            onClick={onConnectToTwitter}>
                            Connect
                            <XIcon style="w-[15px] fill-white group-hover/connect:fill-black" />
                          </Button>
                          <div className="w-full h-px bg-gradient-to-r from-violet to-seagull" />
                        </>
                      )}
                    </div>
                    <Button onClick={onLogoutClick} style="w-[200px]">
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : pathname !== '/login' ? (
            <Button url="/login" style="px-4 lg:px-12 !h-[54px]">
              Login
            </Button>
          ) : (
            <div className="h-full flex flex-row items-center justify-end 2xl:gap-2">
              <a
                href="https://uncharted.gg/"
                target="_blank"
                ref={launchpadRef}
                className="nav-link hidden xl:flex relative z-[1] h-full flex flex-row items-center gap-2 text-white text-base font-normal uppercase whitespace-nowrap px-2 lg:px-3 2xl:px-[20px]">
                launchpad
              </a>
              <a
                href="https://uncharted.gg/dashboard/rewards"
                target="_blank"
                ref={rewardsRef}
                className="nav-link hidden xl:flex relative z-[1] h-full flex flex-row items-center gap-2 text-white text-base font-normal uppercase whitespace-nowrap px-2 lg:px-3 2xl:px-[20px]">
                rewards
              </a>
            </div>
          )}
          <Clip value={20} tr bl style="bg-violet p-px !block xl:!hidden">
            <div>
              <Button
                style="!px-0 w-[54px] !bg-default"
                icon
                disabled={isDisabled}
                onClick={(e) => {
                  handleToggleMenu();
                  setIsDisabled(true);
                }}>
                <div className="flex flex-col items-center pointer-events-none">
                  <span className="block h-0.5 w-6 bg-violet transition-all duration-300 ease-out -translate-y-[2.5px] group-[.is-opened]:translate-y-1 group-[.is-opened]:rotate-45"></span>
                  <span className="block my-0.5 h-0.5 w-6 bg-violet transition-all duration-300 ease-out opacity-100 group-[.is-opened]:opacity-0"></span>
                  <span className="block h-0.5 w-6 bg-violet transition-all duration-300 ease-out translate-y-[2.5px] group-[.is-opened]:-translate-y-1 group-[.is-opened]:-rotate-45"></span>
                </div>
              </Button>
            </div>
          </Clip>
        </div>
        <div
          ref={indicator}
          className="hidden xl:block absolute z-[2] -bottom-px h-px bg-gradient-to-r from-violet to-seagull transition-all duration-300 ease-easeInOutQuart"
        />
      </nav>
      <div
        id="menu"
        className={`xl:hidden absolute top-[80px] left-0 w-full h-0 group-[.is-opened]:h-[calc(100%-80px)] group-[.is-opened]:md:h-[316px] bg-default transition-all duration-1000 ease-easeInOutQuart border-b border-white/10 flex flex-col items-center md:items-start justify-center md:justify-end gap-8 md:gap-4 md:pl-[100px] overflow-hidden pointer-events-auto`}>
        {links.map(({ name, url, sublinks }, index) =>
          url ? (
            <a
              key={name + '_' + index}
              target="_blank"
              href={url}
              className={`
								nav-link relative z-[1] flex flex-row items-center gap-2 text-2xl md:text-base text-white active:text-white/80 font-normal md:font-light uppercase whitespace-nowrap px-2 md:px-0
								${name === 'Token' && '-translate-x-[14px] md:-translate-x-[6px]'} 
								transition-opacity duration-300 ease-out group-[.is-opened]:delay-700 group-[.is-opened]:opacity-100 opacity-0
							`}
              onClick={() => {
                handleToggleMenu();
                setIsDisabled(true);
              }}>
              {name === 'Token' ? (
                <video autoPlay playsInline loop muted className="w-[20px] h-[20px] blur-[0.5px]">
                  <source src="/videos/coin-safari.mp4" type="video/mp4" />
                  <source src="/videos/coin-vp9.mp4" type="video/webp" />
                </video>
              ) : null}
              {name}
            </a>
          ) : null
        )}
        <a
          key="launchpad"
          href="https://uncharted.gg"
          target="_blank"
          className={`
            nav-link relative z-[1] flex flex-row items-center gap-2 text-2xl md:text-base text-white active:text-white/80 font-normal md:font-light uppercase whitespace-nowrap px-2 md:px-0
            transition-opacity duration-300 ease-out group-[.is-opened]:delay-700 group-[.is-opened]:opacity-100 opacity-0
					`}
          onClick={() => {
            handleToggleMenu();
            setIsDisabled(true);
          }}>
          launchpad
        </a>
        <a
          key="rewards"
          href="https://uncharted.gg/dashboard/rewards"
          target="_blank"
          className={`
						nav-link relative z-[1] flex flex-row items-center gap-2 text-2xl md:text-base text-white active:text-white/80 font-normal md:font-light uppercase whitespace-nowrap px-2 md:px-0
						transition-opacity duration-300 ease-out group-[.is-opened]:delay-700 group-[.is-opened]:opacity-100 opacity-0 pb-[120px] md:pb-[60px]
					`}
          onClick={() => {
            handleToggleMenu();
            setIsDisabled(true);
          }}>
          rewards
        </a>
        <div
          key="socials"
          className="absolute z-[1] bottom-[40px] md:bottom-[60px] left-1/2 md:left-auto right-auto md:right-[100px] -translate-x-1/2 md:translate-x-0 flex flex-row items-center justify-center gap-4 transition-opacity duration-300 ease-out group-[.is-opened]:delay-700 group-[.is-opened]:opacity-100 opacity-0">
          {links[links.length - 1]?.sublinks?.map(({ name, url }, index) => (
            <a key={name + '_' + index} href={url} target="_blank" className="group/link">
              {name === 'Medium' ? (
                <MediumIcon style="h-[20px] fill-white group-hover/link:opacity-80 transition duration-150 ease-out" />
              ) : name === 'X' ? (
                <XIcon style="h-[20px] fill-white group-active/link:opacity-80 transition duration-150 ease-out" />
              ) : (
                <DiscordIcon style="h-[20px] fill-white group-active/link:opacity-80 transition duration-150 ease-out" />
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Header;
