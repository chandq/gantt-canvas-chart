/**
 * 获取第一个有效值
 * @param args 有效值可选项
 * @returns
 */
export function firstValidValue(...args: any[]) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== null && args[i] !== undefined) {
      return args[i];
    }
  }
  return null;
}

/**
 * Finds the minimum and maximum values from a series of numbers,
 * automatically filtering out invalid values such as undefined, null, and NaN.
 *
 * @param values - An array of values to process
 * @returns An object containing min and max values, or null if no valid values exist
 */
export function getMinMax(values: any[]): { min: number; max: number } | null {
  // Filter out invalid values
  const validNumbers = values.filter((value): value is number => {
    return typeof value === 'number' &&
      !isNaN(value) &&
      value !== Infinity &&
      value !== -Infinity;
  });

  // Return null if no valid numbers found
  if (validNumbers.length === 0) {
    return null;
  }

  // Use Math.min and Math.max with spread operator for better performance
  return {
    min: Math.min(...validNumbers),
    max: Math.max(...validNumbers)
  };
}

/**
 * Finds the minimum and maximum values from a series of numbers,for very large datasets using a single-pass algorithm
 * automatically filtering out invalid values such as undefined, null, and NaN.
 *
 * @param values - An array of values to process
 * @returns An object containing min and max values, or null if no valid values exist
 */
export function getMinMaxOptimized(values: any[]): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  let hasValidValue = false;

  for (let i = 0; i < values.length; i++) {
    const value = values[i];

    // Check if value is a valid finite number
    if (typeof value === 'number' &&
      !isNaN(value) &&
      value !== Infinity &&
      value !== -Infinity) {

      hasValidValue = true;

      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  return hasValidValue ? { min, max } : null;
}

/**
 * 将日期转换为一天的开始时间，即0点0分0秒0毫秒
 * @param {Date} value
 * @returns {Date}
 */
export function dateToStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * 将日期转换为一天的结束时间，即23点59分59秒999毫秒
 * @param {Date} value
 * @returns {Date}
 */
export function dateToEnd(value: Date): Date {
  const d = dateToStart(value);
  d.setDate(d.getDate() + 1);
  return new Date(d.getTime() - 1);
}