import { globalManagerFromApi } from '../user/globalManagerFromApi.js'
import { firstWorkspaceFromApi } from '../workspace/firstWorkspace'

export const notificationPage = {
  list: [{
    read: null,
    created: '2020-08-18T15:12:51Z',
    fields: {
      author: globalManagerFromApi,
      client_token: 'd005a16c-dc12-4422-b69e-b3c3f144aaa8',
      user: {
        ...globalManagerFromApi,
        user_id: globalManagerFromApi.user_id + 1
      }
    },
    event_id: 240,
    event_type: 'user.modified'
  }, {
    read: '2020-08-18T14:57:47Z',
    created: '2020-08-18T14:11:28Z',
    fields: {
      author: {
        ...globalManagerFromApi,
        user_id: globalManagerFromApi.user_id + 1
      },
      client_token: 'd005a16c-dc12-4422-b69e-b3c3f144aaa8',
      user: globalManagerFromApi
    },
    event_id: 239,
    event_type: 'user.modified'
  }, {
    read: null,
    created: '2020-08-19T07:25:13Z',
    fields: {
      author: globalManagerFromApi,
      client_token: 'e63a5a8f-811e-4bfb-82f5-dc27a00a412a',
      content: {
        content_id: 55,
        created: '2020-08-19T07:25:13Z',
        raw_content: '<p>test</p>',
        parent_id: 1,
        parent_content_type: 'html-document',
        content_type: 'comment',
        author: globalManagerFromApi
      },
      workspace: firstWorkspaceFromApi
    },
    event_id: 241,
    event_type: 'content.created.comment'
  }],
  hasNextPage: false,
  nextPageToken: '',
  notificationNotReadCount: 0
}
