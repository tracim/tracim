import { baseFetch } from 'tracim_frontend_lib'

export const getSubscriptionRequestList = (apiUrl, spaceId) =>
  baseFetch('GET', `${apiUrl}/workspaces/${spaceId}/subscriptions`)

export const getWorkspaceMember = (apiUrl, workspaceId, showDisabledUser = false) =>
  baseFetch('GET', `${apiUrl}/workspaces/${workspaceId}/members${showDisabledUser ? '?show_disabled_user=1' : ''}`)

export const getAppList = (apiUrl) =>
  baseFetch('GET', `${apiUrl}/system/applications`)

export const putLabel = (apiUrl, workspace, newLabel) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspace.workspace_id}`, {
    label: newLabel
  })

export const putDescription = (apiUrl, workspace, newDescription) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspace.workspace_id}`, {
    description: newDescription
  })

export const putDefaultRole = (apiUrl, workspace, newDefaultRole) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspace.workspace_id}`, {
    default_user_role: newDefaultRole
  })

export const putAgendaEnabled = (apiUrl, workspace, agendaEnabled) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspace.workspace_id}`, {
    agenda_enabled: agendaEnabled
  })

export const putUploadEnabled = (apiUrl, workspace, uploadEnabled) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspace.workspace_id}`, {
    public_upload_enabled: uploadEnabled
  })

export const putDownloadEnabled = (apiUrl, workspace, downloadEnabled) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspace.workspace_id}`, {
    public_download_enabled: downloadEnabled
  })

export const putMemberRole = (apiUrl, workspaceId, memberId, slugNewRole) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspaceId}/members/${memberId}`, {
    role: slugNewRole
  })

export const putSubscriptionAccept = (apiUrl, spaceId, userId, defaultRole) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${spaceId}/subscriptions/${userId}/accept`, {
    role: defaultRole
  })

export const putSubscriptionReject = (apiUrl, spaceId, userId) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${spaceId}/subscriptions/${userId}/reject`)

export const deleteMember = (apiUrl, workspaceId, memberId) =>
  baseFetch('DELETE', `${apiUrl}/workspaces/${workspaceId}/members/${memberId}`)

export const postWorkspaceMember = (apiUrl, workspaceId, newMember) =>
  baseFetch('POST', `${apiUrl}/workspaces/${workspaceId}/members`, {
    user_id: newMember.id || null,
    user_email: newMember.email || null,
    user_username: newMember.username || null,
    role: newMember.role
  })

export const putPublicationEnabled = (apiUrl, workspace, publicationEnabled) =>
  baseFetch('PUT', `${apiUrl}/workspaces/${workspace.workspace_id}`, {
    publication_enabled: publicationEnabled
  })
