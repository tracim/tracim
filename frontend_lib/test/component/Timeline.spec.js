import React from 'react'
import { withRouterMock, RouterMock } from '../hocMock/withRouter'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { groupTimelineData, Timeline } from '../../src/component/Timeline/Timeline.jsx'
import sinon from 'sinon'
import { ROLE, TIMELINE_TYPE } from '../../src/constant.js'
import { commentList } from '../fixture/contentCommentList.js'
import { revisionList } from '../fixture/contentRevisionList.js'
import { reactstrapPopoverHack } from '../testHelper.js'

const nock = require('nock')

describe('<Timeline />', () => {
  const onClickRevisionBtnCallBack = sinon.spy()
  const onClickRestoreArchivedCallBack = sinon.spy()
  const onClickRestoreDeletedCallBack = sinon.spy()

  const props = {
    timelineData: [...revisionList, ...commentList],
    newComment: 'randomNewComment',
    apiUrl: 'http://fake.url/api',
    disableComment: false,
    customClass: 'randomCustomClass',
    customColor: 'red',
    loggedUser: {
      userId: 'randomIdLogin',
      name: 'randomNameLogin',
      userRoleIdInWorkspace: ROLE.contentManager.id
    },
    system: {
      config: {
        iframe_whitelist: []
      },
      ui__notes__code_sample_languages: [],
      translation_service__target_languages: [{ code: 'fr', display: 'Français' }]
    },
    onClickRevisionBtn: onClickRevisionBtnCallBack,
    allowClickOnRevision: true,
    shouldScrollToBottom: true,
    showHeader: true,
    rightPartOpen: false, // irrelevant if showHeader is false
    isArchived: false,
    onClickRestoreArchived: onClickRestoreArchivedCallBack,
    isDeleted: false,
    onClickRestoreDeleted: onClickRestoreDeletedCallBack,
    isLastTimelineItemCurrentToken: false,
    availableStatusList: [],
    registerCustomEventHandlerList: () => {},
    t: key => key,
    workspaceId: 1,
    translationTargetLanguageCode: 'en',
    onChangeTranslationTargetLanguageCode: () => {},
    fetchMoreTimelineItems: () => {},
    canFetchMoreTimelineItems: () => false
  }

  function mockReactions () {
    for (const comment of commentList) {
      nock(props.apiUrl).get(`/workspaces/${props.workspaceId}/contents/${comment.content_id}/reactions`).reply(200, [])
      reactstrapPopoverHack(document, `createdDistance_${comment.content_id}`)
      reactstrapPopoverHack(document, `modificationDate_${comment.content_id}`)
    }
  }

  mockReactions()

  const TimelineWithHOC = withRouterMock(Timeline)
  const wrapper = mount(<TimelineWithHOC {...props} />, { wrappingComponent: RouterMock })

  describe('Static design', () => {
    it('The advanced mode button should be disabled when disableComment is true', () => {
      expect(wrapper.find('.commentArea__advancedtext__btn').prop('disabled')).to.equal(false)
      wrapper.setProps({ disableComment: true })
      expect(wrapper.find('.commentArea__advancedtext__btn').prop('disabled')).to.equal(true)
      wrapper.setProps({ disableComment: false })
    })
  })

  describe('function groupTimelineData', () => {
    it('should group the revision', () => {
      const timelineData = [
        { content_id: 1, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 2, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 3, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 4, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 5, timelineType: TIMELINE_TYPE.REVISION }
      ]

      const expectedResult = [{
        timelineType: TIMELINE_TYPE.REVISION_GROUP,
        group: [
          { content_id: 1, timelineType: TIMELINE_TYPE.REVISION },
          { content_id: 2, timelineType: TIMELINE_TYPE.REVISION },
          { content_id: 3, timelineType: TIMELINE_TYPE.REVISION },
          { content_id: 4, timelineType: TIMELINE_TYPE.REVISION },
          { content_id: 5, timelineType: TIMELINE_TYPE.REVISION }
        ]
      }]

      expect(groupTimelineData(timelineData)).to.deep.equal(expectedResult)
    })

    it('should group the revision and keep the comment', () => {
      const timelineData = [
        { content_id: 1, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 2, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 3, timelineType: TIMELINE_TYPE.COMMENT },
        { content_id: 4, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 5, timelineType: TIMELINE_TYPE.REVISION }
      ]

      const expectedResult = [
        {
          timelineType: TIMELINE_TYPE.REVISION_GROUP,
          group: [
            { content_id: 1, timelineType: TIMELINE_TYPE.REVISION },
            { content_id: 2, timelineType: TIMELINE_TYPE.REVISION }
          ]
        },
        { content_id: 3, timelineType: TIMELINE_TYPE.COMMENT },
        {
          timelineType: TIMELINE_TYPE.REVISION_GROUP,
          group: [
            { content_id: 4, timelineType: TIMELINE_TYPE.REVISION },
            { content_id: 5, timelineType: TIMELINE_TYPE.REVISION }
          ]
        }
      ]

      expect(groupTimelineData(timelineData)).to.deep.equal(expectedResult)
    })

    it('should not group a single revision', () => {
      const timelineData = [
        { content_id: 1, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 2, timelineType: TIMELINE_TYPE.COMMENT },
        { content_id: 3, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 4, timelineType: TIMELINE_TYPE.COMMENT },
        { content_id: 5, timelineType: TIMELINE_TYPE.REVISION }
      ]

      const expectedResult = [
        { content_id: 1, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 2, timelineType: TIMELINE_TYPE.COMMENT },
        { content_id: 3, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 4, timelineType: TIMELINE_TYPE.COMMENT },
        { content_id: 5, timelineType: TIMELINE_TYPE.REVISION }
      ]

      expect(groupTimelineData(timelineData)).to.deep.equal(expectedResult)
    })

    it('should group the revision in multiple groups separated by comments', () => {
      const timelineData = [
        { content_id: 1, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 2, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 3, timelineType: TIMELINE_TYPE.COMMENT },
        { content_id: 4, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 5, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 6, timelineType: TIMELINE_TYPE.COMMENT }
      ]

      const expectedResult = [
        {
          timelineType: TIMELINE_TYPE.REVISION_GROUP,
          group: [
            { content_id: 1, timelineType: TIMELINE_TYPE.REVISION },
            { content_id: 2, timelineType: TIMELINE_TYPE.REVISION }
          ]
        },
        { content_id: 3, timelineType: TIMELINE_TYPE.COMMENT },
        {
          timelineType: TIMELINE_TYPE.REVISION_GROUP,
          group: [
            { content_id: 4, timelineType: TIMELINE_TYPE.REVISION },
            { content_id: 5, timelineType: TIMELINE_TYPE.REVISION }
          ]
        },
        { content_id: 6, timelineType: TIMELINE_TYPE.COMMENT }
      ]

      expect(groupTimelineData(timelineData)).to.deep.equal(expectedResult)
    })

    it('should not group file as comment while still grouping revision', () => {
      const timelineData = [
        { content_id: 1, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 2, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 3, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 4, timelineType: TIMELINE_TYPE.COMMENT_AS_FILE },
        { content_id: 5, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 6, timelineType: TIMELINE_TYPE.REVISION }
      ]
      const expectedResult = [
        {
          timelineType: TIMELINE_TYPE.REVISION_GROUP,
          group: [
            { content_id: 1, timelineType: TIMELINE_TYPE.REVISION },
            { content_id: 2, timelineType: TIMELINE_TYPE.REVISION },
            { content_id: 3, timelineType: TIMELINE_TYPE.REVISION }
          ]
        },
        { content_id: 4, timelineType: TIMELINE_TYPE.COMMENT_AS_FILE },
        {
          timelineType: TIMELINE_TYPE.REVISION_GROUP,
          group: [
            { content_id: 5, timelineType: TIMELINE_TYPE.REVISION },
            { content_id: 6, timelineType: TIMELINE_TYPE.REVISION }
          ]
        }
      ]
      expect(groupTimelineData(timelineData)).to.deep.equal(expectedResult)
    })

    it('should return an empty array when timelineData is empty', () => {
      const timelineData = []
      const expectedResult = []
      expect(groupTimelineData(timelineData)).to.deep.equal(expectedResult)
    })

    it('should return an empty array when timelineData is null', () => {
      const timelineData = null
      const expectedResult = []
      expect(groupTimelineData(timelineData)).to.deep.equal(expectedResult)
    })

    it('should not group a single revision', () => {
      const timelineData = [
        { content_id: 1, timelineType: TIMELINE_TYPE.REVISION }
      ]
      const expectedResult = [
        { content_id: 1, timelineType: TIMELINE_TYPE.REVISION }
      ]
      expect(groupTimelineData(timelineData)).to.deep.equal(expectedResult)
    })

    it('should not group a single comment', () => {
      const timelineData = [
        { content_id: 1, timelineType: TIMELINE_TYPE.COMMENT }
      ]
      const expectedResult = [
        { content_id: 1, timelineType: TIMELINE_TYPE.COMMENT }
      ]
      expect(groupTimelineData(timelineData)).to.deep.equal(expectedResult)
    })

    it('should not group revision when timeline has less than 5 items', () => {
      const timelineData = [
        { content_id: 1, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 2, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 3, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 4, timelineType: TIMELINE_TYPE.REVISION }
      ]
      const expectedResult = [
        { content_id: 1, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 2, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 3, timelineType: TIMELINE_TYPE.REVISION },
        { content_id: 4, timelineType: TIMELINE_TYPE.REVISION }
      ]
      expect(groupTimelineData(timelineData)).to.deep.equal(expectedResult)
    })
  })
})
