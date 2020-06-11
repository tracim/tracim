import { FETCH_CONFIG } from 'tracim_frontend_lib'

export const getWorkspaceList = (apiUrl) =>
  fetch(`${apiUrl}/workspaces`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getWorkspaceMemberList = (apiUrl, workspaceId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/members`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const getWorkspaceDetail = (apiUrl, workspaceId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const deleteWorkspace = (apiUrl, workspaceId) =>
  fetch(`${apiUrl}/workspaces/${workspaceId}/trashed`, {
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

export const getUserDetail = (apiUrl, userId) =>
  fetch(`${apiUrl}/users/${userId}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })

export const putUserDisable = (apiUrl, userId) =>
  fetch(`${apiUrl}/users/${userId}/disabled`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const putUserEnable = (apiUrl, userId) =>
  fetch(`${apiUrl}/users/${userId}/enabled`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'PUT'
  })

export const putMyselfProfile = (apiUrl, userId, newProfile) =>
  fetch(`${apiUrl}/users/${userId}/profile`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    body: JSON.stringify({
      profile: newProfile
    }),
    method: 'PUT'
  })

export const putUserProfile = (apiUrl, userId, newProfile) =>
  fetch(`${apiUrl}/users/${userId}/profile`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    body: JSON.stringify({
      profile: newProfile
    }),
    method: 'PUT'
  })

export const postAddUser = (apiUrl, publicName, username, email, profile, emailNotif, password) =>
  fetch(`${apiUrl}/users`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    body: JSON.stringify({
      public_name: publicName,
      username: username || null,
      email: email || null,
      email_notification: emailNotif,
      password: password || null,
      profile
    }),
    method: 'POST'
  })

export const getUsernameAvailability = (apiUrl, username) =>
  fetch(`${apiUrl}/system/username-availability?username=${username}`, {
    credentials: 'include',
    headers: {
      ...FETCH_CONFIG.headers
    },
    method: 'GET'
  })
