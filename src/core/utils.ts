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