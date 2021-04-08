import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { ScrollToBottomWrapper } from '../../src/component/ScrollToBottomWrapper/ScrollToBottomWrapper.jsx'
import sinon from 'sinon'

const newWrapper = (props = { shouldScrollToBottom: true }) => {
  return mount(
    <ScrollToBottomWrapper {...props}>
      <span>Hello</span>
    </ScrollToBottomWrapper>
  )
}

describe('<ScrollToBottomWrapper />', () => {
  const scrollToCallBack = sinon.spy()
  window.HTMLElement.prototype.scrollTo = scrollToCallBack

  describe('functions', () => {
    describe('componentDidUpdate()', () => {
      describe('when shouldScrollToBottom is set to true', () => {
        const wrapper = newWrapper()
        wrapper.instance().componentDidUpdate()
        it('should observe its children', () => {
          expect(wrapper.instance().resizeObserver.disconnect.called).to.equal(true)
          expect(wrapper.instance().resizeObserver.observe.called).to.equal(true)
        })
      })

      describe('when shouldScrollToBottom is set to false', () => {
        const wrapper = newWrapper({ shouldScrollToBottom: false })
        wrapper.instance().componentDidUpdate()
        it('should not observe its children', () => {
          expect(wrapper.instance().resizeObserver.disconnect.called).to.equal(true)
          expect(wrapper.instance().resizeObserver.observe.called).to.equal(false)
        })
      })
    })
    describe('handleResizeChildren', () => {
      const testCases = [
        {
          description: 'when the scroll is at the bottom',
          atBottom: true,
          scrollToCalled: true,
          props: {}
        },
        {
          description: 'when the scroll is not at the bottom',
          atBottom: false,
          scrollToCalled: false,
          props: {}
        },
        {
          description: 'isLastItemAddedFromCurrentToken when the scroll is not at the bottom',
          atBottom: false,
          scrollToCalled: true,
          props: { isLastItemAddedFromCurrentToken: true }
        }
      ]
      for (const testCase of testCases) {
        describe(testCase.description, () => {
          const wrapper = newWrapper(testCase.props)
          before(() => {
            scrollToCallBack.resetHistory()
            wrapper.instance().atBottom = testCase.atBottom
            wrapper.instance().handleResizeChildren()
          })
          const expectString = testCase.scrollToCalled
            ? 'scrollTo should have been called'
            : 'scrollTo should not have been called'
          it(expectString, () => {
            expect(scrollToCallBack.called).to.equal(testCase.scrollToCalled)
          })
        })
      }
    })
  })
})
