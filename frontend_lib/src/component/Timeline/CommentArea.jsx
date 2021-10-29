import React from 'react'
import classnames from 'classnames'
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
import {
  getLocalStorageItem,
  LOCAL_STORAGE_FIELD,
  setLocalStorageItem
} from '../../localStorage.js'
import AddFileToUploadButton from './AddFileToUploadButton.jsx'
import DisplayFileToUpload from './DisplayFileToUpload.jsx'
import IconButton from '../Button/IconButton.jsx'
import ConfirmPopup from '../ConfirmPopup/ConfirmPopup.jsx'

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
      newComment: props.newComment || '',
      newCommentAsFileList: [],
      tinymcePosition: {}
    }
  }

  componentDidMount () {
    const { props } = this

    if (props.wysiwyg) {
      this.handleInitTimelineCommentWysiwyg(this.handleTinyMceInput, this.handleTinyMceKeyDown, this.handleTinyMceKeyUp, this.handleTinyMceSelectionChange)
    }

    const localStorage = getLocalStorageItem(
      props.contentType,
      {
        content_id: props.contentId,
        workspace_id: props.workspaceId
      },
      LOCAL_STORAGE_FIELD.COMMENT
    )
    if (!!localStorage && localStorage !== this.state.newComment) {
      this.setState({ newComment: localStorage })
    }
  }

  async componentDidUpdate (prevProps, prevState) {
    const { props } = this
    if (!prevProps.wysiwyg && props.wysiwyg) {
      this.handleInitTimelineCommentWysiwyg(this.handleTinyMceInput, this.handleTinyMceKeyDown, this.handleTinyMceKeyUp, this.handleTinyMceSelectionChange)
    }

    if (!props.wysiwyg && prevState.newComment !== this.state.newComment) {
      this.searchForMentionOrLinkCandidate()
    }

    if (prevProps.contentType !== props.contentType) {
      const localStorage = getLocalStorageItem(
        props.contentType,
        {
          content_id: props.contentId,
          workspace_id: props.workspaceId
        },
        LOCAL_STORAGE_FIELD.COMMENT
      )
      if (!!localStorage && localStorage !== this.state.newComment) {
        this.setState({ newComment: localStorage })
      }
    }
  }

  searchForMentionOrLinkCandidate = async () => {
    const mentionOrLinkCandidate = this.getMentionOrLinkCandidate(this.state.newComment)
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
    const text = this.state.newComment
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

    this.handleChangeNewComment({ target: { value: textBegin + textEnd } })

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

  handleChangeNewComment = e => {
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

  handleValidateCommentFileToUpload = (fileToUploadList) => {
    if (!fileToUploadList.length) return
    this.setState(prev => {
      const fileToUploadListWithoutDuplicate = fileToUploadList
        .filter(fileToAdd =>
          !prev.newCommentAsFileList.find(fileAdded => fileToAdd.file.name === fileAdded.file.name)
        )
      return {
        newCommentAsFileList: [...prev.newCommentAsFileList, ...fileToUploadListWithoutDuplicate]
      }
    })
  }

  handleInitTimelineCommentWysiwyg = (handleTinyMceInput, handleTinyMceKeyDown, handleTinyMceKeyUp, handleTinyMceSelectionChange) => {
    globalThis.wysiwyg(
      this.props.wysiwygIdSelector,
      this.props.lang,
      this.handleChangeNewComment,
      handleTinyMceInput,
      handleTinyMceKeyDown,
      handleTinyMceKeyUp,
      handleTinyMceSelectionChange
    )
  }

  handleRemoveCommentAsFile = (fileToRemove) => {
    if (!fileToRemove) return
    this.setState(prev => ({
      newCommentAsFileList: prev.newCommentAsFileList.filter(
        commentAsFile => commentAsFile.file.name !== fileToRemove.file.name
      )
    }))
  }

  handleCloseInvalidMentionPopup = () => {
    const { props } = this
    props.onClickCancelSave()
  }

  handleValidateInvalidMentionPopup = () => {
    const { props, state } = this
    props.onClickSaveAnyway(state.newComment, state.newCommentAsFileList)
    this.setState({ newComment: '', newCommentAsFileList: [] })
  }

  handleClickSend = () => {
    const { props, state } = this
    if (props.onClickValidateNewCommentBtn(state.newComment, state.newCommentAsFileList)) {
      this.setState({ newComment: '', newCommentAsFileList: [] })
    }
  }

  render () {
    const { props, state } = this
    const invalidMentionList = props.invalidMentionList || []

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
      <form className={`${props.customClass}__texteditor`}>
        {props.showInvalidMentionPopup && (
          <ConfirmPopup
            onConfirm={props.onClickCancelSave}
            onClose={props.onClickCancelSave}
            onCancel={this.handleValidateInvalidMentionPopup}
            msg={
              <>
                {props.t('Your text contains mentions that do not match any member of this space:')}
                <div className='commentArea__mentions'>
                  {invalidMentionList.join(', ')}
                </div>
              </>
            }
            confirmLabel={props.t('Edit')}
            confirmIcon='far fa-fw fa-edit'
            cancelLabel={props.t('Validate anyway')}
            cancelIcon='fas fa-fw fa-check'
          />
        )}

        <div
          className={classnames(
            `${props.customClass}__texteditor__textinput`,
            'commentArea__textinput'
          )}
        >
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
            value={state.newComment}
            onChange={props.wysiwyg ? () => { } : this.handleChangeNewComment}
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
        </div>

        {!props.hideSendButtonAndOptions && (
          <div className={classnames(`${props.customClass}__texteditor__wrapper`, 'commentArea__wrapper')}>
            <div className={classnames(`${props.customClass}__texteditor__advancedtext`, 'commentArea__advancedtext')}>
              <IconButton
                customClass={classnames(
                  `${props.customClass}__texteditor__advancedtext__btn commentArea__advancedtext__btn`
                )}
                disabled={props.disableComment}
                text={props.wysiwyg ? props.t('Simple edition') : props.t('Advanced edition')}
                onClick={props.onClickWysiwygBtn}
                intent='link'
                mode='light'
                key='commentArea__comment__advancedtext'
              />

              <div>
                <DisplayFileToUpload
                  fileList={state.newCommentAsFileList}
                  onRemoveCommentAsFile={this.handleRemoveCommentAsFile}
                  color={props.customColor}
                />
              </div>
            </div>

            <div className={classnames(`${props.customClass}__texteditor__submit`, 'commentArea__submit')}>
              <div>
                <AddFileToUploadButton
                  workspaceId={props.workspaceId}
                  color={props.customColor}
                  disabled={props.disableComment}
                  onValidateCommentFileToUpload={this.handleValidateCommentFileToUpload}
                  multipleFiles={props.multipleFiles}
                />
              </div>
              <IconButton
                color={props.customColor}
                customClass={classnames(`${props.customClass}__texteditor__submit__btn `, 'commentArea__submit__btn')}
                disabled={props.disableComment || (state.newComment === '' && state.newCommentAsFileList.length === 0)}
                icon='far fa-paper-plane'
                intent='primary'
                mode='light'
                onClick={this.handleClickSend}
                text={props.buttonLabel || props.t('Send')}
                type='button'
                key='commentArea__comment__send'
                dataCy='commentArea__comment__send'
              />
            </div>
          </div>
        )}
      </form>
    )
  }
}

export default translate()(CommentArea)

CommentArea.propTypes = {
  id: PropTypes.string.isRequired,
  apiUrl: PropTypes.string.isRequired,
  newComment: PropTypes.string,
  disableAutocompletePosition: PropTypes.bool,
  disableComment: PropTypes.bool,
  wysiwyg: PropTypes.bool,
  searchForMentionOrLinkInQuery: PropTypes.func,
  customClass: PropTypes.string,
  hideSendButtonAndOptions: PropTypes.bool,
  multipleFiles: PropTypes.bool,
  contentType: PropTypes.string,
  contentId: PropTypes.number,
  workspaceId: PropTypes.number,
  wysiwygIdSelector: PropTypes.string,
  lang: PropTypes.string,
  onClickCancelSave: PropTypes.func,
  onClickSaveAnyway: PropTypes.func,
  onClickValidateNewCommentBtn: PropTypes.func,
  invalidMentionList: PropTypes.array,
  showInvalidMentionPopup: PropTypes.bool,
  onClickWysiwygBtn: PropTypes.func
}

CommentArea.defaultProps = {
  disableAutocompletePosition: false,
  disableComment: false,
  customClass: '',
  id: '',
  newComment: '',
  wysiwyg: false,
  searchForMentionOrLinkInQuery: () => { },
  hideSendButtonAndOptions: false,
  multipleFiles: true,
  contentType: '',
  contentId: 0,
  workspaceId: 0,
  wysiwygIdSelector: '',
  lang: 'en',
  onClickCancelSave: () => { },
  onClickSaveAnyway: () => { },
  onClickValidateNewCommentBtn: () => { },
  invalidMentionList: [],
  showInvalidMentionPopup: false,
  onClickWysiwygBtn: () => { }
}
