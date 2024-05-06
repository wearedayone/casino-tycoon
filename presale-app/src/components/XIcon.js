export const XIcon = ({ style }) => {
  return (
    <svg viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={style}>
      <path
        d="M13.3327 9.3299L21.3917 0.15625H19.4826L12.4821 8.11997L6.89494 0.15625H0.449219L8.89994 12.2L0.449219 21.8188H2.35826L9.74624 13.407L15.648 21.8188H22.0937M3.04728 1.56603H5.9801L19.4812 20.4783H16.5477"
        fill={style.includes('fill-white') ? 'fill-white' : 'url(#grad1)'}
      />
    </svg>
  );
};
