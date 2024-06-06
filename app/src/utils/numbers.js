export const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 3 });

export const customFormat = (number, digits) => {
  const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: digits });

  return formatter.format(number);
};
