import { expect } from 'chai'

import {
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TLM_CORE_EVENT_TYPE as TLM_CET
} from 'tracim_frontend_lib'
import { buildActivityList } from '../../src/util/activity.js'

import { mockGetContentComments200 } from '../apiMock.js'

const createTlm = (eventId, entityType, coreEventType, subEntityType, fields) => {
  return {
    event_id: eventId,
    event_type: `${entityType}.${coreEventType}.${subEntityType}`,
    created: new Date(Date.now()).toISOString(),
    fields: fields,
    read: null
  }
}

describe('buildActivityList() function', () => {
  const apiUrl = 'http://localhost'
  const foo = {
    user_id: 1,
    public_name: 'Foo',
    username: 'foo',
    avatar_url: null
  }
  const fileContent = { content_id: 42, workspace_id: 23 }
  describe('foobar', async () => {
    mockGetContentComments200(apiUrl, fileContent.workspace_id, fileContent.content_id, [])

    const messageList = [
      createTlm(5, TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.FILE, {
        author: foo,
        content: fileContent
      }),
      createTlm(4, TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.FILE, {
        author: foo,
        content: fileContent
      })
    ]
    const expectedActivityList = [
      {
        id: 'content-42',
        entityType: TLM_ET.CONTENT,
        eventList: [
          { author: foo, created: messageList[0].created, eventId: 5, eventType: messageList[0].event_type },
          { author: foo, created: messageList[1].created, eventId: 4, eventType: messageList[1].event_type }
        ],
        reactionList: [],
        fields: {
          content: fileContent,
          comments: []
        }
      }
    ]
    const activityList = await buildActivityList(messageList, apiUrl)
    it('foobar', () => expect(activityList).to.be.deep.equal(expectedActivityList))
  })
})
