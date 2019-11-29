export const DIRECTION = {
  LEFT: 'left',
  RIGHT: 'right'
}

// INFO - GM - 2019-11-29 - Could be refactored with app file in frontend_lib > helper.js
export const buildRawFileUrl = (apiUrl, workspaceId, contentId, filename) => {
  return `${apiUrl}/workspaces/${workspaceId}/files/${contentId}/raw/${filename}`
}
