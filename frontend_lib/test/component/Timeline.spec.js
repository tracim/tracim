import React from 'react'
import { withRouterMock, RouterMock } from '../hocMock/withRouter'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { Timeline } from '../../src/component/Timeline/Timeline.jsx'
import sinon from 'sinon'
import { ROLE } from '../../src/helper.js'
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
    translationTargetLanguageList: [{ code: 'fr', display: 'Français' }],
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
})
