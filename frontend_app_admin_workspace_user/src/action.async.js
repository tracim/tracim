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
  fetch(`${apiUrl}/workspaces/${idWorkspace}/trashed`, {
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
  fetch(`${apiUrl}/users/${idUser}/disabled`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const putUserEnable = (apiUrl, idUser) =>
  fetch(`${apiUrl}/users/${idUser}/enabled`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const putMyselfProfile = (apiUrl, idUser, newProfile) =>
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

export const postAddUser = (apiUrl, name, email, profile, emailNotif, password) =>
  fetch(`${apiUrl}/users`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    body: JSON.stringify({
      public_name: name,
      email,
      email_notification: emailNotif,
      password: password || null, // '' will generate the password by backend
      profile
    }),
    method: 'POST'
  })
