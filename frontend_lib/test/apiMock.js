import { content } from './fixture/content.js'
import { author } from './fixture/author.js'

const nock = require('nock')

const mockGetContentWithoutWorkspaceId200 = (apiUrl, contentId) => {
  return nock(apiUrl)
    .get(`/contents/${contentId}`)
    .reply(200, content)
}

const mockPutContent200 = (apiUrl, workspaceId, contentId, appSlug, newLabel, newRawContent) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/${appSlug}s/${contentId}`, {
      label: newLabel,
      raw_content: newRawContent
    })
    .reply(200, {
      ...content,
      label: newLabel,
      raw_content: newRawContent
    })
}

const mockPostContentComment200 = (apiUrl, workspaceId, contentId, newComment, contentNamespace) => {
  return nock(apiUrl)
    .post(`/workspaces/${workspaceId}/contents/${contentId}/comments`, {
      raw_content: newComment,
      content_namespace: contentNamespace
    })
    .reply(200, {
      author: author,
      content_id: 42,
      created: '2020-01-07T15:57:43.417Z',
      parent_id: 32,
      raw_content: newComment
    })
}

const mockGetContentComments200 = (apiUrl, workspaceId, contentId, commentPage, query = '?page_token=&count=0&sort=created:asc') => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/contents/${contentId}/comments${query}`)
    .reply(200, commentPage)
}

const mockGetFileChildContent200 = (apiUrl, workspaceId, contentId, filePage, pageQuery = '&page_token=&count=0&sort=created:asc') => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/contents?parent_ids=${contentId}&content_type=file&namespaces_filter=content,publication${pageQuery}`)
    .reply(200, filePage)
}

const mockGetContentRevisions200 = (apiUrl, workspaceId, contentType, contentId, revisionPage, query = '?page_token=&count=0&sort=created:asc') => {
  return nock(apiUrl)
    .get(`/workspaces/${workspaceId}/${contentType}/${contentId}/revisions${query}`)
    .reply(200, revisionPage)
}

const mockPutContentStatus204 = (apiUrl, workspaceId, contentId, appSlug, newStatusSlug) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/${appSlug}s/${contentId}/status`, {
      status: newStatusSlug
    })
    .reply(204, '')
}

const mockPutContentArchive204 = (apiUrl, workspaceId, contentId) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/contents/${contentId}/archived`)
    .reply(204, '')
}

const mockPutContentDelete204 = (apiUrl, workspaceId, contentId) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/contents/${contentId}/trashed`)
    .reply(204, '')
}

const mockPutContentArchiveRestore204 = (apiUrl, workspaceId, contentId) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/contents/${contentId}/archived/restore`)
    .reply(204, '')
}

const mockPutContentDeleteRestore204 = (apiUrl, workspaceId, contentId) => {
  return nock(apiUrl)
    .put(`/workspaces/${workspaceId}/contents/${contentId}/trashed/restore`)
    .reply(204, '')
}

const mockGetMyselfKnownMember200 = (apiUrl, workspaceId, knownMemberList) => {
  return nock(apiUrl)
    .get(`/users/me/known_members?acp=&include_workspace_ids=${workspaceId}&limit=15`)
    .reply(200, knownMemberList)
}

const mockGetReservedUsernames200 = (apiUrl) => {
  return nock(apiUrl)
    .get('/system/reserved-usernames')
    .reply(200, { items: ['all', 'tous', 'todos'] })
}

const mockGetReservedUsernames500 = (apiUrl) => {
  return nock(apiUrl)
    .get('/system/reserved-usernames')
    .reply(500, {})
}

const mockGetUsernameAvailability200 = (apiUrl, username, available) => {
  return nock(apiUrl)
    .get(`/system/username-availability?username=${username}`)
    .reply(200, { available: available, username: username })
}

const mockGetUsernameAvailability500 = (apiUrl, username) => {
  return nock(apiUrl)
    .get(`/system/username-availability?username=${username}`)
    .reply(500, {})
}

const mockGetWhoami = (apiUrl, status) => {
  return nock(apiUrl)
    .get('/auth/whoami')
    .reply(status, '')
}

const mockGetWhoamiWithDelay = (apiUrl, status, delay) => {
  return nock(apiUrl)
    .get('/auth/whoami')
    .delayConnection(delay)
    .reply(status, '')
}

const mockGetWhoamiFailure = (apiUrl) => {
  return nock(apiUrl)
    .get('/auth/whoami')
    .replyWithError('Error foobar')
}

export {
  mockGetContentWithoutWorkspaceId200,
  mockPutContent200,
  mockPostContentComment200,
  mockPutContentStatus204,
  mockPutContentArchive204,
  mockPutContentDelete204,
  mockPutContentArchiveRestore204,
  mockPutContentDeleteRestore204,
  mockGetMyselfKnownMember200,
  mockGetReservedUsernames200,
  mockGetUsernameAvailability200,
  mockGetReservedUsernames500,
  mockGetUsernameAvailability500,
  mockGetWhoami,
  mockGetWhoamiWithDelay,
  mockGetWhoamiFailure,
  mockGetContentComments200,
  mockGetFileChildContent200,
  mockGetContentRevisions200
}
