export const numberInputRegex = /^[0-9]*\.?[0-9]*$/;
export const numberCharacterRegex = /[0-9]|\./;
export const integerInputRegex = /^[1-9][0-9]*$/;
export const integerCharacterRegex = /[0-9]/;
export const addressInputRegex = /^(0x?([a-fA-F0-9]{0,40})?)$/;
export const addressCharacterRegex = /x|[a-f]|[A-F]|[0-9]/;
export const getOrdinalSuffix = (number) => {
  // 10 - 19
  if (Math.floor(number / 10) === 1) return 'th';

  const ordinal = number % 10;
  if (ordinal === 1) return 'st';
  if (ordinal === 2) return 'nd';
  if (ordinal === 3) return 'rd';

  return 'th';
};

export const capitalize = (str) => {
  return str[0].toUpperCase() + str.slice(1);
};
