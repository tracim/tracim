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

export class CommentTextArea extends React.Component {
  constructor (props) {
    super(props)

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

  handleInputKeyPress = e => {
    const { state } = this

    if (!this.state.isAutoCompleteActivated) return

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
    }
  }

  handleClickAutoCompleteItem = (autoCompleteItem) => {
    const lastCharBeforeCursorIndex = this.textAreaRef.selectionStart - 1
    const atIndex = this.props.newComment.lastIndexOf('@')
    if (atIndex === -1) return
    const newComment = this.props.newComment.split('')
    const mentionSize = lastCharBeforeCursorIndex - atIndex
    newComment.splice(atIndex + 1, mentionSize, autoCompleteItem.mention + ' ')

    this.props.onChangeNewComment({ target: { value: newComment.join('') } })

    this.setState({
      isAutoCompleteActivated: false,
      autoCompleteItemList: [],
      autoCompleteCursorPosition: atIndex + autoCompleteItem.mention.length + 2
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
          onChange={!props.wysiwyg ? props.onChangeNewComment : () => {}}
          disabled={props.disableComment}
          onKeyDown={!props.wysiwyg ? this.handleInputKeyPress : () => {}}
          ref={ref => { this.textAreaRef = ref }}
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
