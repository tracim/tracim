import { FETCH_CONFIG } from './helper.js'

export const getWorkspaceDetail = (apiUrl, idWorkspace) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getWorkspaceMember = (apiUrl, idWorkspace) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/members`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const putLabel = (apiUrl, idWorkspace, newLabel, description) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      label: newLabel,
      description: description
    })
  })

export const putDescription = (apiUrl, idWorkspace, label, newDescription) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      label: label,
      description: newDescription
    })
  })

export const putMemberRole = (apiUrl, idWorkspace, idMember, slugNewRole) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/members/${idMember}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT',
    body: JSON.stringify({
      role: slugNewRole
    })
  })

export const deleteMember = (apiUrl, idWorkspace, idMember) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/members/${idMember}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'DELETE'
  })

export const getMyselfKnownMember = (apiUrl, userNameToSearch) =>
  fetch(`${apiUrl}/users/me/known_members?acp=${userNameToSearch}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const postWorkspaceMember = (apiUrl, idWorkspace, newMember) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/members`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'POST',
    body: JSON.stringify({
      user_id: newMember.id || null,
      user_email_or_public_name: newMember.nameOrEmail,
      role: newMember.role
    })
  })

export const deleteWorkspace = (apiUrl, idWorkspace) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/delete`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })
