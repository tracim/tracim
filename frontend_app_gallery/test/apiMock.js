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

const mockGetFileRevisionPreviewInfo200 = (apiUrl, workspaceId, contentId, revisionId) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/files/${contentId}/revisions/${revisionId}/preview_info`)
    .reply(200, {
      page_nb: 1,
      has_jpeg_preview: true,
      has_pdf_preview: true,
      content_id: contentId,
      revision_id: revisionId
    })
}

const mockGetWorkspaceContentList = (apiUrl, workspaceId, parentId = 0) => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/contents?parent_ids=${parentId}`)
    .reply(200, {
      has_next: false,
      has_previous: false,
      items: [],
      per_page: 10,
      previous_page_token: null,
      next_page_token: null
    })
}

export {
  mockGetContents200,
  mockGetWorkspaceDetail200,
  mockGetFolderDetailDetail200,
  mockGetFileRevisionPreviewInfo200,
  mockGetWorkspaceContentList
}
