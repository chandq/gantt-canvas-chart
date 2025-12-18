export class DateUtils {
  static readonly ONE_DAY_MS = 24 * 60 * 60 * 1000;

  static format(date: Date, format = 'yyyy-MM-dd'): string {
    let fmt = format;
    let ret;
    const opt: Record<string, any> = {
      'Y+': `${date.getFullYear()}`, // 年
      'y+': `${date.getFullYear()}`, // 年
      'M+': `${date.getMonth() + 1}`, // 月
      'D+': `${date.getDate()}`, // 日
      'd+': `${date.getDate()}`, // 日
      'h+': `${date.getHours()}`, // 时
      'm+': `${date.getMinutes()}`, // 分
      's+': `${date.getSeconds()}`, // 秒
      'q+': Math.floor((date.getMonth() + 3) / 3),
      W: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
    };
    for (const k in opt) {
      ret = new RegExp('(' + k + ')').exec(fmt);
      if (ret) {
        fmt = fmt.replace(ret[1], ret[1].length === 1 ? opt[k] : opt[k].padStart(ret[1].length, '0'));
      }
    }
    return fmt;
  }

  static addDays(date: Date | string, days: number): Date {
    const r = new Date(date);
    r.setDate(r.getDate() + days);
    return r;
  }

  static addMonths(date: Date | string, months: number): Date {
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