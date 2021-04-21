import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { ScrollToBottomWrapper } from '../../src/component/ScrollToBottomWrapper/ScrollToBottomWrapper.jsx'
import sinon from 'sinon'

const newWrapper = (props) => {
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
    describe('handleResizeChildren', () => {
      const testCases = [
        {
          description: 'when the scroll is at the bottom',
          atBottom: true,
          scrollToCalled: true,
          props: { shouldScrollToBottom: true }
        },
        {
          description: 'when the scroll is not at the bottom',
          atBottom: false,
          scrollToCalled: false,
          props: { shouldScrollToBottom: true }
        },
        {
          description: 'isLastItemAddedFromCurrentToken when the scroll is not at the bottom',
          atBottom: false,
          scrollToCalled: true,
          props: { isLastItemAddedFromCurrentToken: true, shouldScrollToBottom: true }
        },
        {
          description: 'shouldScrollToBottom is false',
          atBottom: true,
          scrollToCalled: false,
          props: { shouldScrollToBottom: false }
        }
      ]

      for (const testCase of testCases) {
        describe(testCase.description, () => {
          const wrapper = newWrapper(testCase.props)
          const instance = wrapper.instance()

          before(() => {
            scrollToCallBack.resetHistory()
            instance.atBottom = testCase.atBottom
            instance.handleResizeChildren()
            instance.handleResizeChildren.flush()
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
