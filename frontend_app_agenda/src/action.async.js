import { baseFetch } from 'tracim_frontend_lib'

export const getAgendaList = (apiUrl, workspaceId = null) => {
  const param = workspaceId
    ? `?workspace_ids=${workspaceId}`
    : ''

  return baseFetch('GET', `${apiUrl}/users/me/agenda${param}`)
}

export const getPreFilledAgendaEvent = (apiUrl) => {
  return baseFetch('GET', `${apiUrl}/system/pre-filled-agenda-event`)
}
