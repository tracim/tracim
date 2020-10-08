const nock = require('nock')

const mockGetUserSpaces200 = (apiUrl, userId, userSpaces) => {
  return nock(apiUrl)
    .get(`/users/${userId}/workspaces`)
    .reply(200, userSpaces)
}

const mockPostWorkspace200 = (apiUrl) => {
  return nock(apiUrl)
    .post('/workspaces')
    .reply(200)
}

export {
  mockGetUserSpaces200,
  mockPostWorkspace200
}
