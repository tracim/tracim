import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

import {
  searchContentAndReplaceWithTag,
  searchMentionAndReplaceWithTag
} from '../../mentionOrLink.js'
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
  const [isAdvancedEdition, setIsAdvancedEdition] = useState(props.isAdvancedEdition)
  const [textToSend, setTextToSend] = useState('')

  useEffect(() => {
    if (props.newComment) {
      setContent(props.newComment)
    } else {
      const savedComment = getLocalStorageItem(
        props.contentType,
        props.contentId,
        props.workspaceId,
        LOCAL_STORAGE_FIELD.COMMENT
      )

      if (!!savedComment && savedComment !== content) {
        setContent(savedComment)
      }
    }
  }, [props.contentType, props.contentId, props.workspaceId])

  useEffect(() => {
    if (content) {
      setLocalStorageItem(
        props.contentType,
        props.contentId,
        props.workspaceId,
        LOCAL_STORAGE_FIELD.COMMENT,
        content
      )
    } else {
      removeLocalStorageItem(
        props.contentType,
        props.contentId,
        props.workspaceId,
        LOCAL_STORAGE_FIELD.COMMENT
      )
    }
  }, [content])

  /**
   * Send the comment to the backend
   * @param {string} comment The comment to send
   * @param {boolean} force Force the comment to be sent and ignore validations
   */
  const sendComment = async (comment, force = false) => {
    let commentToSend = comment

    if (!force) {
      const parsedMentionCommentObject = searchMentionAndReplaceWithTag(
        props.roleList,
        props.memberList,
        commentToSend
      )
      commentToSend = parsedMentionCommentObject.html
      if (parsedMentionCommentObject.invalidMentionList.length > 0) {
        setTextToSend(commentToSend)
        setInvalidMentionList(parsedMentionCommentObject.invalidMentionList)
        return
      }
    }

    const parsedContentCommentObject = await searchContentAndReplaceWithTag(
      props.apiUrl,
      commentToSend
    )

    // NOTE - MP - 2022-12-06 - If we don't clear this variable we don't hide the popup.
    // In case of an error it's preferable to hide the popup
    setInvalidMentionList([])

    const submitSuccessful = await props.onClickSubmit(
      parsedContentCommentObject.html,
      fileListToUpload
    )
    if (submitSuccessful) {
      setContent('')
      setFileListToUpload([])
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

  const handleClickChangeEditor = () => {
    const newIsAdvancedEdition = !isAdvancedEdition
    setIsAdvancedEdition(newIsAdvancedEdition)
  }

  return (
    <form className={`${props.customClass}__texteditor`}>
      {invalidMentionList.length > 0 && (
        <ConfirmPopup
          onCancel={() => sendComment(textToSend, true)}
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
        setContent={setContent}
        // End of required props ///////////////////////////////////////////////
        codeLanguageList={props.codeLanguageList}
        content={content}
        onCtrlEnterEvent={sendComment}
        height={100}
        isAdvancedEdition={isAdvancedEdition}
        language={props.language}
        maxHeight={300}
        minHeight={100}
        placeholder={props.placeholder}
        roleList={props.roleList}
        userList={props.memberList}
      />
      <div
        className={
          classnames(`${props.customClass}__texteditor__wrapper`, 'commentArea__wrapper')
        }
      >
        {props.isDisplayedAdvancedEditionButton && (
          <div
            className={classnames(
              `${props.customClass}__texteditor__advancedtext`,
              'commentArea__advancedtext'
            )}
          >
            <IconButton
              customClass={classnames(
                `${props.customClass}__texteditor__advancedtext__btn commentArea__advancedtext__btn`
              )}
              disabled={props.disableComment}
              text={isAdvancedEdition ? props.t('Simple edition') : props.t('Advanced edition')}
              onClick={handleClickChangeEditor}
              intent='link'
              mode='light'
              key='commentArea__comment__advancedtext'
            />
          </div>
        )}

        <DisplayFileToUpload
          fileList={fileListToUpload}
          onRemoveCommentAsFile={handleRemoveCommentFileFromUploadList}
          color={props.customColor}
        />

        {props.isFileCommentLoading && (
          <Loading />
        )}

        <div
          className={classnames(`${props.customClass}__texteditor__submit`, 'commentArea__submit')}
        >
          {props.isDisplayedUploadFileButton && (
            <AddFileToUploadButton
              workspaceId={props.workspaceId}
              color={props.customColor}
              disabled={props.disableComment}
              onValidateCommentFileToUpload={handleValidateCommentFileListToUpload}
              multipleFiles={props.multipleFiles}
            />
          )}

          {props.isDisplayedCancelButton && (
            <IconButton
              color={props.customColor}
              customClassName='commentArea__withstand__btn'
              icon='fas fa-times'
              intent='secondary'
              mode='dark'
              onClick={props.onClickWithstand}
              text={props.withstandLabel}
              type='button'
            />
          )}

          {props.isDisplayedSendButton && (
            <IconButton
              color={props.customColor}
              customClass={classnames(
                `${props.customClass}__texteditor__submit__btn `,
                'commentArea__submit__btn'
              )}
              disabled={props.disableComment || (content === '' && fileListToUpload.length === 0)}
              icon={props.submitIcon}
              intent='primary'
              mode='light'
              onClick={() => sendComment(content, false)}
              text={props.submitLabel}
              type='button'
              key='commentArea__comment__send'
              dataCy='commentArea__comment__send'
            />
          )}
        </div>
      </div>
    </form>
  )
}

export default translate()(CommentArea)

CommentArea.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  onClickSubmit: PropTypes.func.isRequired,
  workspaceId: PropTypes.number.isRequired,
  // End of required props /////////////////////////////////////////////////////
  codeLanguageList: PropTypes.array,
  customClass: PropTypes.string,
  customColor: PropTypes.string,
  disableComment: PropTypes.bool,
  invalidMentionList: PropTypes.array,
  isAdvancedEdition: PropTypes.bool,
  isDisplayedAdvancedEditionButton: PropTypes.bool,
  isDisplayedCancelButton: PropTypes.bool,
  isDisplayedSendButton: PropTypes.bool,
  isDisplayedUploadFileButton: PropTypes.bool,
  isFileCommentLoading: PropTypes.bool,
  language: PropTypes.string,
  memberList: PropTypes.array,
  multipleFiles: PropTypes.bool,
  newComment: PropTypes.string,
  onClickWithstand: PropTypes.func,
  placeholder: PropTypes.string,
  roleList: PropTypes.array,
  submitIcon: PropTypes.string,
  submitLabel: PropTypes.string,
  withstandLabel: PropTypes.string
}

CommentArea.defaultProps = {
  codeLanguageList: [],
  customClass: '',
  customColor: '',
  disableComment: false,
  invalidMentionList: [],
  isAdvancedEdition: false,
  isDisplayedAdvancedEditionButton: true,
  isDisplayedCancelButton: false,
  isDisplayedSendButton: true,
  isDisplayedUploadFileButton: true,
  isFileCommentLoading: false,
  language: 'en',
  memberList: [],
  multipleFiles: true,
  newComment: undefined,
  onClickWithstand: () => { },
  placeholder: 'Write a comment...',
  roleList: [],
  submitIcon: 'far fa-paper-plane',
  submitLabel: 'Submit',
  withstandLabel: 'Withstand'
}
