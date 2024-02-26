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

const mockGetWorkspaceRole200 = (apiUrl, workspaceId, showDisabledUser, workspaceMember) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/role${showDisabledUser ? '?show_disabled_user=1' : ''}`)
    .reply(200, workspaceMember)
}

const mockGetSubscriptionRequestList200 = (apiUrl, spaceId, subscriptions) => {
  return nock(apiUrl)
    .persist()
    .get(`/workspaces/${spaceId}/subscriptions`)
    .reply(200, subscriptions)
}

export {
  mockGetAppList200,
  mockGetSubscriptionRequestList200,
  mockGetWorkspaceDetail200,
  mockGetWorkspaceRole200
}
