const nock = require('nock')

const mockGetContents200 = (apiUrl, workspaceId, queryParam, fileListResponse) => {
  return nock(apiUrl)
    .persist()
    .get(`/workspaces/${workspaceId}/contents`)
    .query(queryParam)
    .reply(200, fileListResponse)
}

const mockGetWorkspaceDetail200 = (apiUrl, workspaceId, workspaceName) => {
  return nock(apiUrl)
    .persist()
    .get(`/workspaces/${workspaceId}`)
    .reply(200, {
      label: workspaceName
    })
}

const mockGetFolderDetailDetail200 = (apiUrl, workspaceId, folderId, folderName, parentId) => {
  return nock(apiUrl)
    .persist()
    .get(`/workspaces/${workspaceId}/folders/${folderId}`)
    .reply(200, {
      filename: folderName,
      parent_id: parentId
    })
}

export {
  mockGetContents200,
  mockGetWorkspaceDetail200,
  mockGetFolderDetailDetail200
}
