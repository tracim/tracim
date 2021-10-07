import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import AutoComplete from '../Input/AutoComplete/AutoComplete'
import {
  tinymceAutoCompleteHandleInput,
  tinymceAutoCompleteHandleKeyUp,
  tinymceAutoCompleteHandleKeyDown,
  tinymceAutoCompleteHandleClickItem,
  tinymceAutoCompleteHandleSelectionChange
} from '../../tinymceAutoCompleteHelper.js'
import { LOCAL_STORAGE_FIELD, setLocalStorageItem } from '../../localStorage.js'

const USERNAME_ALLOWED_CHARACTERS_REGEX = /[a-zA-Z\-_]/

const seekUsernameEnd = (text, offset) => {
  while (offset < text.length && USERNAME_ALLOWED_CHARACTERS_REGEX.test(text[offset])) {
    offset++
  }

  return offset
}

export class CommentArea extends React.Component {
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

  componentDidMount () {
    const { props } = this
    if (props.wysiwyg) {
      props.onInitWysiwyg(this.handleTinyMceInput, this.handleTinyMceKeyDown, this.handleTinyMceKeyUp, this.handleTinyMceSelectionChange)
    }
  }

  async componentDidUpdate (prevProps, prevState) {
    if (!prevProps.wysiwyg && this.props.wysiwyg) {
      this.props.onInitWysiwyg(this.handleTinyMceInput, this.handleTinyMceKeyDown, this.handleTinyMceKeyUp, this.handleTinyMceSelectionChange)
    }

    if (!this.props.wysiwyg && prevProps.newComment !== this.props.newComment) {
      this.searchForMentionOrLinkCandidate()
    }
  }

  searchForMentionOrLinkCandidate = async () => {
    const mentionOrLinkCandidate = this.getMentionOrLinkCandidate(this.props.newComment)
    if (mentionOrLinkCandidate === undefined) {
      if (this.state.isAutoCompleteActivated) this.setState({ isAutoCompleteActivated: false })
      return
    }

    const autoCompleteItemList = await this.props.searchForMentionOrLinkInQuery(mentionOrLinkCandidate)
    this.setState({
      isAutoCompleteActivated: true,
      autoCompleteCursorPosition: autoCompleteItemList.length - 1,
      autoCompleteItemList: autoCompleteItemList.reverse() // NOTE - RJ - 2021-06-09 - reverse puts most interesting results closer
    })
  }

  getMentionOrLinkCandidate = newComment => {
    const lastCharBeforeCursorIndex = this.textAreaRef.selectionStart - 1
    let index = lastCharBeforeCursorIndex
    while (newComment[index] !== ' ' && index >= 0) {
      if ((newComment[index] === '@' || newComment[index] === '#') && (index === 0 || newComment[index - 1] === ' ')) {
        return newComment.slice(index, lastCharBeforeCursorIndex + 1)
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
    let character, keyword

    if (autoCompleteItem.content_id) {
      character = '#'
      keyword = autoCompleteItem.content_id
    } else {
      character = '@'
      keyword = autoCompleteItem.mention
    }

    const cursorPos = this.textAreaRef.selectionStart
    const endSpace = ' '

    const charAtCursor = cursorPos - 1
    const text = this.props.newComment
    const posAt = text.lastIndexOf(character, charAtCursor)
    let textBegin, textEnd

    if (posAt > -1) {
      const end = seekUsernameEnd(text, cursorPos)
      textBegin = text.substring(0, posAt) + character + keyword + endSpace
      textEnd = text.substring(end)
    } else {
      console.log(`Error in autocompletion: did not find ${character}`)
      textBegin = `${text} ${character}${keyword}${endSpace}`
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
      this.props.searchForMentionOrLinkInQuery,
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
      this.props.searchForMentionOrLinkInQuery
    )
  }

  handleTinyMceKeyUp = (event) => {
    const { state } = this
    tinymceAutoCompleteHandleKeyUp(
      event,
      this.setState.bind(this),
      state.isAutoCompleteActivated,
      this.props.searchForMentionOrLinkInQuery
    )
  }

  handleTinyMceSelectionChange = (e, position) => {
    tinymceAutoCompleteHandleSelectionChange(
      (state) => { this.setState({ ...state, tinymcePosition: position }) },
      this.props.searchForMentionOrLinkInQuery,
      this.state.isAutoCompleteActivated
    )
  }

  handleChangeNewComment = e => { // TODO GIULIA Olhar todas chamadas pra passar o content e o workspace id e content type, add o state do comment tb, ver se ele nao é usado em outros lugares
    const { props } = this

    const newComment = e.target.value
    this.setState({ newComment: newComment })

    setLocalStorageItem(
      props.contentType,
      props.contentId,
      props.workspaceId,
      LOCAL_STORAGE_FIELD.COMMENT,
      newComment
    )
  }

  render () {
    const { props, state } = this

    const style = {
      transform: 'translateY(-100%)',
      position: 'absolute',
      ...(props.wysiwyg && {
        top: state.tinymcePosition.isFullscreen && state.tinymcePosition.isSelectionToTheTop
          ? state.tinymcePosition.bottom
          : state.tinymcePosition.top,
        position: state.tinymcePosition.isFullscreen ? 'fixed' : 'absolute',
        transform: state.tinymcePosition.isFullscreen && state.tinymcePosition.isSelectionToTheTop
          ? 'none'
          : 'translateY(-100%)',
        zIndex: state.tinymcePosition.isFullscreen ? 1061 : 20
      })
    }

    return (
      <>
        {!props.disableComment && state.isAutoCompleteActivated && state.autoCompleteItemList.length > 0 && (
          <AutoComplete
            autoCompleteItemList={state.autoCompleteItemList}
            style={props.disableAutocompletePosition ? {} : style}
            apiUrl={props.apiUrl}
            autoCompleteCursorPosition={state.autoCompleteCursorPosition}
            onClickAutoCompleteItem={(m) => props.wysiwyg
              ? tinymceAutoCompleteHandleClickItem(m, this.setState.bind(this))
              : this.handleClickAutoCompleteItem(m)}
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

export default translate()(CommentArea)

CommentArea.propTypes = {
  id: PropTypes.string.isRequired,
  apiUrl: PropTypes.string.isRequired,
  newComment: PropTypes.string.isRequired,
  onChangeNewComment: PropTypes.func.isRequired,
  disableAutocompletePosition: PropTypes.bool,
  disableComment: PropTypes.bool,
  wysiwyg: PropTypes.bool,
  searchForMentionOrLinkInQuery: PropTypes.func,
  customClass: PropTypes.string,
  onInitWysiwyg: PropTypes.func
}

CommentArea.defaultProps = {
  disableAutocompletePosition: false,
  disableComment: false,
  customClass: '',
  id: '',
  newComment: '',
  onChangeNewComment: () => {},
  wysiwyg: false,
  searchForMentionOrLinkInQuery: () => {},
  onInitWysiwyg: () => {}
}
