import { firstWorkspaceFromApi } from '../../../fixture/workspace/firstWorkspace.js'
import { userFromApi } from '../user/user.js'

export const searchResult = {
  currentNumberPage: 1,
  numberResultsByPage: 10,
  searchedString: 'word',
  resultList: [
    {
      modified: '2020-06-12T16:05:08Z',
      created: '2020-06-12T13:17:56Z',
      filename: 'word8.document.html',
      author: userFromApi,
      workspace: firstWorkspaceFromApi,
      label: 'word8',
      parent: null,
      isActive: true,
      score: 1,
      status: 'closed-unvalidated',
      path: [{ content_id: 28, content_type: 'html-document', label: 'word8', slug: 'word8' }],
      subContentTypes: ['comment'],
      showInUi: true,
      fileExtension: '.document.html',
      parentId: null,
      slug: 'word8',
      isArchived: false,
      isDeleted: false,
      currentRevisionId: 153,
      lastModifier: userFromApi,
      isEditable: false,
      contentType: 'html-document',
      contentId: 28,
      workspaceId: 1
    },
    {
      modified: '2020-06-12T15:37:19Z',
      created: '2020-06-12T13:18:30Z',
      filename: 'word.thread.html',
      author: userFromApi,
      workspace: firstWorkspaceFromApi,
      label: 'word',
      path: [{ content_id: 31, content_type: 'thread', label: 'word', slug: 'word' }],
      isActive: true,
      score: 1,
      status: 'open',
      subContentTypes: ['comment'],
      showInUi: true,
      fileExtension: '.thread.html',
      slug: 'word',
      isArchived: false,
      isDeleted: false,
      currentRevisionId: 133,
      lastModifier: userFromApi,
      isEditable: true,
      contentType: 'thread',
      contentId: 31,
      workspaceId: 1
    }
  ]
}
