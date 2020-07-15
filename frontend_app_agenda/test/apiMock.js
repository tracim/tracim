const nock = require('nock')

const mockGetAgendaList200 = (apiUrl, workspaceId, agendaList) => {
  return nock(apiUrl)
    .get(`/users/me/agenda?workspace_ids=${workspaceId}`)
    .reply(200, agendaList)
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
  mockGetAgendaList200,
  mockGetWorkspaceDetail200,
  mockGetWorkspaceMemberList200
}
