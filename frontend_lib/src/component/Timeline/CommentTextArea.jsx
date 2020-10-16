import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import MentionAutoComplete from '../Input/MentionAutoComplete/MentionAutoComplete'
import {
  tinymceAutoCompleteHandleInput,
  tinymceAutoCompleteHandleKeyUp,
  tinymceAutoCompleteHandleKeyDown,
  tinymceAutoCompleteHandleClickItem,
  tinymceAutoCompleteHandleSelectionChange
} from '../../tinymceAutoCompleteHelper.js'

const USERNAME_ALLOWED_CHARACTERS_REGEX = /[a-zA-Z\-_]/

const seekUsernameEnd = (text, offset) => {
  while (offset < text.length && USERNAME_ALLOWED_CHARACTERS_REGEX.test(text[offset])) {
    offset++
  }

  return offset
}

export class CommentTextArea extends React.Component {
  constructor (props) {
    super(props)

    this.commentCursorPos = -1 // RJ - 2020-25-09 - HACK - this should be put in the component state

    this.state = {
      isAutoCompleteActivated: false,
      autoCompleteItemList: [],
      autoCompleteCursorPosition: 0,
      tinymcePosition: {}
    }
  }

  async componentDidUpdate (prevProps, prevState) {
    if (!prevProps.wysiwyg && this.props.wysiwyg) {
      this.props.onInitWysiwyg(this.handleTinyMceInput, this.handleTinyMceKeyDown, this.handleTinyMceKeyUp, this.handleTinyMceSelectionChange)
    }

    if (!this.props.wysiwyg && prevProps.newComment !== this.props.newComment) {
      this.searchForMentionCandidate()
    }
  }

  searchForMentionCandidate = async () => {
    const mentionCandidate = this.getMentionCandidate(this.props.newComment)
    if (mentionCandidate === undefined) {
      if (this.state.isAutoCompleteActivated) this.setState({ isAutoCompleteActivated: false })
      return
    }

    const mentionList = await this.props.searchForMentionInQuery(mentionCandidate)
    this.setState({
      isAutoCompleteActivated: true,
      autoCompleteCursorPosition: mentionList.length - 1,
      autoCompleteItemList: mentionList
    })
  }

  getMentionCandidate = newComment => {
    const lastCharBeforeCursorIndex = this.textAreaRef.selectionStart - 1
    let index = lastCharBeforeCursorIndex
    while (newComment[index] !== ' ' && index >= 0) {
      if (newComment[index] === '@' && (index === 0 || newComment[index - 1] === ' ')) {
        return newComment.slice(index + 1, lastCharBeforeCursorIndex + 1)
      }
      index--
    }
    return undefined
  }

  handleInputKeyDown = e => {
    if (this.props.wysiwyg || !this.state.isAutoCompleteActivated) return
    const { state } = this

    switch (e.key) {
      case ' ': this.setState({ isAutoCompleteActivated: false, autoCompleteItemList: [] }); break
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
      case 'Escape': {
        this.setState({ isAutoCompleteActivated: false })
        e.preventDefault()
        break
      }
    }
  }

  // RJ - 2020-09-25 - FIXME
  // Duplicate code with tinymceAutoCompleteHelper.js
  // See https://github.com/tracim/tracim/issues/3639

  handleClickAutoCompleteItem = (autoCompleteItem) => {
    if (!autoCompleteItem.mention) {
      console.log('Error: this member does not have a username')
      return
    }

    const cursorPos = this.textAreaRef.selectionStart
    const spaceAfterMention = ' '

    const charAtCursor = cursorPos - 1
    const text = this.props.newComment
    const posAt = text.lastIndexOf('@', charAtCursor)
    let textBegin, textEnd

    if (posAt > -1) {
      const end = seekUsernameEnd(text, cursorPos)
      textBegin = text.substring(0, posAt) + '@' + autoCompleteItem.mention + spaceAfterMention
      textEnd = text.substring(end)
    } else {
      console.log('Error: mention autocomplete: did not find "@"')
      textBegin = text + ' @' + autoCompleteItem.mention + spaceAfterMention
      textEnd = ''
    }

    this.commentCursorPos = textBegin.length

    this.props.onChangeNewComment({ target: { value: textBegin + textEnd } })

    this.setState({
      isAutoCompleteActivated: false,
      autoCompleteItemList: [],
      autoCompleteCursorPosition: textBegin.length
    })
  }

  handleTinyMceInput = (e, position) => {
    tinymceAutoCompleteHandleInput(
      e,
      (state) => { this.setState({ ...state, tinymcePosition: position }) },
      this.props.searchForMentionInQuery,
      this.state.isAutoCompleteActivated
    )
  }

  handleTinyMceKeyDown = event => {
    const { state } = this

    tinymceAutoCompleteHandleKeyDown(
      event,
      this.setState.bind(this),
      state.isAutoCompleteActivated,
      state.autoCompleteCursorPosition,
      state.autoCompleteItemList,
      this.props.searchForMentionInQuery
    )
  }

  handleTinyMceKeyUp = (event) => {
    const { state } = this

    tinymceAutoCompleteHandleKeyUp(
      event,
      this.setState.bind(this),
      state.isAutoCompleteActivated,
      this.props.searchForMentionInQuery
    )
  }

  handleTinyMceSelectionChange = (e, position) => {
    tinymceAutoCompleteHandleSelectionChange(
      (state) => { this.setState({ ...state, tinymcePosition: position }) },
      this.props.searchForMentionInQuery,
      this.state.isAutoCompleteActivated
    )
  }

  render () {
    const { props, state } = this

    const style = {
      transform: 'translateY(-100%)',
      position: 'absolute',
      ...(props.wysiwyg && {
        top: state.tinymcePosition.top,
        position: state.tinymcePosition.isFullscreen ? 'fixed' : 'absolute',
        zIndex: state.tinymcePosition.isFullscreen ? 1061 : 20
      })
    }

    return (
      <>
        {!props.disableComment && state.isAutoCompleteActivated && state.autoCompleteItemList.length > 0 && (
          <MentionAutoComplete
            autoCompleteItemList={state.autoCompleteItemList}
            style={style}
            autoCompleteCursorPosition={state.autoCompleteCursorPosition}
            onClickAutoCompleteItem={(m) => props.wysiwyg ? tinymceAutoCompleteHandleClickItem(m, this.setState.bind(this)) : this.handleClickAutoCompleteItem(m)}
            delimiterIndex={state.autoCompleteItemList.filter(item => item.isCommon).length - 1}
          />
        )}
        <textarea
          id={props.id}
          className={props.customClass}
          placeholder={props.t('Your message...')}
          value={props.newComment}
          onChange={props.wysiwyg ? () => {} : props.onChangeNewComment}
          disabled={props.disableComment}
          onKeyDown={this.handleInputKeyDown}
          ref={ref => {
            this.textAreaRef = ref
            if (ref && this.commentCursorPos > -1) {
              ref.selectionStart = ref.selectionEnd = this.commentCursorPos
              ref.focus()
              this.commentCursorPos = -1
            }
          }}
        />
      </>
    )
  }
}

export default translate()(CommentTextArea)

CommentTextArea.propTypes = {
  id: PropTypes.string.isRequired,
  newComment: PropTypes.string.isRequired,
  onChangeNewComment: PropTypes.func.isRequired,
  disableComment: PropTypes.bool,
  wysiwyg: PropTypes.bool,
  searchForMentionInQuery: PropTypes.func,
  customClass: PropTypes.string
}

CommentTextArea.defaultProps = {
  disableComment: false,
  customClass: '',
  id: '',
  newComment: '',
  onChangeNewComment: () => {},
  wysiwyg: false,
  searchForMentionInQuery: () => {}
}
