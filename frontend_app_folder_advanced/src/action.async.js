import { FETCH_CONFIG } from './helper.js'

export const postFolder = (apiUrl, idWorkspace, idFolder, contentType, newFolderName) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/contents`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      parent_id: idFolder,
      content_type: contentType,
      label: newFolderName
    })
  })
