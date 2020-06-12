const nock = require('nock')

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

export {
  mockGetWorkspaceDetail200,
  mockGetWorkspaceMemberList200,
  mockGetMyselfWorkspaceList200,
  mockGetContentType200,
  mockGetAppList200,
  mockGetConfig200,
  mockMyselfWorkspaceDoNotify204,
  mockPostUserLogout204,
  mockPutMyselfName200,
  mockPutMyselfPassword204,
  mockPutMyselfPassword403,
  mockGetLoggedUserCalendar200
}
