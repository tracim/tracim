export const DIRECTION = {
  LEFT: 'left',
  RIGHT: 'right'
}

export const buildRawFileUrl = (apiUrl, workspaceId, contentId, filename) => {
  return `${apiUrl}/workspaces/${workspaceId}/files/${contentId}/raw/${filename}`
}
