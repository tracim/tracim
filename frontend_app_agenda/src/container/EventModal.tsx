import { IcsEvent, NonStandardValuesGeneric } from "ts-ics"
import { useForm } from "react-hook-form";
import { isEventAllDay } from "./types";
import { DAVCalendar } from "tsdav";

export enum ModalMode {
  View,
  Edit,
  Create,
}

export interface EventModalProps {
  calendars: DAVCalendar[]
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

// https://stackoverflow.com/questions/10830357/javascript-toisostring-ignores-timezone-offset
// function localISOTime(date: IcsDateObject): { date: string, time: string, tzoffset: string } {
//   if (date.local) 
//   var tzoffset = d.getTimezoneOffset() * 60000; //offset in milliseconds
//   return (new Date(d.getTime() - tzoffset)).toISOString().slice(0, -1);
// }

export default function EventModal({ calendars, mode, event, onSubmit, onCancel }: EventModalProps) {
  var localStart = event.start.local ?? { date: event.start.date, timezone: "UTC/GMT", tzoffset: "+0000" }
  var localEnd = event.end.local ?? { date: event.end.date, timezone: "UTC/GMT", tzoffset: "+0000" }
  const { register, handleSubmit, watch } = useForm<EventFormFields>({
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

  const onFormSubmit = (data: EventFormFields) => {
    console.log(data.startDate)
    //@ts-ignore
    onSubmit(data.calendar, {
      ...event,
      summary: data.summary,
      start: {
        // Does not matter if local is set
        date: new Date(allDay ? data.startDate : `${data.startDate}T${data.startTime}Z`),
        type: data.allDay ? "DATE" : "DATE-TIME",
        local: data.startTimezone === "UTC/GMT" ? undefined : {
          date: new Date(allDay ? data.startDate : `${data.startDate}T${data.startTime}Z`),
          timezone: data.startTimezone,
          tzoffset: ""
        }
      },
      end: {
        // Does not matter if local is set
        date: new Date(allDay ? data.endDate : `${data.endDate}T${data.endTime}Z`),
        type: data.allDay ? "DATE" : "DATE-TIME",
        local: data.endTimezone === "UTC/GMT" ? undefined : {
          date: new Date(allDay ? data.endDate : `${data.endDate}T${data.endTime}Z`),
          timezone: data.endTimezone,
          tzoffset: ""
        }
      },
      description: data.description,
    })
  };

  return <>
    <form onSubmit={handleSubmit(onFormSubmit)}>
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
              <input type="text" {...register("startTimezone", { required: true })} />
            </>}
          </td>
        </tr>
        <tr>
          <td><label>To:</label></td>
          <td>
            <input type="date" {...register("endDate", { required: true })} />
            {!allDay && <>
              <input type="time" {...register("endTime", { required: true })} />
              <input type="text" {...register("endTimezone", { required: true })} />
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