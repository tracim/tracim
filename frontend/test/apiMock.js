const nock = require('nock')

const mockPutUserPublicName200 = (apiUrl, userId, newPublicName, timezone, lang) => {
  return nock(apiUrl)
    .put(`/users/${userId}`, {
      public_name: newPublicName,
      timezone: timezone,
      lang: lang
    })
    .reply(200, {
      public_name: newPublicName
    })
}

const mockPutUserUsername200 = (apiUrl, userId, newUsername, checkPassword) => {
  return nock(apiUrl)
    .put(`/users/${userId}/username`, {
      username: newUsername,
      loggedin_user_password: checkPassword
    })
    .reply(200, {
      username: newUsername
    })
}

const mockPutUserEmail200 = (apiUrl, userId, newEmail, checkPassword) => {
  return nock(apiUrl)
    .put(`/users/${userId}/email`, {
      email: newEmail,
      loggedin_user_password: checkPassword
    })
    .reply(200, {
      email: newEmail
    })
}

const mockPutMyselfName200 = (apiUrl, newName, timezone, lang) => {
  return nock(apiUrl)
    .put('/users/me', {
      public_name: newName,
      timezone: timezone,
      lang: lang
    })
    .reply(200, {
      public_name: newName
    })
}

const mockPostUserLogout204 = (apiUrl) => {
  return nock(apiUrl)
    .post('/auth/logout')
    .reply(204)
}

const mockPutMyselfEmail200 = (apiUrl, newEmail, checkPassword) => {
  return nock(apiUrl)
    .put('/users/me/email', {
      email: newEmail,
      loggedin_user_password: checkPassword
    })
    .reply(200, {
      email: newEmail
    })
}

const mockPutUserPassword204 = (apiUrl, userId, oldPassword) => {
  return nock(apiUrl)
    .put(`/users/${userId}/password`, body => body.loggedin_user_password === oldPassword)
    .reply(204)
}

const mockPutUserPassword403 = (apiUrl, userId, oldPassword) => {
  return nock(apiUrl)
    .put(`/users/${userId}/password`, body => body.loggedin_user_password !== oldPassword)
    .reply(403)
}

const mockPutMyselfPassword204 = (apiUrl, oldPassword) => {
  return nock(apiUrl)
    .put('/users/me/password', body => body.loggedin_user_password === oldPassword)
    .reply(204)
}

const mockPutMyselfPassword403 = (apiUrl, oldPassword) => {
  return nock(apiUrl)
    .put('/users/me/password', body => body.loggedin_user_password !== oldPassword)
    .reply(403)
}

const mockGetLoggedUserCalendar200 = (apiUrl) => {
  return nock(apiUrl)
    .get('/users/me/agenda')
    .reply(200,
      [{
        agenda_type: 'workspace',
        agenda_url: 'string',
        with_credentials: false
      }]
    )
}

const mockGetUserCalendar200 = (apiUrl, userId, agendaUrl) => {
  return nock(apiUrl)
    .get(`/users/${userId}/agenda`)
    .reply(200,
      [{
        agenda_type: 'private',
        agenda_url: agendaUrl,
        with_credentials: false
      }]
    )
}

const mockGetUser200 = (apiUrl, userId, userDetail) => {
  return nock(apiUrl)
    .get(`/users/${userId}`)
    .reply(200, userDetail)
}

const mockPutContentItemMove200 = (apiUrl, source) => {
  return nock(apiUrl)
    .put(`/workspaces/${source.workspaceId}/contents/${source.contentId}/move`)
    .reply(200, {})
}

const mockPutContentItemMove400 = (apiUrl, source) => {
  return nock(apiUrl)
    .put(`/workspaces/${source.workspaceId}/contents/${source.contentId}/move`)
    .reply(400, {})
}

const mockPutUserWorkspaceDoNotify204 = (apiUrl, userId, workspaceId, doNotify) => {
  return nock(apiUrl)
    .put(`/users/${userId}/workspaces/${workspaceId}/notifications/${doNotify ? 'activate' : 'deactivate'}`)
    .reply(204)
}

const mockMyselfWorkspaceDoNotify204 = (apiUrl, workspaceId, doNotify) => {
  return nock(apiUrl)
    .put(`/users/me/workspaces/${workspaceId}/notifications/${doNotify ? 'activate' : 'deactivate'}`)
    .reply(204)
}

const mockGetConfig200 = (apiUrl) => {
  return nock(apiUrl)
    .get('/system/config')
    .reply(200, {})
}

const mockGetUserConfig200 = (apiUrl, userId) => {
  return nock(apiUrl)
    .get(`/users/${userId}/config`)
    .reply(200, { parameters: {} })
}

const mockGetAppList200 = (apiUrl, appList) => {
  return nock(apiUrl)
    .get('/system/applications')
    .reply(200, appList)
}

const mockGetContentType200 = (apiUrl, contentTypes) => {
  return nock(apiUrl)
    .get('/system/content_types')
    .reply(200, contentTypes)
}

const mockGetMyselfWorkspaceList200 = (apiUrl, showOwnedWorkspace, workspaceList) => {
  return nock(apiUrl)
    .get(`/users/me/workspaces?show_owned_workspace=${showOwnedWorkspace ? 1 : 0}`)
    .reply(200, workspaceList)
}

const mockGetWorkspaceDetail200 = (apiUrl, workspaceId, workspaceDetail) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}`)
    .reply(200, workspaceDetail)
}

const mockGetWorkspaceMemberList200 = (apiUrl, workspaceId, memberList) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/members`)
    .reply(200, memberList)
}

const mockGetFolderContentList200 = (apiUrl, workspaceId, folderIdList, resultContentList) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/contents?parent_ids=${folderIdList.join(',')}`)
    .reply(200, resultContentList)
}

const mockPutNotificationAsRead204 = (apiUrl, userId, notificationId) => {
  return nock(apiUrl)
    .put(`/users/${userId}/messages/${notificationId}/read`)
    .reply(204, true)
}

const mockPutAllNotificationAsRead204 = (apiUrl, userId) => {
  return nock(apiUrl)
    .put(`/users/${userId}/messages/read`)
    .reply(204, true)
}

const mockGetContentComments200 = (apiUrl, workspaceId, contentId, comments) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/contents/${contentId}/comments`)
    .reply(200, comments)
}

const mockGetContent200 = (apiUrl, contentId, content) => {
  return nock(apiUrl)
    .get(`/contents/${contentId}`)
    .reply(200, content)
}

const mockGetFileContent400 = (apiUrl, workspaceId, contentId) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/files/${contentId}`)
    .reply(400, {})
}

export {
  mockGetWorkspaceDetail200,
  mockGetWorkspaceMemberList200,
  mockGetMyselfWorkspaceList200,
  mockGetContentType200,
  mockGetAppList200,
  mockGetConfig200,
  mockGetUserConfig200,
  mockMyselfWorkspaceDoNotify204,
  mockPostUserLogout204,
  mockPutAllNotificationAsRead204,
  mockPutContentItemMove200,
  mockPutContentItemMove400,
  mockPutUserWorkspaceDoNotify204,
  mockPutMyselfName200,
  mockPutUserPublicName200,
  mockPutUserUsername200,
  mockPutMyselfEmail200,
  mockPutUserEmail200,
  mockPutMyselfPassword204,
  mockPutMyselfPassword403,
  mockPutNotificationAsRead204,
  mockPutUserPassword204,
  mockPutUserPassword403,
  mockGetLoggedUserCalendar200,
  mockGetUserCalendar200,
  mockGetUser200,
  mockGetFolderContentList200,
  mockGetContentComments200,
  mockGetContent200,
  mockGetFileContent400
}
