// Components
import { Clip } from './Clip';

export const Button = ({
  id,
  type = 'button',
  icon,
  url,
  target,
  download,
  disabled,
  submit,
  secondary,
  style,
  onClick,
  children,
}) => {
  let defaultStyle = `
		flex flex-row items-center text-base/none text-white font-medium justify-center gap-3 ${
      icon ? 'pl-14 pr-10' : 'px-12'
    } h-[54px] md+:h-[58px] border-none ${
    secondary
      ? 'bg-blue md:hover:bg-blue/90 active:bg-blue md:active:bg-blue/90'
      : 'bg-violet md:hover:bg-violet-700 active:bg-violet-700 md:active:bg-violet-800'
  } whitespace-nowrap uppercase transition duration-150 ease-out 
		${disabled && 'pointer-events-none !bg-default-light px-16'}
		${style}
	`;

  return (
    <Clip value={20} tr bl>
      {url ? (
        <a id={id} href={url} target={target} download={download} className={defaultStyle}>
          {children}
        </a>
      ) : (
        <button
          id={id}
          type={type}
          className={defaultStyle}
          disabled={disabled}
          form={submit ? submit : undefined}
          onClick={onClick}>
          {children}
        </button>
      )}
    </Clip>
  );
};
