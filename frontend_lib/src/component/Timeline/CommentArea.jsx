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

  const validateComment = async (comment) => {
    console.log("validateComment", props.roleList, props.memberList, comment)
    let returnValue = searchMentionAndPlaceBalise(props.roleList, props.memberList, comment)
    console.log("validateComment returnValue", returnValue)
    if (returnValue.invalidMentionList.length > 0) {
      setTextToSend(returnValue.html)
      setInvalidMentionList(returnValue.invalidMentionList)
    } else {
      returnValue = await searchContentAndPlaceBalise(props.apiUrl, returnValue.html)
      sendComment(returnValue.html)
    }
  }

  /**
   * Send the comment to the backend
   */
  const sendComment = async (comment) => {
    // NOTE - MP - 2022-12-06 - If we don't clear this variable we don't hide the popup.
    // In case of an error it's preferable to hide the popup
    setInvalidMentionList([])

    console.log("sendComment", comment, fileListToUpload)
    const result = await props.onClickSubmit(comment, fileListToUpload)
    if (result) {
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
          onCancel={() => sendComment(textToSend)}
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
        handleCtrlEnter={validateComment}
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
              onClick={() => validateComment(content)}
              text={props.buttonLabel}
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


export default translate()(CommentArea)

CommentArea.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  onClickSubmit: PropTypes.func.isRequired,
  buttonLabel: PropTypes.string,
  codeLanguageList: PropTypes.array,
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  disableComment: PropTypes.bool,
  hideSendButtonAndOptions: PropTypes.bool,
  icon: PropTypes.string,
  invalidMentionList: PropTypes.array,
  isFileCommentLoading: PropTypes.bool,
  memberList: PropTypes.array,
  multipleFiles: PropTypes.bool,
  newComment: PropTypes.string,
  placeHolder: PropTypes.string,
  roleList: PropTypes.array,
  workspaceId: PropTypes.number,
}

CommentArea.defaultProps = {
  buttonLabel: 'Send',
  codeLanguageList: [],
  contentId: 0,
  contentType: '',
  customClass: '',
  customColor: '',
  disableComment: false,
  hideSendButtonAndOptions: false,
  icon: 'far fa-paper-plane',
  invalidMentionList: [],
  isFileCommentLoading: false,
  memberList: [],
  multipleFiles: true,
  newComment: '',
  placeHolder: 'Write a comment...',
  roleList: [],
  workspaceId: 0,
}
