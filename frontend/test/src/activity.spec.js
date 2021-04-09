import { expect } from 'chai'

import {
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TLM_CORE_EVENT_TYPE as TLM_CET
} from 'tracim_frontend_lib'
import { mergeWithActivityList, addMessageToActivityList } from '../../src/util/activity.js'

import { mockGetContentComments200, mockGetFileContent400, mockGetContentPath200 } from '../apiMock.js'

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
  const workspace = { workspace_id: 23 }
  const fileContent = { content_id: 42, workspace_id: workspace.workspace_id, content_type: 'file' }
  const commentContent = {
    content_id: 254,
    content_type: TLM_ST.COMMENT,
    workspace_id: fileContent.workspace_id,
    parent_id: fileContent.content_id,
    parent_content_type: fileContent.content_type
  }
  const readerMember = { role: 'reader' }

  const messageList = [
    createMessage(6, TLM_ET.SHAREDSPACE_MEMBER, TLM_CET.CREATED, undefined, {
      author: foo,
      user: bar,
      member: readerMember,
      workspace: workspace
    }),
    createMessage(5, TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.FILE, {
      author: foo,
      content: fileContent,
      workspace: workspace
    }),
    createMessage(4, TLM_ET.SHAREDSPACE_SUBSCRIPTION, TLM_CET.CREATED, undefined, {
      author: bar,
      user: bar,
      subscription: {},
      workspace: workspace
    }),
    createMessage(3, TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.FILE, {
      author: foo,
      content: fileContent,
      workspace: workspace
    }),
    createMessage(2, TLM_ET.MENTION, TLM_CET.CREATED, undefined, {
      author: foo,
      mention: { recipient: 'all' },
      content: fileContent,
      workspace: workspace
    })
  ]

  const memberActivity = {
    id: 'workspace_member-e6',
    entityType: TLM_ET.SHAREDSPACE_MEMBER,
    eventList: [],
    commentList: [],
    newestMessage: messageList[0]
  }

  const contentActivity = {
    id: 'content-42',
    contentAvailable: true,
    contentPath: [],
    entityType: TLM_ET.CONTENT,
    eventList: [],
    commentList: [],
    newestMessage: messageList[1],
    content: fileContent
  }

  const subscriptionActivity = {
    id: 'workspace_subscription-e4',
    entityType: TLM_ET.SHAREDSPACE_SUBSCRIPTION,
    eventList: [],
    commentList: [],
    newestMessage: messageList[2]
  }

  const fixtureActivityList = [memberActivity, contentActivity, subscriptionActivity]

  describe('mergeWithActivityList() function', () => {
    it('should build an activity list', async () => {
      const mock = mockGetContentComments200(apiUrl, fileContent.workspace_id, fileContent.content_id, [])
      const mockContentPath = mockGetContentPath200(apiUrl, fileContent.workspace_id, fileContent.content_id, [])
      const resultActivityList = await mergeWithActivityList(messageList, [], apiUrl)
      expect(mock.isDone()).to.equal(true)
      expect(mockContentPath.isDone()).to.equal(true)
      expect(resultActivityList).to.be.deep.equal(fixtureActivityList)
    })

    it('should ignore comment messages which cannot retrieve their parent content', async () => {
      const message = createMessage(1, TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT, {
        author: foo,
        content: commentContent,
        workspace: workspace
      })
      const mockContentPath = mockGetContentPath200(apiUrl, commentContent.workspace_id, commentContent.content_id, [])
      const mock = mockGetFileContent400(apiUrl, fileContent.workspace_id, fileContent.content_id)
      const resultActivityList = await mergeWithActivityList([message], [], apiUrl)
      expect(mock.isDone()).to.equal(true)
      expect(mockContentPath.isDone()).to.equal(true)
      expect(resultActivityList).to.be.deep.equal([])
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
            { author: foo, created: modifiedMessage.created, eventId: 7, eventType: modifiedMessage.event_type.split('.')[1] },
            ...contentActivity.eventList
          ],
          commentList: [],
          contentAvailable: true,
          newestMessage: modifiedMessage
        }
      },
      {
        message: commentedMessage,
        expectedContentActivity: {
          ...contentActivity,
          eventList: [
            { author: foo, created: commentedMessage.created, eventId: 7, eventType: 'commented' },
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
          fixtureActivityList,
          apiUrl
        )
        expect(resultActivityList).to.be.deep.equal([memberActivity, expectedContentActivity, subscriptionActivity])
      })
    }

    it('should ignore messages with unhandled types', async () => {
      const resultActivityList = await addMessageToActivityList({ event_type: '' }, fixtureActivityList, apiUrl)
      expect(resultActivityList).to.be.deep.equal(fixtureActivityList)
    })

    it('should create a new activity if the message is not part of any activity', async () => {
      const otherFileContent = { workspace_id: workspace.workspace_id, content_id: 12 }
      const mock = mockGetContentComments200(apiUrl, otherFileContent.workspace_id, otherFileContent.content_id, [])
      const mockContentPath = mockGetContentPath200(apiUrl, otherFileContent.workspace_id, otherFileContent.content_id, [])

      const message = createMessage(7, TLM_ET.CONTENT, TLM_CET.MODIFIED, TLM_ST.FILE, {
        author: foo,
        content: otherFileContent,
        workspace: workspace
      })
      const expectedContentActivity = {
        id: 'content-12',
        entityType: TLM_ET.CONTENT,
        eventList: [],
        commentList: [],
        newestMessage: message,
        content: otherFileContent,
        contentAvailable: true,
        contentPath: []
      }
      const resultActivityList = await addMessageToActivityList(
        message,
        fixtureActivityList,
        apiUrl
      )
      expect(mock.isDone()).to.equal(true)
      expect(mockContentPath.isDone())
      expect(resultActivityList).to.be.deep.equal([expectedContentActivity, memberActivity, contentActivity, subscriptionActivity])
    })

    it('should ignore comment messages which cannot retrieve their parent content', async () => {
      const message = createMessage(1, TLM_ET.CONTENT, TLM_CET.CREATED, TLM_ST.COMMENT, {
        author: foo,
        content: commentContent,
        workspace: workspace
      })
      const mockContentPath = mockGetContentPath200(apiUrl, commentContent.workspace_id, commentContent.content_id, [])
      const mock = mockGetFileContent400(apiUrl, fileContent.workspace_id, fileContent.content_id)
      const resultActivityList = await addMessageToActivityList(message, [], apiUrl)
      expect(mock.isDone()).to.equal(true)
      expect(mockContentPath.isDone()).to.equal(true)
      expect(resultActivityList).to.be.deep.equal([])
    })
  })
})
