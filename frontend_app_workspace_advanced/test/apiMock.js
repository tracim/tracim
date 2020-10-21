const nock = require('nock')

const mockGetAppList200 = (apiUrl, appList) => {
  return nock(apiUrl)
    .get('/system/applications')
    .reply(200, appList)
}

const mockGetWorkspaceDetail200 = (apiUrl, workspaceId, workspaceDetail) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}`)
    .reply(200, workspaceDetail)
}

const mockGetWorkspaceMember200 = (apiUrl, workspaceId, showDisabledUser, workspaceMember) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/members${showDisabledUser ? '?show_disabled_user=1' : ''}`)
    .reply(200, workspaceMember)
}

const mockGetSubscriptionsRequests200 = (apiUrl, spaceId, subscriptions) => {
  return nock(apiUrl)
    .get(`/workspaces/${spaceId}/subscriptions`)
    .reply(200, subscriptions)
}

export {
  mockGetAppList200,
  mockGetSubscriptionsRequests200,
  mockGetWorkspaceDetail200,
  mockGetWorkspaceMember200
}
