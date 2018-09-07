import { FETCH_CONFIG } from './helper.js'

export const getHtmlDocContent = (apiUrl, idWorkspace, idContent) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/html-documents/${idContent}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
