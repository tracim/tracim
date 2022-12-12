import React, { useEffect, useState } from 'react'
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
  autoCompleteItem,
  // replaceHTMLRoleMentionTagWithMention,
  // replaceHTMLUserMentionTagWithMention,
  searchContentAndPlaceBalise,
  searchMentionAndPlaceBalise
} from '../../helper.js'
import {
  LOCAL_STORAGE_FIELD,
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem
} from '../../localStorage.js'
import AddFileToUploadButton from './AddFileToUploadButton.jsx'
import DisplayFileToUpload from './DisplayFileToUpload.jsx'
import IconButton from '../Button/IconButton.jsx'
import ConfirmPopup from '../ConfirmPopup/ConfirmPopup.jsx'
import Loading from '../Loading/Loading.jsx'
import TinyEditor from '../TinyEditor/TinyEditor'

export const CommentArea = props => {
  const [content, setContent] = useState('')
  const [fileListToUpload, setFileListToUpload] = useState([])
  const [invalidMentionList, setInvalidMentionList] = useState([])
  const [isAdvancedEdition, setIsAdvancedEdition] = useState(false)
  const [textToSend, setTextToSend] = useState('')

/*
  const invalidMentionList = props.invalidMentionList || []

  const style = {
    transform: props.bottomAutocomplete ? 'none' : 'translateY(-100%)',
    position: 'absolute',
    ...(props.wysiwyg && {
      top: tinymcePosition.isFullscreen && tinymcePosition.isSelectionToTheTop
        ? tinymcePosition.bottom
        : tinymcePosition.top,
      position: tinymcePosition.isFullscreen ? 'fixed' : 'absolute',
      transform: (tinymcePosition.isFullscreen || props.bottomAutocomplete) && tinymcePosition.isSelectionToTheTop
        ? 'none'
        : 'translateY(-100%)',
      zIndex: tinymcePosition.isFullscreen ? 1061 : 20
    })
  }*/
/*
  useEffect(() => {
    if (props.newComment) {
      setNewComment(props.newComment)
    } else {
      const savedComment = getLocalStorageItem(
        props.contentType,
        props.contentId,
        props.workspaceId,
        LOCAL_STORAGE_FIELD.COMMENT
      )

      if (!!savedComment && savedComment !== newComment) {
        setNewComment(savedComment)
      }
    }

    if (props.wysiwyg) {
      // RJ - NOTE - 2022-02-16 - ensure TinyMCE loads with the comment in the local storage TinyMCE
      // will be loaded after in componentDidUpdate, after render, so the textarea has the right
      // value
      setShouldLoadWysiwyg(true)
    }
  }, [])*/

  useEffect(() => {
    if (props.newComment) {
      setContent(props.newComment)
    } else {
      console.log('props.contentId', props.contentId)
      console.log('props.contentType', props.contentType)
      console.log('props.workspaceId', props.workspaceId)
      console.log('LOCAL_STORAGE_FIELD.COMMENT', LOCAL_STORAGE_FIELD.COMMENT)
      const savedComment = getLocalStorageItem(
        props.contentType,
        props.contentId,
        props.workspaceId,
        LOCAL_STORAGE_FIELD.COMMENT
      )

      console.log('savedComment', savedComment)

      if (!!savedComment && savedComment !== content) {
        setContent(content)
      }
    }
  }, [])

  useEffect(() => {
    setLocalStorageItem(
      props.contentType,
      props.contentId,
      props.workspaceId,
      LOCAL_STORAGE_FIELD.COMMENT,
      content
    )
  }, [content])
/*
  useEffect(() => {
    const savedComment = getLocalStorageItem(
      props.contentType,
      props.contentId,
      props.workspaceId,
      LOCAL_STORAGE_FIELD.COMMENT
    )
    if (!!savedComment && savedComment !== newComment) {
      setNewComment(savedComment)
    }
  }, [props.contentType])*/

/*
  const searchForMentionOrLinkCandidate = async () => {
    const mentionOrLinkCandidate = getMentionOrLinkCandidate(newComment)
    if (mentionOrLinkCandidate === undefined) {
      if (isAutoCompleteActivated) setIsAutoCompleteActivated(false)
      return
    }

    const autoCompleteItemList = await props.searchForMentionOrLinkInQuery(mentionOrLinkCandidate)
    setIsAutoCompleteActivated(true)
    setAutoCompleteCursorPosition(autoCompleteItemList.length - 1)
    setAutoCompleteItemList(autoCompleteItemList) // NOTE - RJ - 2021-06-09 - reverse puts most interesting results closer
  }

  const getMentionOrLinkCandidate = newComment => {
    const lastCharBeforeCursorIndex = textArea.current.selectionStart - 1
    let index = lastCharBeforeCursorIndex
    while (newComment[index] !== ' ' && index >= 0) {
      if ((newComment[index] === '@' || newComment[index] === '#') && (index === 0 || newComment[index - 1] === ' ')) {
        return newComment.slice(index, lastCharBeforeCursorIndex + 1)
      }
      index--
    }
    return undefined
  }*/

  const handleTrytoSend = async () => {
    let returnValue = searchMentionAndPlaceBalise(props.roleList, props.memberList, content)
    if (returnValue.invalidMentionList.length > 0) {
      setTextToSend(returnValue.html)
      setInvalidMentionList(returnValue.invalidMentionList)
    } else {
      returnValue = await searchContentAndPlaceBalise(props.apiUrl, returnValue.html)
      handleSend(returnValue.html)
    }
  }

  /**
   * Send the comment to the backend
   */
  const handleSend = (textToSend) => {
    // NOTE - MP - 2022-12-06 - If we don't clear this variable we don't hide the popup.
    // In case of an error it's preferable to hide the popup
    setInvalidMentionList([])

    if (props.onClickSubmit(textToSend, fileListToUpload)) {
      setContent('')
      setFileListToUpload([])
      removeLocalStorageItem(
        props.contentType,
        props.contentId,
        props.workspaceId,
        LOCAL_STORAGE_FIELD.COMMENT
      )
    }
  }

  const handleValidateCommentFileListToUpload = (fileListToAdd) => {
    if (!fileListToAdd.length) return

    const fileListToUploadWithoutDuplicate = fileListToAdd.filter(
      fileToAdd => !fileListToUpload.find(fileAdded => fileAdded.file.name === fileToAdd.file.name)
    )

    setFileListToUpload([...fileListToUpload, ...fileListToUploadWithoutDuplicate])
  }

  const handleRemoveCommentFileFromUploadList = (fileListToRemove) => {
    if (!fileListToRemove) return
    setFileListToUpload(fileListToUpload.filter(
      commentFile => commentFile.file.name !== fileListToRemove.file.name
    ))
  }

  const changeEditor = () => {
    const newIsAdvancedEdition = !isAdvancedEdition
    setIsAdvancedEdition(newIsAdvancedEdition)
  }

  return (
    <form className={`${props.customClass}__texteditor`}>
      {invalidMentionList.length > 0 && (
        // TODO - MP - 2022-12-06 - Maybe check this popup
        <ConfirmPopup
          onCancel={() => handleSend(textToSend)}
          onClose={() => setInvalidMentionList([])}
          onConfirm={() => setInvalidMentionList([])}
          msg={
            <>
              <span>
                {props.t('Your text contains mentions that do not match any member of this space:')}
              </span>
              <div className='commentArea__mentions'>
                {invalidMentionList.join(', ')}
              </div>
            </>
          }
          confirmLabel={props.t('Edit')}
          confirmIcon='fas fa-edit'
          cancelLabel={props.t('Validate anyway')}
          cancelIcon='fas fa-fw fa-check'
        />
      )}
      <TinyEditor
        apiUrl={props.apiUrl}
        codeLanguageList={props.codeLanguageList}
        content={content}
        handleSend={handleTrytoSend}
        height={100}
        isAdvancedEdition={isAdvancedEdition}
        maxHeight={300}
        minHeight={100}
        roleList={props.roleList}
        setContent={setContent}
        spaceId={props.workspaceId}
        userList={props.memberList}
      />
      {!props.hideSendButtonAndOptions && (
        <div className={
            classnames(`${props.customClass}__texteditor__wrapper`, 'commentArea__wrapper')
          }>
          <div className={
            classnames(
              `${props.customClass}__texteditor__advancedtext`,
              'commentArea__advancedtext'
            )
          }>
            <IconButton
              customClass={classnames(
                `${props.customClass}__texteditor__advancedtext__btn commentArea__advancedtext__btn`
              )}
              disabled={props.disableComment}
              text={isAdvancedEdition ? props.t('Simple edition') : props.t('Advanced edition')}
              onClick={changeEditor}
              intent='link'
              mode='light'
              key='commentArea__comment__advancedtext'
            />
            <DisplayFileToUpload
              fileList={fileListToUpload}
              onRemoveCommentAsFile={handleRemoveCommentFileFromUploadList}
              color={props.customColor}
            />
          </div>

          {props.isFileCommentLoading && (
            <Loading />
          )}

          <div className={
            classnames(
              `${props.customClass}__texteditor__submit`,
              'commentArea__submit'
            )
          }>
            <AddFileToUploadButton
              workspaceId={props.workspaceId}
              color={props.customColor}
              disabled={props.disableComment}
              onValidateCommentFileToUpload={handleValidateCommentFileListToUpload}
              multipleFiles={props.multipleFiles}
            />
            <IconButton
              color={props.customColor}
              customClass={
                classnames(
                  `${props.customClass}__texteditor__submit__btn `,
                  'commentArea__submit__btn'
                )
              }
              disabled={props.disableComment || (content === '' && fileListToUpload.length === 0)}
              icon={props.icon}
              intent='primary'
              mode='light'
              onClick={handleTrytoSend}
              text={props.t('Send')}
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

// TODO - MP - 2022-11-29 - This will be removed ; the sooner the better
export class CommentArea_Legacy extends React.Component {
  constructor (props) {
    super(props)

    this.commentCursorPos = -1 // RJ - 2020-25-09 - HACK - this should be put in the component state

    this.state = {
      isAutoCompleteActivated: false,
      autoCompleteItemList: [],
      autoCompleteCursorPosition: 0,
      newComment: '',
      newCommentAsFileList: [],
      tinymcePosition: {}
    }
  }

  componentDidMount () {
    const { props } = this

    if (props.newComment) {
      this.setState({ newComment: props.newComment })
    } else {
      const savedComment = getLocalStorageItem(
        props.contentType,
        props.contentId,
        props.workspaceId,
        LOCAL_STORAGE_FIELD.COMMENT
      )

      if (!!savedComment && savedComment !== this.state.newComment) {
        this.setState({ newComment: savedComment })
      }
    }

    if (props.wysiwyg) {
      // RJ - NOTE - 2022-02-16 - ensure TinyMCE loads with the comment in the local storage
      // TinyMCE will be loaded after in componentDidUpdate, after render,
      // so the textarea has the right value
      this.setState({ shouldLoadWysiwyg: true })
    }
  }

  async componentDidUpdate (prevProps, prevState) {
    const { props } = this
    if (props.wysiwyg && (!prevProps.wysiwyg || this.state.shouldLoadWysiwyg || prevProps.lang !== props.lang)) {
      this.handleInitTimelineCommentWysiwyg(this.handleTinyMceInput, this.handleTinyMceKeyDown, this.handleTinyMceKeyUp, this.handleTinyMceSelectionChange)
      if (this.state.shouldLoadWysiwyg) {
        this.setState({ shouldLoadWysiwyg: false })
      }
    }

    if (!props.wysiwyg && prevState.newComment !== this.state.newComment) {
      this.searchForMentionOrLinkCandidate()
    }

    if (prevProps.contentType !== props.contentType) {
      const savedComment = getLocalStorageItem(
        props.contentType,
        props.contentId,
        props.workspaceId,
        LOCAL_STORAGE_FIELD.COMMENT
      )
      if (!!savedComment && savedComment !== this.state.newComment) {
        this.setState({ newComment: savedComment })
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
      case 'Tab':
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

  handleClickAutoCompleteItem = (item) => {
    const cursorPos = this.textAreaRef.selectionStart
    const text = this.state.newComment

    const { textBegin, textEnd } = autoCompleteItem(text, item, cursorPos, ' ')

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

  handleSend = () => {
    const { props, state } = this
    if (props.onClickValidateNewCommentBtn(state.newComment, state.newCommentAsFileList)) {
      this.setState({ newComment: '', newCommentAsFileList: [] })
    }
  }

  render () {
    const { props, state } = this
    const invalidMentionList = props.invalidMentionList || []

    const style = {
      transform: props.bottomAutocomplete ? 'none' : 'translateY(-100%)',
      position: 'absolute',
      ...(props.wysiwyg && {
        top: state.tinymcePosition.isFullscreen && state.tinymcePosition.isSelectionToTheTop
          ? state.tinymcePosition.bottom
          : state.tinymcePosition.top,
        position: state.tinymcePosition.isFullscreen ? 'fixed' : 'absolute',
        transform: (state.tinymcePosition.isFullscreen || props.bottomAutocomplete) && state.tinymcePosition.isSelectionToTheTop
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
            confirmIcon='fas fa-edit'
            cancelLabel={props.t('Validate anyway')}
            cancelIcon='fas fa-fw fa-check'
          />
        )}

        <div
          className={classnames(
            `${props.customClass}__texteditor__textinput`,
            'commentArea__textinput',
            { richtextedition: props.wysiwyg }
          )}
        >
          {!props.disableComment && state.isAutoCompleteActivated && state.autoCompleteItemList.length > 0 && (
            <AutoComplete
              autoCompleteItemList={state.autoCompleteItemList}
              style={style}
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
            placeholder={props.placeHolder || props.t('Your message...')}
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
            data-cy='commentArea__textinput'
            hidden={state.shouldLoadWysiwyg}
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

            {props.isFileCommentLoading && (
              <Loading />
            )}

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
                icon={props.icon}
                intent='primary'
                mode='light'
                onClick={this.handleSend}
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
  apiUrl: PropTypes.string.isRequired,
  onClickSubmit: PropTypes.func.isRequired,
  buttonLabel: PropTypes.string,
  codeLanguageList: PropTypes.array,
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  customClass: PropTypes.string,
  disableComment: PropTypes.bool,
  hideSendButtonAndOptions: PropTypes.bool,
  icon: PropTypes.string,
  id: PropTypes.string.isRequired,
  invalidMentionList: PropTypes.array,
  lang: PropTypes.string,
  memberList: PropTypes.array,
  roleList: PropTypes.array,
  multipleFiles: PropTypes.bool,
  newComment: PropTypes.string,
  onClickCancelSave: PropTypes.func,
  onClickSaveAnyway: PropTypes.func,
  onClickValidateNewCommentBtn: PropTypes.func,
  onClickWysiwygBtn: PropTypes.func,
  placeHolder: PropTypes.string,
  searchForMentionOrLinkInQuery: PropTypes.func,
  showInvalidMentionPopup: PropTypes.bool,
  workspaceId: PropTypes.number,
  wysiwyg: PropTypes.bool,
  wysiwygIdSelector: PropTypes.string,
  isFileCommentLoading: PropTypes.bool
}

CommentArea.defaultProps = {
  buttonLabel: '',
  codeLanguageList: [],
  contentId: 0,
  contentType: '',
  customClass: '',
  disableComment: false,
  hideSendButtonAndOptions: false,
  icon: 'far fa-paper-plane',
  id: '',
  invalidMentionList: [],
  lang: 'en',
  memberList: [],
  roleList: [],
  multipleFiles: true,
  newComment: '',
  onClickCancelSave: () => { },
  onClickSaveAnyway: () => { },
  onClickValidateNewCommentBtn: () => { },
  onClickWysiwygBtn: () => { },
  placeHolder: '',
  searchForMentionOrLinkInQuery: () => { },
  showInvalidMentionPopup: false,
  workspaceId: 0,
  wysiwyg: false,
  wysiwygIdSelector: '',
  isFileCommentLoading: false
}
