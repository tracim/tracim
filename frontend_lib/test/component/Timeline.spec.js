import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { Timeline } from '../../src/component/Timeline/Timeline.jsx'
import sinon from 'sinon'
import { ROLE } from '../../src/helper.js'

describe('<Timeline />', () => {
  const onClickWysiwygBtnCallBack = sinon.spy()
  const onClickRevisionBtnCallBack = sinon.spy()
  const onClickRestoreArchivedCallBack = sinon.spy()
  const onClickRestoreDeletedCallBack = sinon.spy()
  const onClickValidateNewCommentBtnCallBack = sinon.spy()
  const onChangeNewCommentCallBack = sinon.spy()

  const props = {
    timelineData: [],
    newComment: 'randomNewComment',
    onChangeNewComment: onChangeNewCommentCallBack,
    onClickValidateNewCommentBtn: onClickValidateNewCommentBtnCallBack,
    disableComment: false,
    customClass: 'randomCustomClass',
    customColor: 'red',
    loggedUser: {
      userId: 'randomIdLogin',
      name: 'randomNameLogin',
      userRoleIdInWorkspace: ROLE.contentManager.id
    },
    wysiwyg: false,
    onClickWysiwygBtn: onClickWysiwygBtnCallBack,
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
    registerCustomEventHandlerList: () => {},
    t: key => key
  }

  const scrollIntoViewCallBack = sinon.spy()

  window.HTMLElement.prototype.scrollIntoView = scrollIntoViewCallBack
  const wrapper = mount(
    <Timeline
      {...props}
    />
  )

  describe('Static design', () => {
    it(`The textarea should have the value:"${props.newComment}"`, () => {
      expect(wrapper.find('#wysiwygTimelineComment').prop('value')).to.equal(props.newComment)
    })
    it('The advanced mode button should be disabled when disableComment is true', () => {
      expect(wrapper.find('.timeline__texteditor__advancedtext__btn').prop('disabled')).to.equal(false)
      wrapper.setProps({ disableComment: true })
      expect(wrapper.find('.timeline__texteditor__advancedtext__btn').prop('disabled')).to.equal(true)
      wrapper.setProps({ disableComment: false })
    })
  })

  describe('AutoScroll', () => {
    const scrollTop = 500
    const clientHeight = 1000

    describe('when shouldScrollToBottom is set to false', () => {
      before(() => {
        scrollIntoViewCallBack.resetHistory()
        wrapper.setProps({ shouldScrollToBottom: false })
      })
      after(() => {
        wrapper.setProps({ shouldScrollToBottom: true })
      })

      it('should not scroll to the bottom', () => {
        expect(scrollIntoViewCallBack.called).to.equal(false)
      })
    })
    describe('a timeline item is added when the timeline scroll is at the bottom', () => {
      before(() => {
        scrollIntoViewCallBack.resetHistory()
        wrapper.instance().timelineContainerScrollHeight = scrollTop + clientHeight
        wrapper.instance().timelineContainer = {
          scrollTop: scrollTop,
          clientHeight: clientHeight
        }
        wrapper.instance().scrollToBottom()
      })

      it('should scroll to the bottom to see the new timline item', () => {
        expect(scrollIntoViewCallBack.called).to.equal(true)
      })
    })
    describe('a timeline item is added when the timeline scroll is not at the bottom', () => {
      before(() => {
        scrollIntoViewCallBack.resetHistory()
        wrapper.instance().timelineContainer = {
          scrollTop: scrollTop,
          clientHeight: clientHeight
        }
        wrapper.instance().timelineContainerScrollHeight = scrollTop
        wrapper.instance().scrollToBottom()
      })

      it('should not scroll to the bottom', () => {
        expect(scrollIntoViewCallBack.called).to.equal(false)
      })
    })
    describe('a timeline item is added by the current session when the timeline scroll is not at the bottom', () => {
      before(() => {
        scrollIntoViewCallBack.resetHistory()
        wrapper.instance().timelineContainerScrollHeight = scrollTop
        wrapper.setProps({ isLastTimelineItemCurrentToken: true, newComment: '' })
        wrapper.instance().timelineContainer = {
          scrollTop: scrollTop,
          clientHeight: clientHeight
        }
        wrapper.instance().scrollToBottom()
      })
      after(() => {
        wrapper.setProps({ isLastTimelineItemCurrentToken: false, newComment: props.newComment })
      })

      it('should scroll to the bottom', () => {
        expect(scrollIntoViewCallBack.called).to.equal(true)
      })
    })
    describe('a new comment is being typed and isLastTimelineItemCurrentToken is true', () => {
      before(() => {
        scrollIntoViewCallBack.resetHistory()
        wrapper.instance().timelineContainerScrollHeight = scrollTop
        wrapper.setProps({ isLastTimelineItemCurrentToken: true, newComment: 'newCommentTest' })
        wrapper.instance().timelineContainer = {
          scrollTop: scrollTop,
          clientHeight: clientHeight
        }
        wrapper.instance().scrollToBottom()
      })
      after(() => {
        wrapper.setProps({ isLastTimelineItemCurrentToken: false, newComment: props.newComment })
      })

      it('should not scroll to the bottom when the component did update', () => {
        expect(scrollIntoViewCallBack.called).to.equal(false)
      })
    })
    describe('a new comment is being typed and isLastTimelineItemCurrentToken is false', () => {
      before(() => {
        scrollIntoViewCallBack.resetHistory()
        wrapper.instance().timelineContainerScrollHeight = scrollTop
        wrapper.setProps({ newComment: 'newCommentTest' })
        wrapper.instance().timelineContainer = {
          scrollTop: scrollTop,
          clientHeight: clientHeight
        }
        wrapper.instance().scrollToBottom()
      })
      after(() => {
        wrapper.setProps({ newComment: props.newComment })
      })

      it('should not scroll to the bottom when the component did update', () => {
        expect(scrollIntoViewCallBack.called).to.equal(false)
      })
    })
  })

  describe('Handlers', () => {
    it('onClickWysiwygBtnCallBack should be called when the advancedText button is clicked', () => {
      wrapper.find(`.${props.customClass}__texteditor__advancedtext__btn`).simulate('click')
      expect(onClickWysiwygBtnCallBack.called).to.equal(true)
    })

    it('onClickValidateNewCommentBtnCallBack should be called when the submit button is clicked', () => {
      wrapper.find(`.${props.customClass}__texteditor__submit__btn`).simulate('click')
      expect(onClickValidateNewCommentBtnCallBack.called).to.equal(true)
    })

    it('onChangeNewCommentCallBack should be called when comment is changing', () => {
      wrapper.find('#wysiwygTimelineComment').simulate('change')
      expect(onChangeNewCommentCallBack.called).to.equal(true)
    })
  })
})
