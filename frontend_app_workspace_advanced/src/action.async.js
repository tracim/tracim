import { FETCH_CONFIG } from './helper.js'

export const getWorkspaceDetail = (apiUrl, workspaceId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}`, {
    credentials: 'include',
    headers: {...FETCH_CONFIG.headers},
    method: 'GET'
  })

export const getWorkspaceMember = (apiUrl, workspaceId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/members`, {
    credentials: 'include',
    headers: {...FETCH_CONFIG.headers},
    method: 'GET'
  })

export const getAppList = apiUrl => {
  return fetch(`${apiUrl}/system/applications`, {
    credentials: 'include',
    headers: {...FETCH_CONFIG.headers},
    method: 'GET'
  })
}

export const putLabel = (apiUrl, workspace, newLabel) =>
  fetch(`${apiUrl}/workspaces/${workspace.workspace_id}`, {
    credentials: 'include',
    headers: {...FETCH_CONFIG.headers},
    method: 'PUT',
    body: JSON.stringify({
      label: newLabel,
      description: workspace.description,
      agenda_enabled: workspace.agenda_enabled
    })
  })

export const putDescription = (apiUrl, workspace, newDescription) =>
  fetch(`${apiUrl}/workspaces/${workspace.workspace_id}`, {
    credentials: 'include',
    headers: {...FETCH_CONFIG.headers},
    method: 'PUT',
    body: JSON.stringify({
      label: workspace.label,
      description: newDescription,
      agenda_enabled: workspace.agenda_enabled
    })
  })

export const putAgendaEnabled = (apiUrl, workspace, agendaEnabled) =>
  fetch(`${apiUrl}/workspaces/${workspace.workspace_id}`, {
    credentials: 'include',
    headers: {...FETCH_CONFIG.headers},
    method: 'PUT',
    body: JSON.stringify({
      label: workspace.label,
      description: workspace.description,
      agenda_enabled: agendaEnabled
    })
  })

export const putMemberRole = (apiUrl, workspaceId, memberId, slugNewRole) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/members/${memberId}`, {
    credentials: 'include',
    headers: {...FETCH_CONFIG.headers},
    method: 'PUT',
    body: JSON.stringify({
      role: slugNewRole
    })
  })

export const deleteMember = (apiUrl, workspaceId, memberId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/members/${memberId}`, {
    credentials: 'include',
    headers: {...FETCH_CONFIG.headers},
    method: 'DELETE'
  })

export const getMyselfKnownMember = (apiUrl, userNameToSearch, workspaceToExcludeId) =>
  fetch(`${apiUrl}/users/me/known_members?acp=${userNameToSearch}&exclude_workspace_ids=${workspaceToExcludeId}`, {
    credentials: 'include',
    headers: {...FETCH_CONFIG.headers},
    method: 'GET'
  })

export const postWorkspaceMember = (apiUrl, workspaceId, newMember) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/members`, {
    credentials: 'include',
    headers: {...FETCH_CONFIG.headers},
    method: 'POST',
    body: JSON.stringify({
      user_id: newMember.id || null,
      user_email: newMember.email || null,
      user_public_name: newMember.publicName || null,
      role: newMember.role
    })
  })

export const deleteWorkspace = (apiUrl, workspaceId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/trashed`, {
    credentials: 'include',
    headers: {...FETCH_CONFIG.headers},
    method: 'PUT'
  })
