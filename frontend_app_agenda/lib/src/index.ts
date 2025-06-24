import { CalendarElement } from './calendarelement/calendarElement'
import type { CalendarOptions, CalendarSource, CustomTranslation, ServerSource } from './types'
import './index.css'
import './i18n'
import i18n from './i18n'

export async function createCalendar(
  sources: (ServerSource | CalendarSource)[],
  target: Element | Document | ShadowRoot,
  options?: CalendarOptions,
  translations?: CustomTranslation,
) {
  for (const [lng, translation] of Object.entries(translations ?? {})) {
    i18n.addResourceBundle(lng, 'translation', translation)
  }
  // return CalendarClient.create(sources, target, options)
  const calendar = new CalendarElement()
  await calendar.create(sources, target, options)
  return calendar
}
