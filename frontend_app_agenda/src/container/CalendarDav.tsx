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
import { convertIcsCalendar, generateIcsCalendar, IcsCalendar, IcsDateObject, IcsEvent, NonStandardValuesGeneric } from "ts-ics"
import Popup from "./Popup"
import { CalendarEvent, CalendarObject, isEventAllDay } from "./types"
import EventModal, { ModalMode } from "./EventModal"
import { addMilliseconds } from "date-fns"

export interface CalendarDavProps {
  serverUrl?: string,
  calendarUrls?: string[],
  headers: Record<string, string>
  fetchOptions?: RequestInit
  onEventDatesChanged?: (start: Date, end: Date) => CalendarEvent
  onViewEvent?: (event: CalendarEvent) => CalendarEvent | null
  onCreateEvent?: (start: Date, end: Date) => CalendarEvent | null
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
  const [davCalendarsObjects, setCalendarsObjects] = useState<CalendarObject[]>([])

  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.View)
  const [selectedEvent, setSelectedEvent] = useState<IcsEvent<NonStandardValuesGeneric> | null>(null)

  useEffect(() => {
    if (!!calendarUrls) {
      Promise.all(calendarUrls.map(url => fetchCalendar(url, headers, fetchOptions)))
        .then(cs => setCalendars(cs))
    }
    else if (!!serverUrl) {
      createAccount({
        account: { serverUrl, accountType: "caldav" },
        headers,
        fetchOptions,
      }).then(account => fetchCalendars({ account, headers, fetchOptions }))
        .then(cs => setCalendars(cs))
    } else {
      throw "At least `serverUrl` or `calendarUrls` must be set"
    }

  }, [serverUrl, calendarUrls, headers, fetchOptions])

  useEffect(() => {
    var promises = davCalendars.map(c => fetchCalendarObjects({ calendar: c, headers, fetchOptions }))
    Promise.all(promises).then(cos => setCalendarsObjects(cos.map((co, i) => co.map(c => ({ ...c, calendarUrl: davCalendars[i].url }))).flat()))
  }, [davCalendars, headers, fetchOptions])

  const events = useMemo<CalendarEvent[]>(() => {
    let allEvents: CalendarEvent[] = []
    for (const object of davCalendarsObjects) {
      const calendar = davCalendars.find(c => c.url === object.calendarUrl)!
      const icsCalendar = convertIcsCalendar(undefined, object.data)

      for (let i = 0; i < icsCalendar.events.length; i++) {
        const event = icsCalendar.events[i]
        allEvents.push({
          ...event,
          color: calendar.calendarColor,
          index: i,
          objectUrl: object.url,
        })
      }
    }
    return allEvents
  }, [davCalendars, davCalendarsObjects])


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
    var startDelta = new Date(start).getTime() - event.start.date.getTime()
    event.start.date = addMilliseconds(event.start.date, startDelta)
    if (event.start.local) event.start.local.date = addMilliseconds(event.start.local.date, startDelta)
    var endDelta = new Date(end).getTime() - event.end.date.getTime()
    event.end.date = addMilliseconds(event.end.date, endDelta)
    if (event.end.local) event.end.local.date = addMilliseconds(event.end.local.date, endDelta)
    updateEvent(event)
  }

  const updateEvent: (event: CalendarEvent) => void = useCallback(event => {
    const calendarObject = davCalendarsObjects.find(o => o.url === event.objectUrl)
    const icsCalendar = convertIcsCalendar(undefined, calendarObject.data)
    icsCalendar.events[event.index] = { ...event }
    var newCalendarObject = { ...calendarObject, data: generateIcsCalendar(icsCalendar) }
    console.log(newCalendarObject.data)
    updateCalendarObject({ calendarObject: newCalendarObject, headers, fetchOptions })
      .then(r => {
        if (!r.ok) throw "something went wrong"
        newCalendarObject.etag = r.headers.get('Etag')!
        setCalendarsObjects(davCalendarsObjects.map(o => o.url === newCalendarObject.url ? newCalendarObject : o))
      })
  }, [davCalendarsObjects, headers, fetchOptions])

  const createEvent: (event: CalendarEvent) => void = useCallback(event => {
    const cIndex = 0 // TODO
    const uid = crypto.randomUUID()
    const icsCalendar: IcsCalendar = {
      prodId: '-//algoo.fr//NONSGML Tracim//EN',
      version: '2.0',
      events: [event],
    }
    const data = generateIcsCalendar(icsCalendar)
    const calendar = davCalendars[cIndex]
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
    // BUG resize all day events
    // if (isEnd && jsDate.getHours() === 0 && jsDate.getMinutes() === 0) {
    //   jsDate.setMinutes(jsDate.getMinutes() - 1)
    // }
    return jsDate
  }

  const onSelectSlot: NonNullable<CalendarProps<CalendarEvent>['onSelectSlot']> = useCallback(({ start, end }) => {
    setSelectedEvent({
      summary: "",
      start: {
        date: start,
        type: "DATE-TIME"
      },
      end: {
        date: end,
        type: "DATE-TIME"
      },
      uid: crypto.randomUUID(),
      stamp: { date: new Date(), type: "DATE-TIME" },
    })
    setModalMode(ModalMode.Create)
    setModalOpen(true)
  }, [davCalendars, davCalendarsObjects, headers, fetchOptions])

  const onEventSubmited = (event: IcsEvent) => {
    if (modalMode === ModalMode.Create) {
      //@ts-ignore
      createEvent({ ...selectedEvent, ...event })
      setModalOpen(false)
    } else if (modalMode === ModalMode.Edit) {
      //@ts-ignore
      updateEvent({...selectedEvent, ...event})
      setModalOpen(false)
    }
  }

  const onDoubleClickEvent = (event: CalendarEvent) => {
    console.log(event)
    setSelectedEvent(event)
    setModalMode(ModalMode.Edit)
    setModalOpen(true)
  }
  return (<>
    {selectedEvent && <Popup isOpen={modalOpen} onClosePopup={() => setModalOpen(false)}>
      <EventModal
        mode={modalMode}
        event={selectedEvent}
        onSubmit={onEventSubmited}
        onCancel={() => setModalOpen(false)}
      />
    </Popup>}
    <DnDCalendar
      defaultView='week'
      events={events}
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
      titleAccessor={e => (<><h1>{e.summary}</h1><br />{e.description}</>)}
      allDayAccessor={e => isEventAllDay(e)}
      startAccessor={e => icsDateToDate(e.start)}
      endAccessor={e => icsDateToDate(e.end, true)} // BUG extra day with all day and extra time slot if end of day
      tooltipAccessor={e => e.description}
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