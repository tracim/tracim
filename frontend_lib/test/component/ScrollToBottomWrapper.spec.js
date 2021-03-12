import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { ScrollToBottomWrapper } from '../../src/component/ScrollToBottomWrapper/ScrollToBottomWrapper.jsx'
import sinon from 'sinon'
import { commentList } from '../fixture/contentCommentList.js'
import { revisionList } from '../fixture/contentRevisionList.js'

describe('<ScrollToBottomWrapper />', () => {
  const props = {
    itemList: [...revisionList, ...commentList],
    customClass: 'randomCustomClass',
    shouldScrollToBottom: true,
    registerCustomEventHandlerList: () => {},
    t: key => key
  }

  const scrollIntoViewCallBack = sinon.spy()

  const initialInnerWidth = 1500
  window.innerWidth = initialInnerWidth
  window.HTMLElement.prototype.scrollIntoView = scrollIntoViewCallBack
  const wrapper = mount(
    <ScrollToBottomWrapper
      {...props}
    />
  )

  describe('functions', () => {
    describe('getContentId()', () => {
      describe('content is undefined', () => {
        it('should return -1', () => {
          expect(wrapper.instance().getContentId()).to.equal(-1)
        })
      })
      describe('content is a comment', () => {
        it('should return its parent_id', () => {
          expect(wrapper.instance().getContentId(commentList[0])).to.equal(commentList[0].parent_id)
        })
      })
      describe('content is a revision', () => {
        it('should return its content_id', () => {
          expect(wrapper.instance().getContentId(revisionList[0])).to.equal(revisionList[0].content_id)
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
        describe('an item is added when the scroll is at the bottom', () => {
          before(() => {
            scrollIntoViewCallBack.resetHistory()
            wrapper.instance().containerScrollHeight = scrollTop + clientHeight
            wrapper.instance().container = {
              scrollTop: scrollTop,
              clientHeight: clientHeight
            }
            wrapper.instance().scrollToBottom(props.itemList)
          })

          it('should scroll to the bottom to see the new item', () => {
            expect(scrollIntoViewCallBack.called).to.equal(true)
          })
        })
        describe('an item is added when the scroll is not at the bottom', () => {
          before(() => {
            scrollIntoViewCallBack.resetHistory()
            wrapper.instance().container = {
              scrollTop: scrollTop,
              clientHeight: clientHeight
            }
            wrapper.instance().containerScrollHeight = scrollTop
            wrapper.instance().scrollToBottom(props.itemList)
          })

          it('should not scroll to the bottom', () => {
            expect(scrollIntoViewCallBack.called).to.equal(false)
          })
        })
        describe('an item is added by the current session when the scroll is not at the bottom', () => {
          before(() => {
            scrollIntoViewCallBack.resetHistory()
            wrapper.instance().containerScrollHeight = scrollTop
            wrapper.setProps({ isLastItemAddedFromCurrentToken: true })
            wrapper.instance().container = {
              scrollTop: scrollTop,
              clientHeight: clientHeight
            }
            wrapper.instance().scrollToBottom(props.itemList)
          })
          after(() => {
            wrapper.setProps({ isLastItemAddedFromCurrentToken: false })
          })

          it('should scroll to the bottom', () => {
            expect(scrollIntoViewCallBack.called).to.equal(true)
          })
        })
        describe('the content has changed', () => {
          before(() => {
            scrollIntoViewCallBack.resetHistory()
            wrapper.instance().containerScrollHeight = scrollTop
            wrapper.setProps({ itemList: commentList.map(item => ({ ...item, parent_id: item.parent_id + 1 })) })
            wrapper.instance().container = {
              scrollTop: scrollTop,
              clientHeight: clientHeight
            }
            wrapper.instance().scrollToBottom(props.itemList)
          })
          after(() => {
            wrapper.setProps({ itemList: props.itemList })
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

        describe('a comment is added by the current session', () => {
          before(() => {
            scrollIntoViewCallBack.resetHistory()
            wrapper.instance().containerScrollHeight = scrollTop
            wrapper.setProps({ isLastItemAddedFromCurrentToken: true, itemList: commentList })
            wrapper.instance().container = {
              scrollTop: scrollTop,
              clientHeight: clientHeight
            }
            wrapper.instance().scrollToBottom(props.itemList)
          })
          after(() => {
            wrapper.setProps({ isLastItemAddedFromCurrentToken: false, itemList: props.itemList })
          })

          it('should scroll to the bottom', () => {
            expect(scrollIntoViewCallBack.called).to.equal(true)
          })
        })
        describe('a revision is added by the current session', () => {
          before(() => {
            scrollIntoViewCallBack.resetHistory()
            wrapper.instance().containerScrollHeight = scrollTop
            wrapper.setProps({ isLastItemAddedFromCurrentToken: true, itemList: revisionList })
            wrapper.instance().container = {
              scrollTop: scrollTop,
              clientHeight: clientHeight
            }
            wrapper.instance().scrollToBottom(props.itemList)
          })
          after(() => {
            wrapper.setProps({ isLastItemAddedFromCurrentToken: false, itemList: props.itemList })
          })

          it('should not scroll to the bottom', () => {
            expect(scrollIntoViewCallBack.called).to.equal(false)
          })
        })
      })
    })
  })
})
