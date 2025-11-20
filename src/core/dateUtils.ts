export class DateUtils {
  static readonly ONE_DAY_MS = 24 * 60 * 60 * 1000;

  static format(date: Date, format = 'yyyy-MM-dd'): string {
    const o: Record<string, any> = {
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'h+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds(),
      'q+': Math.floor((date.getMonth() + 3) / 3),
      W: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
    };
    if (/(y+)/.test(format))
      format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    for (let k in o)
      if (new RegExp('(' + k + ')').test(format))
        format = format.replace(
          RegExp.$1,
          RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
        );
    return format;
  }

  static addDays(date: Date, days: number): Date {
    const r = new Date(date);
    r.setDate(r.getDate() + days);
    return r;
  }

  static addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setDate(1);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  static addYears(date: Date, years: number): Date {
    const r = new Date(date);
    r.setFullYear(r.getFullYear() + years);
    return r;
  }

  static diffDays(date1: Date, date2: Date): number {
    return Math.round(
      (new Date(date2.getFullYear(), date2.getMonth(), date2.getDate()).getTime() -
        new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()).getTime()) /
      this.ONE_DAY_MS
    );
  }

  static diffDaysInclusive(date1: Date, date2: Date): number {
    return this.diffDays(date1, date2) + 1;
  }

  static getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  static getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // @ts-ignore
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  }

  static getStartOfWeek(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay() || 7;
    if (day !== 1) date.setHours(-24 * (day - 1));
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  static getStartOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  static getStartOfYear(d: Date): Date {
    return new Date(d.getFullYear(), 0, 1);
  }
}