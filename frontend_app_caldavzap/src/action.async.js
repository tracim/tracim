import { FETCH_CONFIG } from './helper.js'

export const getCalendarList = (apiUrl, idWorkspace = null) => {
  const href = idWorkspace
    ? `users/me/calendar?workspace_ids=${idWorkspace}`
    : 'users/me/calendar'

  return fetch(`${apiUrl}/${href}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
}
