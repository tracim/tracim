import React from 'react'
import { commonMentionList } from '../../helper'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import Avatar from '../Avatar/Avatar'

export class AutoCompleteTextArea extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      mentionAutocomplete: false,
      autoCompleteItemList: [],
      autoCompleteCursorPosition: 0,
      cursorTop: 0,
      cursorLeft: 0
    }
  }

  async componentDidUpdate (prevProps, prevState) {
    const { props, state } = this

    if (
      !state.mentionAutocomplete &&
      state.autoCompleteCursorPosition !== -1 &&
      state.mentionAutocomplete !== prevState.mentionAutocomplete
    ) {
      this.textAreaRef.selectionStart = state.autoCompleteCursorPosition
      this.textAreaRef.selectionEnd = state.autoCompleteCursorPosition
      this.setState({
        autoCompleteCursorPosition: -1
      })
    }

    if (prevProps.newComment !== props.newComment) {
      this.loadAutoComplete()
    }
  }

  loadAutoComplete = async () => {
    const newComment = this.props.newComment
    const lastCharBeforeCursorIndex = this.textAreaRef.selectionStart - 1
    let index = lastCharBeforeCursorIndex
    while (newComment[index] !== ' ' && newComment.slice(0, index).slice(-6) !== '&nbsp;' && index >= 0) {
      if (newComment[index] === '@') {
        const mentionList = await this.props.searchMentionList(newComment.slice(index + 1, lastCharBeforeCursorIndex + 1))
        // const autoCompleteItemList = !mentionList ? [...commonMentionList] : [...commonMentionList, ...mentionList]
        const autoCompleteItemList = mentionList
        this.setState({
          mentionAutocomplete: true,
          autoCompleteCursorPosition: autoCompleteItemList.length - 1,
          autoCompleteItemList
        })
        return
      }
      index--
    }
    if (this.state.mentionAutocomplete) this.setState({ mentionAutocomplete: false })
  }

  handleChangeNewComment = (event) => {
    this.props.onChangeNewComment(event)
  }

  handleInputKeyPress = e => {
    const { state } = this

    if (!this.state.mentionAutocomplete) return

    switch (e.key) {
      case ' ': this.setState({ mentionAutocomplete: false, autoCompleteItemList: [] }); break
      case 'Enter': {
        this.handleClickAutoCompleteItem(state.autoCompleteItemList[state.autoCompleteCursorPosition])
        e.preventDefault()
        break
      }
      case 'ArrowUp': {
        if (state.autoCompleteCursorPosition > 0) {
          this.setState(prevState => ({
            autoCompleteCursorPosition: prevState.autoCompleteCursorPosition - 1
          }))
        }
        e.preventDefault()
        break
      }
      case 'ArrowDown': {
        if (state.autoCompleteCursorPosition < state.autoCompleteItemList.length - 1) {
          this.setState(prevState => ({
            autoCompleteCursorPosition: prevState.autoCompleteCursorPosition + 1
          }))
        }
        e.preventDefault()
        break
      }
    }
  }

  handleClickAutoCompleteItem = (autoCompleteItem) => {
    const lastCharBeforeCursorIndex = this.textAreaRef.selectionStart - 1
    let atIndex = -1
    for (let i = lastCharBeforeCursorIndex; i >= 0; i--) {
      if (this.props.newComment[i] === '@') {
        atIndex = i
        break
      }
    }
    if (atIndex === -1) return
    const newComment = [...this.props.newComment]
    newComment.splice(atIndex + 1, (lastCharBeforeCursorIndex) - atIndex, [...autoCompleteItem.mention, ' '])
    this.props.onChangeNewComment({ target: { value: newComment.flatMap(m => m).reduce((val, m) => (val + m), '') } })

    this.setState({
      mentionAutocomplete: false,
      autoCompleteItemList: [],
      autoCompleteCursorPosition: atIndex + autoCompleteItem.mention.length + 2
    })
  }

  render () {
    const { props, state } = this

    let style = {}
    if (props.autocompletePositionFixed) {
      style = {
        position: 'fixed',
        top: state.cursorTop,
        left: state.cursorLeft,
        'z-index': 3000
      }
    }

    return (
      <>
        {(!props.disableComment) && state.mentionAutocomplete && (
          <div className='textarea__autocomplete' style={style}>
            {state.autoCompleteItemList.map((m, i) => (
              <>
                {i === commonMentionList.length && (
                  <div className='textarea__autocomplete__delimiter' />
                )}
                <div
                  className={
                    classnames(
                      'textarea__autocomplete__item',
                      state.autoCompleteCursorPosition === i ? 'textarea__autocomplete__item__active' : null
                    )
                  }
                  key={m.mention}
                  onClick={() => this.handleClickAutoCompleteItem(m)}
                  onPointerEnter={() => this.setState({ autoCompleteCursorPosition: i })}
                >
                  {m.username && <Avatar width='15px' style={{ margin: '5px'}} publicName={m.detail} />}
                  <b>@{m.mention}</b> - {m.detail}
                </div>
              </>
            ))}
          </div>
        )}
        <textarea
          id={props.id}
          className={props.customClass}
          placeholder={props.t('Your message...')}
          value={props.newComment}
          onChange={this.handleChangeNewComment}
          disabled={props.disableComment}
          onKeyDown={this.handleInputKeyPress}
          ref={ref => { this.textAreaRef = ref }}
        />
      </>
    )
  }
}

export default translate()(AutoCompleteTextArea)

AutoCompleteTextArea.propTypes = {
  newComment: PropTypes.string.isRequired,
  onChangeNewComment: PropTypes.func.isRequired,
  disableComment: PropTypes.bool
}

AutoCompleteTextArea.defaultProps = {
  disableComment: false,
  customClass: '',
  autocompletePositionFixed: false
}
