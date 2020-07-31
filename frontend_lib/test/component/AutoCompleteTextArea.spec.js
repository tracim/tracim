import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { AutoCompleteTextArea } from '../../src/component/Timeline/AutoCompleteTextArea.jsx'
import sinon from 'sinon'

describe('<AutoCompleteTextArea />', () => {
  const onChangeNewCommentSpy = sinon.spy()

  const props = {
    newComment: '',
    onChangeNewComment: onChangeNewCommentSpy,
    disableComment: false,
    id: 'autoCompleteInputId',
    t: key => key,
    searchMentionList: () => []
  }

  const wrapper = shallow(
    <AutoCompleteTextArea
      {...props}
    />
  )

  const initialTextAreaRef = { selectionStart: 0, selectionEnd: 0 }
  wrapper.instance().textAreaRef = initialTextAreaRef

  describe('intern functions', () => {
    describe('handleInputKeyPress()', () => {
      const preventDefaultSpy = sinon.spy()
      const initialEvent = {
        key: 'A',
        preventDefault: preventDefaultSpy
      }

      describe('when mentionAutocomplete is true', () => {
        beforeEach(() => {
          wrapper.setState({ mentionAutocomplete: true })
        })

        afterEach(() => {
          preventDefaultSpy.resetHistory()
        })

        describe('press " "', () => {
          before(() => {
            wrapper.setState({ autoCompleteItemList: [{ mention: 'all', detail: 'notify all' }] })
          })

          it('should set mentionAutocomplete to false and clean autoCompleteItemList', () => {
            wrapper.instance().handleInputKeyPress({ ...initialEvent, key: ' ' })
            expect(wrapper.state('mentionAutocomplete')).to.equal(false)
            expect(wrapper.state('autoCompleteItemList')).to.deep.equal([])
          })
        })

        describe('press "Enter"', () => {
          before(() => {
            wrapper.setState({ autoCompleteItemList: [{ mention: 'all', detail: 'notify all' }] })
          })

          it('should prevent default', () => {
            wrapper.instance().handleInputKeyPress({ ...initialEvent, key: 'Enter' })
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
            wrapper.instance().handleInputKeyPress({ ...initialEvent, key: 'ArrowUp' })
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
            wrapper.instance().handleInputKeyPress({ ...initialEvent, key: 'ArrowDown' })
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
          wrapper.instance().handleClickAutoCompleteItem({ mention: 'all', detail: 'notify all' })
          expect(onChangeNewCommentSpy.calledOnceWith({ target: { value: '@all ' } })).to.equal(true)
        })
      })
    })

    describe('loadAutoComplete() (Note: "|" is the cursor position)', () => {
      describe('when mentionAutocomplete is false', () => {
        before(() => {
          wrapper.setState({ mentionAutocomplete: false })
        })

        describe('new comment: "newComment|"', () => {
          before(() => {
            wrapper.setProps({ newComment: 'newComment' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 10 }
          })

          it('should have the state mentionAutocomplete set to false', () => {
            wrapper.instance().loadAutoComplete()
            expect(wrapper.state('mentionAutocomplete')).to.equal(false)
          })
        })

        describe('new comment: "@newComment|"', () => {
          before(() => {
            wrapper.setProps({ newComment: '@newComment' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 11 }
          })

          it('should have the state mentionAutocomplete set to true', () => {
            wrapper.instance().loadAutoComplete()
            expect(wrapper.state('mentionAutocomplete')).to.equal(true)
          })
        })

        describe('new comment: "mail@domain|"', () => {
          before(() => {
            wrapper.setProps({ newComment: 'mail@domain' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 11 }
          })

          it('should have the state mentionAutocomplete set to false', () => {
            wrapper.instance().loadAutoComplete()
            expect(wrapper.state('mentionAutocomplete')).to.equal(false)
          })
        })

        describe('new comment: "mail @domain|"', () => {
          before(() => {
            wrapper.setProps({ newComment: 'mail @domain' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 12 }
          })

          it('should have the state mentionAutocomplete set to true', () => {
            wrapper.instance().loadAutoComplete()
            expect(wrapper.state('mentionAutocomplete')).to.equal(true)
          })
        })

        describe('new comment: "@|"', () => {
          before(() => {
            wrapper.setProps({ newComment: '@' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 1 }
          })

          it('should have the state mentionAutocomplete set to true', () => {
            wrapper.instance().loadAutoComplete()
            expect(wrapper.state('mentionAutocomplete')).to.equal(true)
          })
        })

        describe('new comment: "|"', () => {
          before(() => {
            wrapper.setProps({ newComment: '' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 0 }
          })

          it('should have the state mentionAutocomplete set to false', () => {
            wrapper.instance().loadAutoComplete()
            expect(wrapper.state('mentionAutocomplete')).to.equal(false)
          })
        })
      })

      describe('when mentionAutocomplete is true', () => {
        before(() => {
          wrapper.setState({ mentionAutocomplete: true })
        })

        describe('new comment: "@newComment |"', () => {
          before(() => {
            wrapper.setProps({ newComment: '@newComment ' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 12 }
          })

          it('should have the state mentionAutocomplete set to false', () => {
            wrapper.instance().loadAutoComplete()
            expect(wrapper.state('mentionAutocomplete')).to.equal(false)
          })
        })

        describe('new comment: "y@newComment|"', () => {
          before(() => {
            wrapper.setProps({ newComment: 'y@newComment' })
            wrapper.instance().textAreaRef = { ...initialTextAreaRef, selectionStart: 12 }
          })

          it('should have the state mentionAutocomplete set to false', () => {
            wrapper.instance().loadAutoComplete()
            expect(wrapper.state('mentionAutocomplete')).to.equal(false)
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
