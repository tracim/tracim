import React, { useCallback, useEffect, useMemo, useState } from "react"
import { createAccount, createCalendarObject, DAVCalendar, DAVNamespaceShort, fetchCalendarObjects, fetchCalendars, propfind, updateCalendarObject } from "tsdav"
import { Calendar, CalendarProps, dateFnsLocalizer, EventPropGetter } from 'react-big-calendar'
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// TRANSLATIONS
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import { convertIcsCalendar, convertIcsTimezone, DateObjectType, extendByRecurrenceRule, generateIcsCalendar, generateIcsDuration, IcsCalendar, IcsDateObject, IcsDuration, IcsEvent } from "ts-ics"
import Popup from "./Popup"
import { CalendarEvent, CalendarObject, isEventAllDay } from "./types"
import EventModal, { ModalMode } from "./EventModal"
import { addMilliseconds } from "date-fns"
import { tzlib_get_ical_block, tzlib_get_timezones } from "timezones-ical-library"

export interface CalendarDavProps {
  serverUrl?: string,
  calendarUrls?: string[],
  headers: Record<string, string>
  fetchOptions?: RequestInit
  onEventDatesChanged?: (start: Date, end: Date) => CalendarEvent
  onViewEvent?: (event: CalendarEvent) => CalendarEvent | null
  onCreateEvent?: (start: Date, end: Date) => CalendarEvent | null
}

export function offsetDate(date: IcsDateObject, offset: number): IcsDateObject {
  return {
    type: date.type,
    date: addMilliseconds(date.date, offset),
    local: date.local && {
      date: addMilliseconds(date.local.date, offset),
      timezone: date.local.timezone,
      tzoffset: date.local.tzoffset,
    },
  }
}

export function isSameDate(a: IcsDateObject, b: IcsDateObject) {
  return a.date.getTime() === b.date.getTime() && a.type === b.type && a.local?.timezone === b.local?.timezone
}

export function isSameEvent(a: IcsEvent, b: IcsEvent) {
  return a.uid === b.uid && (!!a.recurrenceId === !!b.recurrenceId) && isSameDate(a.recurrenceId.value, b.recurrenceId.value)
}

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar)

export const fetchCalendar = async (url: string, headers?: Record<string, string>, fetchOptions?: RequestInit): Promise<DAVCalendar> => {
  const props = {
    [`${DAVNamespaceShort.CALDAV}:calendar-description`]: {},
    [`${DAVNamespaceShort.CALDAV}:calendar-timezone`]: {},
    [`${DAVNamespaceShort.DAV}:displayname`]: {},
    [`${DAVNamespaceShort.CALDAV_APPLE}:calendar-color`]: {},
    [`${DAVNamespaceShort.CALENDAR_SERVER}:getctag`]: {},
    [`${DAVNamespaceShort.DAV}:resourcetype`]: {},
    [`${DAVNamespaceShort.CALDAV}:supported-calendar-component-set`]: {},
    [`${DAVNamespaceShort.DAV}:sync-token`]: {},
  }
  const res = await propfind({ url, props, headers, fetchOptions })
  const calendar = res[0]
  if (calendar.error) {
    // TODO
  }
  const description = calendar.props?.calendarDescription;
  const timezone = calendar.props?.calendarTimezone;

  return {
    description: typeof description === 'string' ? description : '',
    timezone: typeof timezone === 'string' ? timezone : '',
    url: url,
    ctag: calendar.props?.getctag,
    calendarColor: calendar.props?.calendarColor,
    displayName: calendar.props?.displayname._cdata ?? calendar.props?.displayname,
    components: Array.isArray(calendar.props?.supportedCalendarComponentSet.comp)
      ? calendar.props?.supportedCalendarComponentSet.comp.map((sc: any) => sc._attributes.name)
      : [calendar.props?.supportedCalendarComponentSet.comp?._attributes.name],
    resourcetype: Object.keys(calendar.props?.resourcetype),
    syncToken: calendar.props?.syncToken,
    projectedProps: Object.fromEntries(Object.entries(calendar.props ?? {}).filter(([key]) => props?.[key])),
  }
}

export default function CalendarDav({ serverUrl, calendarUrls, headers, fetchOptions }: CalendarDavProps) {
  const [davCalendars, setCalendars] = useState<DAVCalendar[]>([])
  const [visibleCalendars, setVisibleCalendars] = useState<boolean[]>([])
  const [davCalendarsObjects, setCalendarsObjects] = useState<CalendarObject[]>([])

  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.View)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>(null)
  //@ts-ignore
  const timezones: string[] = useMemo(() => tzlib_get_timezones(), [])

  useEffect(() => {
    if (!!calendarUrls) {
      Promise.all(calendarUrls.map(url => fetchCalendar(url, headers, fetchOptions)))
        .then(cs => {
          setCalendars(cs)
          setVisibleCalendars(cs.map(cs => true))
        })
      }
      else if (!!serverUrl) {
        createAccount({
          account: { serverUrl, accountType: "caldav" },
          headers,
          fetchOptions,
        }).then(account => fetchCalendars({ account, headers, fetchOptions }))
        .then(cs => {
          setCalendars(cs)
          setVisibleCalendars(cs.map(cs => true))
        })
    } else {
      throw "At least `serverUrl` or `calendarUrls` must be set"
    }

  }, [serverUrl, calendarUrls, headers, fetchOptions])

  useEffect(() => {
    var promises = davCalendars.map(c => fetchCalendarObjects({ calendar: c, headers, fetchOptions }))
    Promise.all(promises).then(cos => setCalendarsObjects(cos.map((co, i) => co.map(c => ({ ...c, calendarUrl: davCalendars[i].url }))).flat()))
  }, [davCalendars, headers, fetchOptions])

  const fetchEvents = useCallback(() => {
    var promises = davCalendars.map(c => fetchCalendarObjects({ calendar: c, headers, fetchOptions }))
    Promise.all(promises).then(cos => setCalendarsObjects(cos.map((co, i) => co.map(c => ({ ...c, calendarUrl: davCalendars[i].url }))).flat()))
  }, [davCalendars, headers, fetchOptions])

  useEffect(() => fetchEvents(), [fetchEvents])

  const [events, recurringEvents] = useMemo(() => {
    let events: CalendarEvent[] = []
    let recurringEvents: CalendarEvent[] = []
    for (const object of davCalendarsObjects) {
      const calendar = davCalendars.find(c => c.url === object.calendarUrl)!
      const icsCalendar = convertIcsCalendar(undefined, object.data)

      for (let i = 0; i < icsCalendar.events.length; i++) {
        const event = icsCalendar.events[i]
        if (!event.recurrenceRule) {
          if (event.recurrenceId) events = events.filter(e => !isSameEvent(e.event, event))
          events.push({
            event,
            color: calendar.calendarColor,
            index: i,
            objectUrl: object.url,
          })
        } else {
          recurringEvents.push({
            event,
            color: calendar.calendarColor,
            index: i,
            objectUrl: object.url,
          })
          const dates = extendByRecurrenceRule(event.recurrenceRule, { start: event.start.date, exceptions: event.exceptionDates?.map(e => e.date) })
          for (const date of dates) {
            const recEvent: CalendarEvent = {
              //@ts-ignore
              event: {
                ...event,
                start: offsetDate(event.start, date.getTime() - event.start.date.getTime()),
                end: offsetDate(event.end, date.getTime() - event.start.date.getTime()),
                recurrenceRule: undefined,
                recurrenceId: { value: offsetDate(event.start, date.getTime() - event.start.date.getTime()) },
              },
              color: calendar.calendarColor,
              index: -1,
              objectUrl: object.url,
            }
            if (!events.find(e => isSameEvent(e.event, recEvent.event))) events.push(recEvent)
          }
        }
      }
    }
    return [events, recurringEvents]
  }, [davCalendars, davCalendarsObjects])


  const displayedEvents = useMemo(() => events.filter(event => {
    const calendarObject = davCalendarsObjects.find(o => o.url === event.objectUrl)
    const calendarIndex = davCalendars.findIndex(c => c.url === calendarObject.calendarUrl)
    return visibleCalendars[calendarIndex]
  }), [events, visibleCalendars, davCalendars, davCalendarsObjects])

  const getEventStyle: EventPropGetter<CalendarEvent> = (event, start, end, isSelected) => {
    var style = {
      backgroundColor: event.color,
      borderRadius: '5px',
      opacity: 0.75,
      border: `1px solid ${event.color}`,
      display: 'block',
    }
    return { style: style }
  }

  // BUG timezones
  const onChangeDates: NonNullable<withDragAndDropProps<CalendarEvent>['onEventResize']> = ({ event, start, end }) => {
    var startDelta = new Date(start).getTime() - event.event.start.date.getTime()
    event.event.start = offsetDate(event.event.start, startDelta)
    var endDelta = new Date(end).getTime() - event.event.end.date.getTime()
    event.event.end = offsetDate(event.event.end, endDelta)
    updateEvent(event)
  }

  const validateTimezones = (calendar: IcsCalendar) => {
    const wantedTzids = new Set(calendar.events.flatMap(e => [e.start.local?.timezone, e.end.local?.timezone]).flat().filter(s => !!s))

    if (calendar.timezones == undefined) {
      if (wantedTzids.size === 0) return calendar
      calendar.timezones = []
    }
    // Remove extra timezones
    calendar.timezones = calendar.timezones.filter(tz => wantedTzids.has(tz.id))

    // Add missing timezones
    wantedTzids.forEach(tzid => {
      if (calendar.timezones.findIndex(t => t.id === tzid) === -1) {
        //@ts-ignore
        calendar.timezones.push(convertIcsTimezone(undefined, tzlib_get_ical_block(tzid)[0]))
      }
    })
    return calendar
  }

  // TODO change event to another calendar
  const updateEvent: (event: CalendarEvent) => void = useCallback(event => {
    const calendarObject = davCalendarsObjects.find(o => o.url === event.objectUrl)
    const icsCalendar = convertIcsCalendar(undefined, calendarObject.data)
    if (event.event.recurrenceRule) {
      for (let i = 0; i < icsCalendar.events.length; i++) {
        const element = icsCalendar.events[i];
        if (i == event.index) continue
        else if (element.uid == event.event.uid) {
          const reccurenceOffset = element.recurrenceId.value.date.getTime() - icsCalendar.events[event.index].start.date.getTime()
          element.recurrenceId = { value: offsetDate(event.event.start, reccurenceOffset) }
        }
      }
    }
    if (event.index == -1) icsCalendar.events.push(event.event)
    else icsCalendar.events[event.index] = { ...event.event, sequence: (event.event.sequence ?? 0) + 1 }

    validateTimezones(icsCalendar)
    var newCalendarObject = { ...calendarObject, data: generateIcsCalendar(icsCalendar) }
    updateCalendarObject({ calendarObject: newCalendarObject, headers, fetchOptions })
      .then(r => {
        if (!r.ok) throw "something went wrong"
        newCalendarObject.etag = r.headers.get('Etag')!
        setCalendarsObjects(davCalendarsObjects.map(o => o.url === newCalendarObject.url ? newCalendarObject : o))
      })
  }, [davCalendarsObjects, headers, fetchOptions])

  const createEvent = useCallback((calendarUrl: string, event: CalendarEvent) => {
    const calendar = davCalendars.find(c => c.url === calendarUrl)
    const uid = crypto.randomUUID()
    const icsCalendar: IcsCalendar = {
      prodId: '-//algoo.fr//NONSGML Tracim//EN',
      version: '2.0',
      events: [event.event],
    }
    validateTimezones(icsCalendar)
    const data = generateIcsCalendar(icsCalendar)
    createCalendarObject({
      calendar,
      iCalString: data,
      filename: `${uid}.ics`,
      headers,
      fetchOptions
    }).then(r => {
      if (!r.ok) return
      setCalendarsObjects([...davCalendarsObjects, { url: `${calendar.url}/${uid}.ics`, calendarUrl: calendar.url, data, etag: r.headers.get('Etag')! }])
    })
  }, [davCalendarsObjects, headers, fetchOptions])


  const icsDateToDate = (date: IcsDateObject, isEnd?: boolean) => {
    var jsDate = date.type == "DATE-TIME" ? new Date(date.date) : new Date(date.date.toDateString())
    // if (isEnd && jsDate.getHours() === 0 && jsDate.getMinutes() === 0) {
    //   jsDate.setMinutes(jsDate.getMinutes() - 1)
    // }
    return jsDate
  }

  const onSelectSlot: NonNullable<CalendarProps<CalendarEvent>['onSelectSlot']> = useCallback(({ start, end }) => {
    var type: DateObjectType = start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0
      && end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0 ? "DATE" : "DATE-TIME"
    setSelectedEvent({
      event: {
        summary: "",
        start: {
          date: start,
          type: type
        },
        end: {
          date: end,
          type: type
        },
        uid: crypto.randomUUID(),
        stamp: { date: new Date() },
      },
      color: "",
      index: 0,
      objectUrl: ""
    })
    setModalMode(ModalMode.Create)
    setModalOpen(true)
  }, [davCalendars, davCalendarsObjects, headers, fetchOptions])

  const onEventSubmited = useCallback((calendarUrl: string, event: IcsEvent) => {
    if (modalMode === ModalMode.Create) {
      createEvent(calendarUrl, { ...selectedEvent, event })
      setModalOpen(false)
    } else if (modalMode === ModalMode.Edit) {
      updateEvent({ ...selectedEvent, event })
      setModalOpen(false)
    }
  }, [modalOpen, selectedEvent])

  const onDoubleClickEvent = useCallback((event: CalendarEvent) => {
    console.log(event)
    if (event.event.recurrenceId) {
      var allEvents = !!window.prompt("edit all events ?")
      if (allEvents) setSelectedEvent(recurringEvents.find(e => e.event.uid === event.event.uid))
      else setSelectedEvent(event)
    } else setSelectedEvent(event)
    setModalMode(ModalMode.Edit)
    setModalOpen(true)
  }, [recurringEvents])


  const onSetCalendarChecked = useCallback((cUrl: string, checked: boolean) => {
    const calendarIndex = davCalendars.findIndex(c => c.url === cUrl)
    setVisibleCalendars(value => value.map((c, i) => i == calendarIndex ? checked :c))
  }, [davCalendars])

  return (<>
    <button onClick={() => fetchEvents()}>Refresh events</button>
    {selectedEvent && <Popup isOpen={modalOpen} onClosePopup={() => setModalOpen(false)}>
      <EventModal
        calendars={davCalendars}
        timezones={timezones}
        mode={modalMode}
        event={selectedEvent.event}
        onSubmit={onEventSubmited}
        onCancel={() => setModalOpen(false)}
      />
    </Popup>}
    <div>
      {davCalendars.map((c, i) => <div key={c.url} >
        <label>{c.displayName}</label>
        <input type="checkbox" onChange={e => onSetCalendarChecked(c.url, e.target.checked)} defaultChecked={visibleCalendars[i]}/>
        <br />
      </div>)}
    </div>
    <DnDCalendar
      defaultView='week'
      events={displayedEvents}
      localizer={localizer}
      onEventDrop={onChangeDates}
      onEventResize={onChangeDates}
      eventPropGetter={getEventStyle}
      onDoubleClickEvent={onDoubleClickEvent}
      // onSelectEvent={onSelectEvent}
      showMultiDayTimes
      showAllEvents
      onSelectSlot={onSelectSlot}
      resizable
      selectable
      style={{ height: '80vh' }}
      // BUG setting CustomEvents breaks the `+ X` popup
      // components={{ event: CustomEvent }}
      dayLayoutAlgorithm={'no-overlap'}

      //@ts-ignore
      titleAccessor={e => <>
        <div>
          <h1>
            {e.event.summary}
            {e.event.alarms && <span title={e.event.alarms.map(a => generateIcsDuration(a.trigger.value as IcsDuration)).join("\n")}>🔔</span>}
          </h1>
          {e.event.description && <>{
            e.event.descriptionAltRep?.startsWith("data:text/html,") ?
              <div dangerouslySetInnerHTML={{ __html: decodeURIComponent(e.event.descriptionAltRep.slice(15)) }}></div> :
              e.event.description
          }<br /></>}
        </div>
        {e.event.organizer && e.event.attendees && <div>
          Organizer: {e.event.organizer.name ?? e.event.organizer.email}<br />
          Attendees: {e.event.attendees.map((a, i) => <span key={a.email + i} title={a.partstat}>{a.name ?? a.email}, </span>)}
        </div>}
      </>}
      allDayAccessor={e => isEventAllDay(e.event)}
      startAccessor={e => icsDateToDate(e.event.start)}
      endAccessor={e => icsDateToDate(e.event.end, true)} // BUG extra day with all day and extra time slot if end of day
      tooltipAccessor={e => e.event.description}
    />
  </>)
}

const locales = {
  'en-US': enUS,
}
// The types here are `object`. Strongly consider making them better as removing `locales` caused a fatal error
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})