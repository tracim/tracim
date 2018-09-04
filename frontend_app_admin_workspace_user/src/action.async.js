import { FETCH_CONFIG } from './helper.js'

export const getWorkspaceList = (user, apiUrl) =>
  // @FIXME - Côme - 2018/08/23 - wrong end point, this one only returns workspaces of logged user
  fetch(`${apiUrl}/users/${user.user_id}/workspaces`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getWorkspaceMemberList = (user, apiUrl, idWorkspace) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/members`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const deleteWorkspace = (user, apiUrl, idWorkspace) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/delete`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const getUserList = (user, apiUrl) =>
  fetch(`${apiUrl}/users`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getUserDetail = (user, apiUrl, idUser) =>
  fetch(`${apiUrl}/users/${idUser}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const putUserDisable = (user, apiUrl, idUser) =>
  fetch(`${apiUrl}/users/${idUser}/disable`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const putUserEnable = (user, apiUrl, idUser) =>
  fetch(`${apiUrl}/users/${idUser}/enable`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const putUserProfile = (user, apiUrl, idUser, newProfile) =>
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

export const postAddUser = (user, apiUrl, email, profile) =>
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
