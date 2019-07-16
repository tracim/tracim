import { FETCH_CONFIG } from './helper.js'

export const postODP = (apiUrl, idWorkspace, idFolder, contentType, newContentName) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/wopi/files/create`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      parent_id: idFolder,
      template: 'default.ods',
      title: newContentName
    })
  })
