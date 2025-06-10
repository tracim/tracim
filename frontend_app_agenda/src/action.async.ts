import { baseFetch } from 'tracim_frontend_lib'
import { DAVCalendar, DAVNamespaceShort, propfind } from 'tsdav'

export function getAgendaList(apiUrl: string, workspaceId?: number): any {
  const param = workspaceId
    ? `?workspace_ids=${workspaceId}`
    : ''

  return baseFetch('GET', `${apiUrl}/users/me/agenda${param}`)
}

export function getPreFilledAgendaEvent(apiUrl?: string): any {
  return baseFetch('GET', `${apiUrl}/system/pre-filled-agenda-event`)
}
