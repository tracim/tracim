import { baseFetch } from 'tracim_frontend_lib'

export const getWorkspaceList = (apiUrl) =>
  baseFetch('GET', `${apiUrl}/workspaces`)

export const getUserList = (apiUrl) =>
  baseFetch('GET', `${apiUrl}/users`)

export const getUserDetail = (apiUrl, userId) =>
  baseFetch('GET', `${apiUrl}/users/${userId}`)

export const putUserDisable = (apiUrl, userId) =>
  baseFetch('PUT', `${apiUrl}/users/${userId}/disabled`)

export const putUserEnable = (apiUrl, userId) =>
  baseFetch('PUT', `${apiUrl}/users/${userId}/enabled`)

export const putMyselfProfile = (apiUrl, userId, newProfile) =>
  baseFetch('PUT', `${apiUrl}/users/${userId}/profile`, {
    profile: newProfile
  })

export const putUserProfile = (apiUrl, userId, newProfile) =>
  baseFetch('PUT', `${apiUrl}/users/${userId}/profile`, {
    profile: newProfile
  })

export const postAddUser = (apiUrl, publicName, username, email, profile, emailNotif, password) =>
  baseFetch('POST', `${apiUrl}/users`, {
    public_name: publicName,
    username: username || null,
    email: email || null,
    email_notification: emailNotif,
    password: password || null,
    profile
  })
