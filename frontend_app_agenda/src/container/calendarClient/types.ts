export type ServerUrl = string
export type CalendarUrls = string[]

export type EventIndex = {
  calendarIndex: number
  objectIndex: number
  eventIndex: number
}

export const alarmActionTypes = ["DISPLAY"];
export type IcsAlarmActionTypes = typeof alarmActionTypes;

export const attendeeRoleTypes = ["CHAIR", "REQ-PARTICIPANT", "OPT-PARTICIPANT", "NON-PARTICIPANT"];
export type IcsAttendeeRoleTypes = typeof attendeeRoleTypes;
