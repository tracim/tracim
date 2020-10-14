const nock = require('nock')

const mockGetWorkspaces200 = (apiUrl, workspaces) => {
  return nock(apiUrl)
    .get('/workspaces')
    .reply(200, workspaces)
}

const mockGetWorkspaceMembers200 = (apiUrl, workspaceId, members) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/members`)
    .reply(200, members)
}

const mockGetUsers200 = (apiUrl, users) => {
  return nock(apiUrl)
    .get('/users')
    .reply(200, users)
}

const mockGetUserDetails200 = (apiUrl, user) => {
  return nock(apiUrl)
    .get(`/users/${user.user_id}`)
    .reply(200, user)
}

const mockPostUser200 = (apiUrl) => {
  return nock(apiUrl)
    .post('/users')
    .reply(200, {})
}

export {
  mockGetWorkspaces200,
  mockGetUsers200,
  mockGetUserDetails200,
  mockGetWorkspaceMembers200,
  mockPostUser200
}
