import { IcsEvent, NonStandardValuesGeneric } from "ts-ics"
import { useForm } from "react-hook-form";
import { isEventAllDay } from "./types";
import { DAVCalendar } from "tsdav";
import { tzlib_get_ical_block } from "timezones-ical-library";

export enum ModalMode {
  View,
  Edit,
  Create,
}

export interface EventModalProps {
  calendars: DAVCalendar[]
  timezones: string[]
  event: IcsEvent<NonStandardValuesGeneric>
  mode: ModalMode
  onSubmit: (calendarUrl: string, event: IcsEvent<NonStandardValuesGeneric>) => void
  onCancel: () => void
}

export interface EventFormFields {
  summary: string
  // TODO rich text
  // TODO event going the the end of the day (->00:00 displaying 00:30 and wholeday displaying day+1)
  description: string
  startDate: string
  startTime: string
  startTimezone: string
  endDate: string
  endTime: string
  endTimezone: string
  allDay?: boolean
  calendar: string
}

export default function EventModal({ calendars, timezones, mode, event, onSubmit, onCancel }: EventModalProps) {
  var localStart = event.start.local ?? { date: event.start.date, timezone: "UTC", tzoffset: "+0000" }
  var localEnd = event.end.local ?? { date: event.end.date, timezone: "UTC", tzoffset: "+0000" }
  const { register, handleSubmit, watch, setValue } = useForm<EventFormFields>({
    defaultValues: {
      summary: event.summary,
      description: event.description,
      allDay: isEventAllDay(event),
      startDate: localStart.date.toISOString().split("T")[0],
      startTime: localStart.date.toISOString().split("T")[1].slice(0, 5),
      startTimezone: localStart.timezone,
      endDate: localEnd.date.toISOString().split("T")[0],
      endTime: localEnd.date.toISOString().split("T")[1].slice(0, 5),
      endTimezone: localEnd.timezone,
    },
  });

  const allDay = watch("allDay")
  // const [startOffset, setStartOffset] = useState(localStart.tzoffset)
  // const [endOffset, setEndOffset] = useState(localEnd.tzoffset)
  
  // const [startTimezone, endTimezone] = watch(["startTimezone", "endTimezone"])
  // // TODO auto change date when timezone changes
  // useEffect(() => {
  //   if (timezones.indexOf(startTimezone) == -1) return
  //   const offset = tzlib_get_offset(startTimezone, localStart.date.toISOString().split("T")[0], localStart.date.toISOString().split("T")[1].slice(0, 5))
  //   console.log(offset)
  // }, [startTimezone])
  
  // useEffect(() => {
  //   // TODO auto change date when timezone changes
  //   if (timezones.indexOf(endTimezone) == -1) return
  //   const offset = tzlib_get_offset(endTimezone, localEnd.date.toISOString().split("T")[0], localEnd.date.toISOString().split("T")[1].slice(0, 5))
  //   console.log(offset)
  // }, [endTimezone])

  const onFormSubmit = (data: EventFormFields) => {
    //@ts-ignore
    onSubmit(data.calendar, {
      ...event,
      summary: data.summary,
      start: {
        // Does not matter if local is set
        date: new Date(allDay ? data.startDate : `${data.startDate}T${data.startTime}Z`),
        type: data.allDay ? "DATE" : "DATE-TIME",
        local: data.startTimezone === "UTC" ? undefined : {
          date: new Date(allDay ? data.startDate : `${data.startDate}T${data.startTime}Z`),
          timezone: tzlib_get_ical_block(data.startTimezone)[1].slice(5),
          tzoffset: ""
        }
      },
      end: {
        // Does not matter if local is set
        date: new Date(allDay ? data.endDate : `${data.endDate}T${data.endTime}Z`),
        type: data.allDay ? "DATE" : "DATE-TIME",
        local: data.endTimezone === "UTC" ? undefined : {
          date: new Date(allDay ? data.endDate : `${data.endDate}T${data.endTime}Z`),
          timezone: tzlib_get_ical_block(data.endTimezone)[1].slice(5),
          tzoffset: ""
        }
      },
      description: data.description,
    })
  };

  return <>
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <datalist id="timezones">
        { timezones.map(tz => <option key={tz} value={tz}/>)}
      </datalist>
      <table>
        <tr>
          <td><label>Calendar:</label></td>
          <td>
            <select {...register("calendar", { required: true })}>
              <option value={""}>-- Choose a calendar--</option>
              {calendars.map(c => <option value={c.url} key={c.url}>{c.displayName}</option>)}
            </select>
          </td>
        </tr>
        <tr>
          <td><label>Title:</label></td>
          <td><input type="text" {...register("summary", { required: true })} /></td>
        </tr>
        <tr>
          <td><label>All day:</label></td>
          <td><input type="checkbox" {...register("allDay")} /></td>
        </tr>
        <tr>
          <td><label>From:</label></td>
          <td>
            <input type="date" {...register("startDate", { required: true })} />
            {!allDay && <>
              <input type="time" {...register("startTime", { required: true })} />
              <input type="text" list="timezones" {...register("startTimezone", { required: true, validate: v => timezones.indexOf(v) != -1})} />
            </>}
          </td>
        </tr>
        <tr>
          <td><label>To:</label></td>
          <td>
            <input type="date" {...register("endDate", { required: true })} />
            {!allDay && <>
              <input type="time" {...register("endTime", { required: true })} />
              <input type="text" list="timezones" {...register("endTimezone", { required: true, validate: v => timezones.indexOf(v) != -1 })} />
            </>}
          </td>
        </tr>
        <tr>
          <td><label>Description:</label></td>
          <td><input type="text" {...register("description")} /></td>
        </tr>
      </table>
      <div>
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit">Submit</button>
      </div>
    </form>
  </>
}