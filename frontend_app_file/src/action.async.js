import { baseFetch } from 'tracim_frontend_lib'

export const getShareLinksList = (apiUrl, workspaceId, contentId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/shares`)

export const postShareLinksList = (apiUrl, workspaceId, contentId, shareEmailsList, sharePassword) =>
  baseFetch('POST', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/shares`, {
    emails: shareEmailsList,
    password: sharePassword
  })

export const deleteShareLink = (apiUrl, workspaceId, contentId, shareId) =>
  baseFetch('DELETE', `${apiUrl}/workspaces/${workspaceId}/contents/${contentId}/shares/${shareId}`)
