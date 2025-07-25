import { baseFetch } from 'tracim_frontend_lib'

export const getResourceList = (apiUrl: string, workspaceId: number | null): any => {
  const param = workspaceId !== null && Boolean(workspaceId)
    ? `&workspace_ids=${workspaceId}`
    : ''

  return baseFetch('GET', `${apiUrl}/users/me/agenda?resource_types=calendar,addressbook${param}`)
}

export const getPreFilledAgendaEvent = (apiUrl: string): any => {
  return baseFetch('GET', `${apiUrl}/system/pre-filled-agenda-event`)
}
