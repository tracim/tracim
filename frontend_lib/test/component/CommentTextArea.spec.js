import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { CommentTextArea } from '../../src/component/Timeline/CommentTextArea.jsx'
import sinon from 'sinon'

describe('<CommentTextArea />', () => {
  const onChangeNewCommentSpy = sinon.spy()

  const props = {
    newComment: '',
    apiUrl: '/',
    onChangeNewComment: onChangeNewCommentSpy,
    disableComment: false,
    id: 'autoCompleteInputId',
    t: key => key,
    searchForMentionInQuery: () => []
  }

  const wrapper = shallow(
    <CommentTextArea
      {...props}
    />
  )

  const initialTextAreaRef = { selectionStart: 0, selectionEnd: 0 }
  wrapper.instance().textAreaRef = initialTextAreaRef

  describe('intern functions', () => {
    describe('handleInputKeyDown()', () => {
      const preventDefaultSpy = sinon.spy()
      const initialEvent = {
        key: 'A',
        preventDefault: preventDefaultSpy
      }

      describe('when isAutoCompleteActivated is true', () => {
        beforeEach(() => {
          wrapper.setState({ isAutoCompleteActivated: true })
        })

        afterEach(() => {
          preventDefaultSpy.resetHistory()
        })

        describe('press " "', () => {
          before(() => {
            wrapper.setState({ autoCompleteItemList: [{ mention: 'all', detail: 'notify all' }] })
          })

          it('should set isAutoCompleteActivated to false and clean autoCompleteItemList', () => {
            wrapper.instance().handleInputKeyDown({ ...initialEvent, key: ' ' })
            expect(wrapper.state('isAutoCompleteActivated')).to.equal(false)
            expect(wrapper.state('autoCompleteItemList')).to.deep.equal([])
          })
        })

        describe('press "Enter"', () => {
          before(() => {
            wrapper.setState({ autoCompleteItemList: [{ mention: 'all', detail: 'notify all' }] })
          })

          it('should prevent default', () => {
            wrapper.instance().handleInputKeyDown({ ...initialEvent, key: 'Enter' })
            expect(preventDefaultSpy.calledOnce).to.equal(true)
          })
        })

        describe('press "ArrowUp"', () => {
          before(() => {
            wrapper.setState({
              autoCompleteItemList: [{ mention: 'all', detail: 'notify all' }, { mention: 'john', detail: 'John doe' }],
              autoCompleteCursorPosition: 1
            })
          })

          it('should decrement autoCompleteCursorPosition and prevent default', () => {
            wrapper.instance().handleInputKeyDown({ ...initialEvent, key: 'ArrowUp' })
            expect(wrapper.state('autoCompleteCursorPosition')).to.equal(0)
            expect(preventDefaultSpy.calledOnce).to.equal(true)
          })
        })

        describe('press "ArrowDown"', () => {
          before(() => {
            wrapper.setState({
              autoCompleteItemList: [{ mention: 'all', detail: 'notify all' }, { mention: 'john', detail: 'John doe' }],
              autoCompleteCursorPosition: 0
            })
          })

          it('should decrement autoCompleteCursorPosition and prevent default', () => {
            wrapper.instance().handleInputKeyDown({ ...initialEvent, key: 'ArrowDown' })
            expect(wrapper.state('autoCompleteCursorPosition')).to.equal(1)
            expect(preventDefaultSpy.calledOnce).to.equal(true)
          })
        })
      })
    })

    describe('handleClickAutoCompleteItem()', () => {
      describe('call this function to add a mention @all', () => {
        before(() => {
          wrapper.setProps({ newComment: '@al' })
          wrapper.setState({ autoCompleteCursorPosition: 0, autoCompleteItemList: [{ mention: 'all', detail: 'notify all' }] })
          wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 4 }
        })

        it('should call props.onChangeNewComment with the right mention', () => {
          onChangeNewCommentSpy.resetHistory()
          wrapper.instance().handleClickAutoCompleteItem({ mention: 'all', detail: 'notify all' })
          expect(onChangeNewCommentSpy.calledOnceWith({ target: { value: '@all ' } })).to.equal(true)
        })
      })
    })

    describe('loadAutoComplete() (Note: "|" is the cursor position)', () => {
      describe('when isAutoCompleteActivated is false', () => {
        before(() => {
          wrapper.setState({ isAutoCompleteActivated: false })
        })

        describe('new comment: "newComment|"', () => {
          before(() => {
            wrapper.setProps({ newComment: 'newComment' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 10 }
          })

          it('should have the state isAutoCompleteActivated set to false', () => {
            wrapper.instance().searchForMentionCandidate()
            expect(wrapper.state('isAutoCompleteActivated')).to.equal(false)
          })
        })

        describe('new comment: "@newComment|"', () => {
          before(() => {
            wrapper.setProps({ newComment: '@newComment' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 11 }
          })

          it('should have the state isAutoCompleteActivated set to true', () => {
            wrapper.instance().searchForMentionCandidate()
            expect(wrapper.state('isAutoCompleteActivated')).to.equal(true)
          })
        })

        describe('new comment: "mail@domain|"', () => {
          before(() => {
            wrapper.setProps({ newComment: 'mail@domain' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 11 }
          })

          it('should have the state isAutoCompleteActivated set to false', () => {
            wrapper.instance().searchForMentionCandidate()
            expect(wrapper.state('isAutoCompleteActivated')).to.equal(false)
          })
        })

        describe('new comment: "@new @Comment|"', () => {
          before(() => {
            wrapper.setProps({ newComment: '@new @Comment' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 13 }
          })

          it('should have the state isAutoCompleteActivated set to true', () => {
            wrapper.instance().searchForMentionCandidate()
            expect(wrapper.state('isAutoCompleteActivated')).to.equal(true)
          })
        })

        describe('new comment: "mail @domain|"', () => {
          before(() => {
            wrapper.setProps({ newComment: 'mail @domain' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 12 }
          })

          it('should have the state isAutoCompleteActivated set to true', () => {
            wrapper.instance().searchForMentionCandidate()
            expect(wrapper.state('isAutoCompleteActivated')).to.equal(true)
          })
        })

        describe('new comment: "@|"', () => {
          before(() => {
            wrapper.setProps({ newComment: '@' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 1 }
          })

          it('should have the state isAutoCompleteActivated set to true', () => {
            wrapper.instance().searchForMentionCandidate()
            expect(wrapper.state('isAutoCompleteActivated')).to.equal(true)
          })
        })

        describe('new comment: "|"', () => {
          before(() => {
            wrapper.setProps({ newComment: '' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 0 }
          })

          it('should have the state isAutoCompleteActivated set to false', () => {
            wrapper.instance().searchForMentionCandidate()
            expect(wrapper.state('isAutoCompleteActivated')).to.equal(false)
          })
        })
      })

      describe('when isAutoCompleteActivated is true', () => {
        before(() => {
          wrapper.setState({ isAutoCompleteActivated: true })
        })

        describe('new comment: "@newComment |"', () => {
          before(() => {
            wrapper.setProps({ newComment: '@newComment ' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 12 }
          })

          it('should have the state isAutoCompleteActivated set to false', () => {
            wrapper.instance().searchForMentionCandidate()
            expect(wrapper.state('isAutoCompleteActivated')).to.equal(false)
          })
        })

        describe('new comment: "y@newComment|"', () => {
          before(() => {
            wrapper.setProps({ newComment: 'y@newComment' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 12 }
          })

          it('should have the state isAutoCompleteActivated set to false', () => {
            wrapper.instance().searchForMentionCandidate()
            expect(wrapper.state('isAutoCompleteActivated')).to.equal(false)
          })
        })
      })
    })
  })

  describe('Handlers', () => {
    it('onChangeNewCommentSpy should be called when comment is changing', () => {
      wrapper.find(`#${props.id}`).simulate('change')
      expect(onChangeNewCommentSpy.called).to.equal(true)
    })
  })
})
