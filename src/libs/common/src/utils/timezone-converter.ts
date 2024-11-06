import moment from 'moment-timezone';

export function utcToAsiaJakarta(utcTime: Date): string {
  return moment
    .utc(utcTime)
    .tz('Asia/Jakarta')
    .format('YYYY-MM-DDTHH:mm:ss.SSS');
}
