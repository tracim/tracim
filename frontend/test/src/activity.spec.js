import { expect } from 'chai'

import {
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TLM_CORE_EVENT_TYPE as TLM_CET
} from 'tracim_frontend_lib'
import { mergeWithActivityList, addMessageToActivityList } from '../../src/util/activity.js'

import { mockGetContentComments200 } from '../apiMock.js'

const createMessage = (eventId, entityType, coreEventType, subEntityType, fields) => {
  return {
    event_id: eventId,
    event_type: `${entityType}.${coreEventType}.${subEntityType}`,
    created: new Date(Date.now()).toISOString(),
    fields: fields,
    read: null
  }
}

describe('In activity.js module', () => {
  const apiUrl = 'http://localhost'
  const foo = {
    user_id: 1,
    public_name: 'Foo',
    username: 'foo',
    avatar_url: null
  }
  const bar = {
    user_id: 2,
    public_name: 'Bar',
    username: 'bar',
    avatar_url: null
  }
  const fileContent = { content_id: 42, workspace_id: 23 }
  const readerMember = { role: 'reader' }

  const messageList = [
    createMessage(6, TLM_ET.SHAREDSPACE_MEMBER, TLM_CET.CREATED, undefined, {
      author: foo,
      user: bar,
      member: readerMember,
      workspace: { workspace_id: 23 }
    }),
    createMessage(5, TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.FILE, {
      author: foo,
      content: fileContent
    }),
    createMessage(4, TLM_ET.SHAREDSPACE_SUBSCRIPTION, TLM_CET.CREATED, undefined, {
      author: bar,
      user: bar,
      subscription: {},
      workspace: { workspace_id: 23 }
    }),
    createMessage(3, TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.FILE, {
      author: foo,
      content: fileContent
    })
  ]

  const memberActivity = {
    id: 'workspace_member-e6',
    entityType: TLM_ET.SHAREDSPACE_MEMBER,
    eventList: [
      { author: foo, created: messageList[0].created, eventId: 6, eventType: messageList[0].event_type }
    ],
    reactionList: [],
    newestMessage: messageList[0]
  }
  const contentActivity = {
    id: 'content-42',
    entityType: TLM_ET.CONTENT,
    eventList: [
      { author: foo, created: messageList[1].created, eventId: 5, eventType: messageList[1].event_type },
      { author: foo, created: messageList[3].created, eventId: 3, eventType: messageList[3].event_type }
    ],
    reactionList: [],
    commentList: [],
    newestMessage: messageList[1],
    content: fileContent
  }
  const subscriptionActivity = {
    id: 'workspace_subscription-e4',
    entityType: TLM_ET.SHAREDSPACE_SUBSCRIPTION,
    eventList: [
      { author: bar, created: messageList[2].created, eventId: 4, eventType: messageList[2].event_type }
    ],
    reactionList: [],
    newestMessage: messageList[2]
  }

  describe('mergeWithActivityList() function', () => {
    it('should build an activity list', async () => {
      const mock = mockGetContentComments200(apiUrl, fileContent.workspace_id, fileContent.content_id, [])
      const resultActivityList = await mergeWithActivityList(messageList, [], apiUrl)
      expect(mock.isDone()).to.equal(true)
      expect(resultActivityList).to.be.deep.equal([memberActivity, contentActivity, subscriptionActivity])
    })
  })

  describe('addMessageToActivityList() function', () => {
    const modifiedMessage = createMessage(7, TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.FILE, {
      author: foo,
      content: fileContent
    })
    const commentedMessage = createMessage(7, TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT, {
      author: foo,
      content: { label: 'Foo bar', parent_id: fileContent.content_id }
    })
    const messageTestCases = [
      {
        message: modifiedMessage,
        expectedContentActivity: {
          ...contentActivity,
          eventList: [
            { author: foo, created: modifiedMessage.created, eventId: 7, eventType: modifiedMessage.event_type },
            ...contentActivity.eventList
          ],
          newestMessage: modifiedMessage
        }
      },
      {
        message: commentedMessage,
        expectedContentActivity: {
          ...contentActivity,
          eventList: [
            { author: foo, created: commentedMessage.created, eventId: 7, eventType: commentedMessage.event_type },
            ...contentActivity.eventList
          ],
          commentList: [commentedMessage.fields.content],
          newestMessage: commentedMessage
        }
      }
    ]
    for (const testCase of messageTestCases) {
      const { message, expectedContentActivity } = testCase
      it(`should add the message in the right activity (${message.event_type})`, async () => {
        const resultActivityList = await addMessageToActivityList(
          message,
          [memberActivity, contentActivity, subscriptionActivity],
          apiUrl
        )
        expect(resultActivityList).to.be.deep.equal([memberActivity, expectedContentActivity, subscriptionActivity])
      })
    }

    it('should create a new activity if the message is not part of any activity', async () => {
      const otherFileContent = { workspace_id: 54, content_id: 12 }
      const mock = mockGetContentComments200(apiUrl, otherFileContent.workspace_id, otherFileContent.content_id, [])
      const message = createMessage(7, TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.FILE, {
        author: foo,
        content: otherFileContent
      })
      const expectedContentActivity = {
        id: 'content-12',
        entityType: TLM_ET.CONTENT,
        eventList: [
          { author: foo, created: message.created, eventId: 7, eventType: message.event_type }
        ],
        reactionList: [],
        commentList: [],
        newestMessage: message,
        content: otherFileContent
      }
      const resultActivityList = await addMessageToActivityList(
        message,
        [memberActivity, contentActivity, subscriptionActivity],
        apiUrl
      )
      expect(mock.isDone()).to.equal(true)
      expect(resultActivityList).to.be.deep.equal([expectedContentActivity, memberActivity, contentActivity, subscriptionActivity])
    })
  })
})
