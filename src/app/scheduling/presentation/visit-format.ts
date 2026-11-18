import {TranslateService} from '@ngx-translate/core';
import {DateKey, keyToDate} from '../domain/services/calendar';

/** Locale used for dates in the agenda, following the interface language. */
export function agendaLocale(translate: TranslateService): string {
  return translate.getCurrentLang() === 'en' ? 'en-US' : 'es-PE';
}

/** "jueves 19 de noviembre" (or "Thursday, November 19"). */
export function longDay(key: DateKey, locale: string): string {
  return new Intl.DateTimeFormat(locale, {weekday: 'long', day: 'numeric', month: 'long'}).format(keyToDate(key));
}

/** "19/11/2026". */
export function shortDate(key: DateKey, locale: string): string {
  return new Intl.DateTimeFormat(locale, {day: '2-digit', month: '2-digit', year: 'numeric'}).format(keyToDate(key));
}
