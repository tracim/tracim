import { FETCH_CONFIG } from './helper.js'

export const getWorkspaceList = (user, apiUrl) =>
  fetch(`${apiUrl}/workspaces`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getWorkspaceMemberList = (apiUrl, idWorkspace) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/members`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getWorkspaceDetail = (apiUrl, idWorkspace) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const deleteWorkspace = (apiUrl, idWorkspace) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/delete`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const getUserList = apiUrl =>
  fetch(`${apiUrl}/users`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getUserDetail = (apiUrl, idUser) =>
  fetch(`${apiUrl}/users/${idUser}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const putUserDisable = (apiUrl, idUser) =>
  fetch(`${apiUrl}/users/${idUser}/disable`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const putUserEnable = (apiUrl, idUser) =>
  fetch(`${apiUrl}/users/${idUser}/enable`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const putUserProfile = (apiUrl, idUser, newProfile) =>
  fetch(`${apiUrl}/users/${idUser}/profile`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    body: JSON.stringify({
      profile: newProfile
    }),
    method: 'PUT'
  })

export const postAddUser = (apiUrl, email, profile) =>
  fetch(`${apiUrl}/users`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    body: JSON.stringify({
      email,
      email_notification: false,
      profile
    }),
    method: 'POST'
  })
