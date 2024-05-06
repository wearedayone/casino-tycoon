import { useLocation } from 'react-router-dom';

// Icons
import { UnchartedLogo } from '../components/UnchartedLogo';
import { DiscordIcon } from '../components/DiscordIcon';
import { XIcon } from '../components/XIcon';
import { MediumIcon } from '../components/MediumIcon';

const Footer = () => {
  const { pathname } = useLocation();

  return (
    <footer
      className={`relative w-full px-[20px] sm:px-16 ${
        pathname && pathname.length === 1
          ? 'lg:h-[160px] pb-[52px] lg:pb-0 pt-8 lg:pt-16 items-center lg:items-start'
          : 'pb-[52px] lg:pb-0 pt-8 lg:pt-0 lg:h-[85px] items-center'
      } bg-default border-t border-white/10 flex flex-col lg:flex-row justify-between gap-8 lg:gap-0`}>
      <UnchartedLogo style="w-[150px] lg:w-[120px]" />
      <div className="flex flex-col lg:flex-row items-center gap-4 3xl:gap-16">
        <div className="flex flex-row items-start gap-4 order-3 lg:order-1">
          <a
            href="https://uncharted.gg/terms-of-service"
            target="_blank"
            className="text-base font-normal text-white/30 hover:text-white transition duration-150 ease-out">
            Terms of Service
          </a>
          <a
            href="https://uncharted.gg/privacy-policy"
            target="_blank"
            className="text-base font-normal text-white/30 hover:text-white transition duration-150 ease-out">
            Privacy policy
          </a>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-4 order-1 lg:order-2">
          <a href="mailto:support@uncharted.gg" className="font-normal underline text-base text-white">
            support@uncharted.gg
          </a>
          <div className="flex flex-row items-center gap-4">
            <a href="https://medium.com/@unchartedgg" target="_blank" className="group/link">
              <MediumIcon style="fill-white max-w-[20px] h-[20px] group-hover/link:opacity-80 transition duration-150 ease-out" />
            </a>
            <a href="https://discord.com/invite/nVyGcEPVmj" target="_blank" className="group/link">
              <DiscordIcon style="fill-white max-w-[20px] h-[20px] group-hover/link:opacity-80 transition duration-150 ease-out" />
            </a>
            <a href="https://twitter.com/gguncharted" target="_blank" className="group/link">
              <XIcon style="fill-white max-w-[20px] h-[20px] group-hover/link:opacity-80 transition duration-150 ease-out" />
            </a>
          </div>
        </div>
        <div
          className={`xl:absolute order-2 ${
            pathname && pathname.length === 1 ? 'top-16' : 'top-1/2 -translate-y-1/2'
          } left-[216px] 2xl:left-1/2 2xl:-translate-x-1/2 text-base font-normal text-white/50`}>
          © Copyright 2024 Uncharted
        </div>
      </div>
    </footer>
  );
};

export default Footer;
