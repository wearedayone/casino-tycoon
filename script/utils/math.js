/**
 * To prevent Javascript math inaccuracy
 * @param {number} number 
 * @param {integer} precision 
 * @returns 
 */
export const getAccurate = (number, precision = 6) => {
  const precisionMultiplier = Math.pow(10, precision);

  return Math.round(number * precisionMultiplier) / precisionMultiplier;
};
