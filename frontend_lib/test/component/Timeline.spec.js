import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { Timeline } from '../../src/component/Timeline/Timeline.jsx'
import sinon from 'sinon'
import { ROLE } from '../../src/helper.js'
import { commentList } from '../fixture/contentCommentList.js'
import { revisionList } from '../fixture/contentRevisionList.js'

describe('<Timeline />', () => {
  const onClickWysiwygBtnCallBack = sinon.spy()
  const onClickRevisionBtnCallBack = sinon.spy()
  const onClickRestoreArchivedCallBack = sinon.spy()
  const onClickRestoreDeletedCallBack = sinon.spy()
  const onClickValidateNewCommentBtnCallBack = sinon.spy()
  const onChangeNewCommentCallBack = sinon.spy()

  const props = {
    timelineData: [...revisionList, ...commentList],
    newComment: 'randomNewComment',
    apiUrl: '/',
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
    availableStatusList: [],
    registerCustomEventHandlerList: () => {},
    t: key => key
  }

  const scrollIntoViewCallBack = sinon.spy()

  const initialInnerWidth = 1500
  window.innerWidth = initialInnerWidth
  window.HTMLElement.prototype.scrollIntoView = scrollIntoViewCallBack
  const wrapper = mount(
    <Timeline
      {...props}
    />
  )

  describe('Static design', () => {
    it('The advanced mode button should be disabled when disableComment is true', () => {
      expect(wrapper.find('.timeline__texteditor__advancedtext__btn').prop('disabled')).to.equal(false)
      wrapper.setProps({ disableComment: true })
      expect(wrapper.find('.timeline__texteditor__advancedtext__btn').prop('disabled')).to.equal(true)
      wrapper.setProps({ disableComment: false })
    })
  })

  describe('functions', () => {
    describe('getTimelineContentId()', () => {
      describe('content is undefined', () => {
        it('should return -1', () => {
          expect(wrapper.instance().getTimelineContentId()).to.equal(-1)
        })
      })
      describe('content is a comment', () => {
        it('should return its parent_id', () => {
          expect(wrapper.instance().getTimelineContentId(commentList[0])).to.equal(commentList[0].parent_id)
        })
      })
      describe('content is a revision', () => {
        it('should return its content_id', () => {
          expect(wrapper.instance().getTimelineContentId(revisionList[0])).to.equal(revisionList[0].content_id)
        })
      })
    })
    describe('scrollToBottom()', () => {
      const scrollTop = 500
      const clientHeight = 1000
      describe('Window.innerWidth >= 1200', () => {
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
            wrapper.instance().scrollToBottom(props.timelineData)
          })

          it('should scroll to the bottom to see the new timeline item', () => {
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
            wrapper.instance().scrollToBottom(props.timelineData)
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
            wrapper.instance().scrollToBottom(props.timelineData)
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
            wrapper.instance().scrollToBottom(props.timelineData)
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
            wrapper.instance().scrollToBottom(props.timelineData)
          })
          after(() => {
            wrapper.setProps({ newComment: props.newComment })
          })

          it('should not scroll to the bottom when the component did update', () => {
            expect(scrollIntoViewCallBack.called).to.equal(false)
          })
        })
        describe('the content has changed', () => {
          before(() => {
            scrollIntoViewCallBack.resetHistory()
            wrapper.instance().timelineContainerScrollHeight = scrollTop
            wrapper.setProps({ timelineData: commentList.map(item => ({ ...item, parent_id: item.parent_id + 1 })) })
            wrapper.instance().timelineContainer = {
              scrollTop: scrollTop,
              clientHeight: clientHeight
            }
            wrapper.instance().scrollToBottom(props.timelineData)
          })
          after(() => {
            wrapper.setProps({ timelineData: props.timelineData })
          })

          it('should scroll to the bottom', () => {
            expect(scrollIntoViewCallBack.called).to.equal(true)
          })
        })
      })
      describe('Window.innerWidth < 1200', () => {
        before(() => {
          window.innerWidth = 1000
        })

        after(() => {
          window.innerWidth = initialInnerWidth
        })

        describe('a timeline comment is added by the current session', () => {
          before(() => {
            scrollIntoViewCallBack.resetHistory()
            wrapper.instance().timelineContainerScrollHeight = scrollTop
            wrapper.setProps({ isLastTimelineItemCurrentToken: true, newComment: '', timelineData: commentList })
            wrapper.instance().timelineContainer = {
              scrollTop: scrollTop,
              clientHeight: clientHeight
            }
            wrapper.instance().scrollToBottom(props.timelineData)
          })
          after(() => {
            wrapper.setProps({ isLastTimelineItemCurrentToken: false, newComment: props.newComment, timelineData: props.timelineData })
          })

          it('should scroll to the bottom', () => {
            expect(scrollIntoViewCallBack.called).to.equal(true)
          })
        })
        describe('a timeline revision is added by the current session', () => {
          before(() => {
            scrollIntoViewCallBack.resetHistory()
            wrapper.instance().timelineContainerScrollHeight = scrollTop
            wrapper.setProps({ isLastTimelineItemCurrentToken: true, newComment: '', timelineData: revisionList })
            wrapper.instance().timelineContainer = {
              scrollTop: scrollTop,
              clientHeight: clientHeight
            }
            wrapper.instance().scrollToBottom(props.timelineData)
          })
          after(() => {
            wrapper.setProps({ isLastTimelineItemCurrentToken: false, newComment: props.newComment, timelineData: props.timelineData })
          })

          it('should not scroll to the bottom', () => {
            expect(scrollIntoViewCallBack.called).to.equal(false)
          })
        })
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
  })
})
