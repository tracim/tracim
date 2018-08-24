import { FETCH_CONFIG } from './helper.js'

export const getWorkspaceList = (user, apiUrl) =>
  // @FIXME - Côme - 2018/08/23 - wrong end point, this one only returns workspaces of logged user
  fetch(`${apiUrl}/users/${user.user_id}/workspaces`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getWorkspaceMemberList = (user, apiUrl, idWorkspace) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/members`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const deleteWorkspace = (user, apiUrl, idWorkspace) =>
  fetch(`${apiUrl}/workspaces/${idWorkspace}/delete`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const getUserList = (user, apiUrl) =>
  fetch(`${apiUrl}/users`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getUserDetail = (user, apiUrl, idUser) =>
  fetch(`${apiUrl}/users/${idUser}`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const putUserDisable = (user, apiUrl, idUser) =>
  fetch(`${apiUrl}/users/${idUser}/disable`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const putUserEnable = (user, apiUrl, idUser) =>
  fetch(`${apiUrl}/users/${idUser}/enable`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const putUserProfile = (user, apiUrl, idUser, newProfile) =>
  fetch(`${apiUrl}/users/${idUser}/profile`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    body: JSON.stringify({
      profile: newProfile
    }),
    method: 'PUT'
  })

export const postAddUser = (user, apiUrl, email, profile) =>
  fetch(`${apiUrl}/users`, {
    headers: {
      'Authorization': 'Basic ' + user.auth,
      ...FETCH_CONFIG.headers
    },
    body: JSON.stringify({
      email,
      email_notification: false,
      profile
    }),
    method: 'POST'
  })
