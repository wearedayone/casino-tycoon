export const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 3 });

export const customFormat = (number, digits) => {
  const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: digits });

  return formatter.format(number);
};

export const randomNumberInRange = (min, max) => {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
};
