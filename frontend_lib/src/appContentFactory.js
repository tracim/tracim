import React from 'react'
import i18n from './i18n.js'
import {
  handleFetchResult,
  APP_FEATURE_MODE,
  NUMBER_RESULTS_BY_PAGE,
  convertBackslashNToBr,
  displayDistanceDate,
  sortTimelineByDate,
  sendGlobalFlashMessage,
  TIMELINE_TYPE,
  CONTENT_TYPE
} from './helper.js'

import {
  LOCAL_STORAGE_FIELD,
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem
} from './localStorage.js'

import {
  addClassToMentionsOfUser,
  handleMentionsBeforeSave,
  getInvalidMentionList,
  getMatchingGroupMentionList,
  handleLinksBeforeSave
} from './mentionOrLink.js'

import {
  getTranslationApiErrorMessage,
  TRANSLATION_STATE
} from './translation.js'

import {
  deleteComment,
  putEditContent,
  putComment,
  postNewComment,
  putEditStatus,
  putContentArchived,
  putContentDeleted,
  putContentRestoreArchive,
  putContentRestoreDelete,
  getMyselfKnownContents,
  getMyselfKnownMember,
  getCommentTranslated,
  postContentToFavoriteList,
  getFavoriteContentList,
  deleteContentFromFavoriteList
} from './action.async.js'
import { CUSTOM_EVENT } from './customEvent.js'
import Autolinker from 'autolinker'
import { isFileUploadInErrorState, uploadFile } from './fileUpload.js'

// INFO - CH - 2019-12-31 - Careful, for setState to work, it must have "this" bind to it when passing it by reference from the app
// For now, I don't have found a good way of checking if it has been done or not.
export function appContentFactory (WrappedComponent) {
  return class extends React.Component {
    apiUrl = null

    checkApiUrl = () => {
      if (!this.apiUrl) {
        console.error("Warning from appContentFactory. apiUrl hasn't been set. You must call props.setApiUrl in your component's constructor.")
      }
    }

    setApiUrl = url => { this.apiUrl = url }

    // INFO - CH - 2019-01-08 - event called by OpenContentApp to open the show the app if it is already rendered
    appContentCustomEventHandlerShowApp = (newContent, content, setState, buildBreadcrumbs) => {
      if (newContent.content_id !== content.content_id) {
        // RJ - 2020-01-13 - NOTE
        // content corresponds to variable contentToOpen in OpenContentApp
        // content.content_type is not defined there. I don't know if it is
        // called from elsewhere, but content.content_type might always be
        // undefined here https://github.com/tracim/tracim/issues/3742#issuecomment-759317358
        GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.RELOAD_CONTENT(content.content_type || content.type),
          data: newContent
        })
        return
      }
      setState({ isVisible: true })
      buildBreadcrumbs(content)
    }

    // INFO - CH - 2019-01-08 - event called by OpenContentApp in case of opening another app feature
    appContentCustomEventHandlerHideApp = setState => {
      globalThis.tinymce.remove('#wysiwygTimelineComment')
      setState({
        isVisible: false,
        timelineWysiwyg: false
      })
    }

    // CH - 2019-31-12 - This event is used to send a new content_id that will trigger data reload through componentDidUpdate
    appContentCustomEventHandlerReloadContent = (newContent, setState, appSlug) => {
      globalThis.tinymce.remove('#wysiwygTimelineComment')

      setState(prev => ({
        content: { ...prev.content, ...newContent },
        isVisible: true,
        timelineWysiwyg: false,
        newComment: prev.content.content_id === newContent.content_id
          ? prev.newComment
          : getLocalStorageItem(
            appSlug,
            newContent,
            LOCAL_STORAGE_FIELD.COMMENT
          ) || ''
      }))
    }

    // CH - 2019-31-12 - This event is used to reload all app data. It's not supposed to handle content id change
    appContentCustomEventHandlerReloadAppFeatureData = async (loadContent, loadTimeline) => {
      await loadContent()
      loadTimeline()
    }

    // INFO - 2019-01-09 - if param isTimelineWysiwyg is false, param changeNewCommentHandler isn't required
    appContentCustomEventHandlerAllAppChangeLanguage = (newLang, setState, i18n, isTimelineWysiwyg, changeNewCommentHandler = null) => {
      if (isTimelineWysiwyg) {
        globalThis.tinymce.remove('#wysiwygTimelineComment')
        globalThis.wysiwyg('#wysiwygTimelineComment', newLang, changeNewCommentHandler)
      }

      setState(prev => ({
        loggedUser: {
          ...prev.loggedUser,
          lang: newLang
        }
      }))
      i18n.changeLanguage(newLang)
    }

    appContentChangeTitle = async (content, newTitle, appSlug, propertiesToAddToBody = {}) => {
      this.checkApiUrl()

      if (content.label === newTitle) return

      // INFO - CH - 2019-01-03 - Check the -s added to the app slug. This is and should stay consistent with app features
      const response = await handleFetchResult(
        await putEditContent(this.apiUrl, content.workspace_id, content.content_id, appSlug, newTitle, content.raw_content, propertiesToAddToBody)
      )

      if (response.apiResponse.status !== 200) {
        switch (response.apiResponse.status) {
          case 400:
            switch (response.body.code) {
              case 2041: break // INFO - CH - 2019-04-04 - this means the same title has been sent. Therefore, no modification
              case 3002: sendGlobalFlashMessage(i18n.t('A content with same name already exists')); break
              default: sendGlobalFlashMessage(i18n.t('Error while saving the title')); break
            }
            break
          default: sendGlobalFlashMessage(i18n.t('Error while saving the title')); break
        }
      }
      return response
    }

    appContentDeleteComment = async (workspaceId, contentId, commentId, contentType = CONTENT_TYPE.COMMENT) => {
      this.checkApiUrl()
      let response

      if (contentType === CONTENT_TYPE.COMMENT) {
        response = await handleFetchResult(await deleteComment(this.apiUrl, workspaceId, contentId, commentId))
      } else {
        response = await handleFetchResult(await putContentDeleted(this.apiUrl, workspaceId, commentId))
      }

      if (response.status !== 204) {
        sendGlobalFlashMessage(i18n.t('Error while deleting the comment'))
      }

      return response
    }

    appContentEditComment = async (workspaceId, contentId, commentId, loggedUsername) => {
      this.checkApiUrl()
      const newCommentForApi = tinymce.get('wysiwygTimelineCommentEdit').getContent()
      let knownMentions = await this.searchForMentionOrLinkInQuery('', workspaceId)
      knownMentions = knownMentions.map(member => `@${member.username}`)
      const invalidMentionList = getInvalidMentionList(newCommentForApi, knownMentions)

      let newCommentForApiWithMention
      try {
        newCommentForApiWithMention = handleMentionsBeforeSave(newCommentForApi, loggedUsername, invalidMentionList)
      } catch (e) {
        return Promise.reject(e)
      }

      let newCommentForApiWithMentionAndLink
      try {
        newCommentForApiWithMentionAndLink = handleLinksBeforeSave(newCommentForApiWithMention)
      } catch (e) {
        return Promise.reject(e)
      }

      const response = await handleFetchResult(
        await putComment(this.apiUrl, workspaceId, contentId, commentId, newCommentForApiWithMentionAndLink)
      )

      switch (response.apiResponse.status) {
        case 200:
          break
        case 400:
          switch (response.body.code) {
            case 2067:
              sendGlobalFlashMessage(i18n.t('You are trying to mention an invalid user'))
              break
            case 2003:
              sendGlobalFlashMessage(i18n.t("You can't send an empty comment"))
              break
            case 2044:
              sendGlobalFlashMessage(i18n.t('You must change the status or restore this content before any change'))
              break
            default:
              sendGlobalFlashMessage(i18n.t('Error while saving the comment'))
              break
          }
          break
        default: sendGlobalFlashMessage(i18n.t('Error while saving the comment')); break
      }

      return response
    }

    appContentChangeComment = (e, content, setState, appSlug) => {
      const newComment = e.target.value
      setState({ newComment: newComment })

      setLocalStorageItem(
        appSlug,
        content,
        LOCAL_STORAGE_FIELD.COMMENT,
        newComment
      )
    }

    appContentAddCommentAsFile = (fileToUploadList, setState) => {
      if (!fileToUploadList.length) return
      setState(prev => {
        const fileToUploadListWithoutDuplicate = fileToUploadList
          .filter(fileToAdd =>
            !prev.newCommentAsFileList.find(fileAdded => fileToAdd.file.name === fileAdded.file.name)
          )
        return {
          newCommentAsFileList: [...prev.newCommentAsFileList, ...fileToUploadListWithoutDuplicate]
        }
      })
    }

    appContentRemoveCommentAsFile = (fileToRemove, setState) => {
      if (!fileToRemove) return
      setState(prev => ({
        newCommentAsFileList: prev.newCommentAsFileList.filter(
          commentAsFile => commentAsFile.file.name !== fileToRemove.file.name
        )
      }))
    }

    saveCommentAsText = async (content, isCommentWysiwyg, newComment, setState, appSlug, loggedUsername, id) => {
      // @FIXME - Côme - 2018/10/31 - line below is a hack to force send html to api
      // see https://github.com/tracim/tracim/issues/1101
      const newCommentForApi = isCommentWysiwyg
        ? tinymce.get(`wysiwygTimelineComment${id}`).getContent()
        : Autolinker.link(`<p>${convertBackslashNToBr(newComment)}</p>`, { stripPrefix: false })
      let knownMentions = await this.searchForMentionOrLinkInQuery('', content.workspace_id)
      knownMentions = knownMentions.map(member => `@${member.username}`)
      const invalidMentionList = getInvalidMentionList(newCommentForApi, knownMentions)

      let newCommentForApiWithMention
      try {
        newCommentForApiWithMention = handleMentionsBeforeSave(newCommentForApi, loggedUsername, invalidMentionList)
      } catch (e) {
        return Promise.reject(e)
      }

      let newCommentForApiWithMentionAndLink
      try {
        newCommentForApiWithMentionAndLink = handleLinksBeforeSave(newCommentForApiWithMention)
      } catch (e) {
        return Promise.reject(e)
      }

      const response = await handleFetchResult(
        await postNewComment(
          this.apiUrl,
          content.workspace_id,
          content.content_id,
          newCommentForApiWithMentionAndLink,
          content.content_namespace
        )
      )

      switch (response.apiResponse.status) {
        case 200:
          setState({ newComment: '', showInvalidMentionPopupInComment: false })
          if (isCommentWysiwyg) tinymce.get(`wysiwygTimelineComment${id}`).setContent('')

          removeLocalStorageItem(
            appSlug,
            content,
            LOCAL_STORAGE_FIELD.COMMENT
          )
          break
        case 400:
          switch (response.body.code) {
            case 2067:
              sendGlobalFlashMessage(i18n.t('You are trying to mention an invalid user'))
              break
            case 2003:
              sendGlobalFlashMessage(i18n.t("You can't send an empty comment"))
              break
            case 2044:
              sendGlobalFlashMessage(i18n.t('You must change the status or restore this content before any change'))
              break
            default:
              sendGlobalFlashMessage(i18n.t('Error while saving the comment'))
              break
          }
          break
        default: sendGlobalFlashMessage(i18n.t('Error while saving the comment')); break
      }

      return response
    }

    saveCommentAsFile = async (content, newCommentAsFile) => {
      const errorMessageList = [
        { status: 400, code: 3002, message: i18n.t('A content with the same name already exists') },
        { status: 400, code: 6002, message: i18n.t('The file is larger than the maximum file size allowed') },
        { status: 400, code: 6003, message: i18n.t('Error, the space exceed its maximum size') },
        { status: 400, code: 6004, message: i18n.t('You have reached your storage limit, you cannot add new files') }
      ]
      const parentNamespace = content.contentNamespace ? content.contentNamespace : content.content_namespace
      return uploadFile(
        newCommentAsFile,
        `${this.apiUrl}/workspaces/${content.workspace_id}/files`,
        {
          additionalFormData: {
            parent_id: content.content_id,
            content_namespace: parentNamespace
          },
          httpMethod: 'POST',
          progressEventHandler: () => {},
          errorMessageList: errorMessageList,
          defaultErrorMessage: i18n.t('Error while uploading file')
        }
      )
    }

    appContentSaveNewComment = async (
      content, isCommentWysiwyg, newComment, newCommentAsFileList, setState, appSlug, loggedUsername, id = ''
    ) => {
      this.checkApiUrl()

      if (newComment) {
        await this.saveCommentAsText(content, isCommentWysiwyg, newComment, setState, appSlug, loggedUsername, id)
      }

      if (newCommentAsFileList && newCommentAsFileList.length > 0) {
        const responseList = await Promise.all(
          newCommentAsFileList.map(newCommentAsFile => this.saveCommentAsFile(content, newCommentAsFile))
        )
        const uploadFailedList = responseList.filter(oneUpload => isFileUploadInErrorState(oneUpload))
        uploadFailedList.forEach(fileInError => sendGlobalFlashMessage(fileInError.errorMessage, 'warning'))

        setState({ newCommentAsFileList: uploadFailedList })
      }
    }

    appContentChangeStatus = async (content, newStatus, appSlug) => {
      this.checkApiUrl()

      if (newStatus === content.status) return

      const response = await handleFetchResult(
        await putEditStatus(this.apiUrl, content.workspace_id, content.content_id, appSlug, newStatus)
      )

      if (response.status !== 204) {
        sendGlobalFlashMessage(i18n.t('Error while changing status'), 'warning')
      }

      return response
    }

    appContentArchive = async (content, setState, appSlug) => {
      this.checkApiUrl()

      const response = await handleFetchResult(
        await putContentArchived(this.apiUrl, content.workspace_id, content.content_id)
      )

      switch (response.status) {
        case 204:
          setState(prev => ({ content: { ...prev.content, is_archived: true }, mode: APP_FEATURE_MODE.VIEW }))
          GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appSlug), data: {} })
          break
        default:
          GLOBAL_dispatchEvent({
            type: CUSTOM_EVENT.ADD_FLASH_MSG,
            data: {
              msg: i18n.t('Error while archiving content'),
              type: 'warning',
              delay: undefined
            }
          })
          break
      }

      return response
    }

    appContentDelete = async (content, setState, appSlug) => {
      this.checkApiUrl()

      const response = await handleFetchResult(
        await putContentDeleted(this.apiUrl, content.workspace_id, content.content_id)
      )

      switch (response.status) {
        case 204:
          setState({ mode: APP_FEATURE_MODE.VIEW })
          break
        default:
          GLOBAL_dispatchEvent({
            type: CUSTOM_EVENT.ADD_FLASH_MSG,
            data: {
              msg: i18n.t('Error while deleting content'),
              type: 'warning',
              delay: undefined
            }
          })
          break
      }

      return response
    }

    appContentRestoreArchive = async (content, setState, appSlug) => {
      this.checkApiUrl()

      const response = await handleFetchResult(
        await putContentRestoreArchive(this.apiUrl, content.workspace_id, content.content_id)
      )

      switch (response.status) {
        case 204:
          setState(prev => ({ content: { ...prev.content, is_archived: false } }))
          GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appSlug), data: {} })
          break
        default: GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.ADD_FLASH_MSG,
          data: {
            msg: i18n.t('Error while restoring content'),
            type: 'warning',
            delay: undefined
          }
        })
      }

      return response
    }

    appContentRestoreDelete = async (content, setState, appSlug) => {
      this.checkApiUrl()

      const response = await handleFetchResult(
        await putContentRestoreDelete(this.apiUrl, content.workspace_id, content.content_id)
      )

      if (response.status !== 204) {
        GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.ADD_FLASH_MSG,
          data: {
            msg: i18n.t('Error while restoring content'),
            type: 'warning',
            delay: undefined
          }
        })
      }

      return response
    }

    appContentNotifyAll = (content, setState, appSlug) => {
      const notifyAllComment = i18n.t('@all Please notice that I did an important update on this content.')

      this.appContentSaveNewComment(content, false, notifyAllComment, setState, appSlug)
    }

    buildTimelineItemComment = (content, loggedUser, initialCommentTranslationState) => ({
      ...content,
      timelineType: TIMELINE_TYPE.COMMENT,
      created_raw: content.created,
      created: displayDistanceDate(content.created, loggedUser.lang),
      raw_content: addClassToMentionsOfUser(content.raw_content, loggedUser.username),
      translatedRawContent: null,
      translationState: initialCommentTranslationState
    })

    addContentToFavoriteList = async (content, loggedUser, setState) => {
      const response = await handleFetchResult(await postContentToFavoriteList(
        this.apiUrl,
        loggedUser.userId,
        content.content_id
      ))
      if (!response.ok) {
        sendGlobalFlashMessage(i18n.t('Error while adding content to favorites'))
        return
      }
      const newFavorite = response.body
      setState(previousState => {
        return {
          favoriteList: [...previousState.favoriteList, newFavorite]
        }
      })
    }

    removeContentFromFavoriteList = async (content, loggedUser, setState) => {
      const response = await handleFetchResult(await deleteContentFromFavoriteList(
        this.apiUrl,
        loggedUser.userId,
        content.content_id
      ))
      if (!response.ok) {
        sendGlobalFlashMessage(i18n.t('Error while removing content from favorites'))
        return
      }
      setState(previousState => {
        return {
          favoriteList: previousState.favoriteList.filter(
            favorite => favorite.content_id !== content.content_id
          )
        }
      })
    }

    loadFavoriteContentList = async (loggedUser, setState) => {
      const response = await handleFetchResult(await getFavoriteContentList(this.apiUrl, loggedUser.userId))
      if (!response.ok) {
        sendGlobalFlashMessage(i18n.t('Error while getting favorites'))
        setState({ favoriteList: [] })
        return
      }
      const favorites = response.body
      setState({ favoriteList: favorites.items })
    }

    isContentInFavoriteList = (content, state) => {
      return state.favoriteList && state.favoriteList.some(
        favorite => favorite.content_id === content.content_id
      )
    }

    buildTimelineItemCommentAsFile = (content, loggedUser) => ({
      ...content,
      timelineType: TIMELINE_TYPE.COMMENT_AS_FILE,
      created_raw: content.created,
      created: displayDistanceDate(content.created, loggedUser.lang)
    })

    buildTimelineItemRevision = (revision, loggedUser, number) => ({
      ...revision,
      created_raw: revision.created,
      created: displayDistanceDate(revision.created, loggedUser.lang),
      timelineType: TIMELINE_TYPE.REVISION,
      number: number
    })

    buildTimelineFromCommentAndRevision = (
      commentList, commentAsFileList, revisionList, loggedUser, initialCommentTranslationState = TRANSLATION_STATE.DISABLED
    ) => {
      const timelineCommentList = commentList.map(c => this.buildTimelineItemComment(c, loggedUser, initialCommentTranslationState))
      const timelineCommentAsFileList = commentAsFileList.map(c => this.buildTimelineItemCommentAsFile(c, loggedUser))
      const timelineRevisionList = revisionList.map((r, i) => this.buildTimelineItemRevision(r, loggedUser, i + 1))

      const fullTimeline = [
        ...timelineCommentList,
        ...timelineCommentAsFileList,
        ...timelineRevisionList
      ]

      return sortTimelineByDate(fullTimeline)
    }

    replaceComment = (comment, timeline) => {
      return timeline.map(
        item => item.timelineType === TIMELINE_TYPE.COMMENT && item.content_id === comment.content_id ? comment : item
      )
    }

    searchForMentionOrLinkInQuery = async (query, workspaceId) => {
      function matchingContentIdsFirst (contentA, contentB) {
        const aContentId = contentA.content_id.toString()
        const bContentId = contentB.content_id.toString()

        if (keyword) {
          const idOfAStartsWithKeyword = aContentId.startsWith(keyword)
          const idOfBStartsWithKeyword = bContentId.startsWith(keyword)

          if (idOfAStartsWithKeyword && !idOfBStartsWithKeyword) {
            return -1
          }

          if (idOfBStartsWithKeyword && !idOfAStartsWithKeyword) {
            return 1
          }
        }

        return aContentId.localeCompare(bContentId, undefined, { numeric: true })
      }

      let autoCompleteItemList = []
      const keyword = query.substring(1)

      if (query.includes('#')) {
        const fetchUserKnownContents = await handleFetchResult(
          await getMyselfKnownContents(this.apiUrl, keyword, NUMBER_RESULTS_BY_PAGE)
        )

        switch (fetchUserKnownContents.apiResponse.status) {
          case 200: {
            const matchingList = fetchUserKnownContents.body.map(m => ({ detail: m.label, ...m }))
            return matchingList.sort(matchingContentIdsFirst)
          }
          default: sendGlobalFlashMessage(i18n.t('An error has happened while getting the known content list'), 'warning'); break
        }
      } else {
        autoCompleteItemList = getMatchingGroupMentionList(keyword)
        const fetchUserKnownMemberList = await handleFetchResult(await getMyselfKnownMember(this.apiUrl, keyword, workspaceId, null, NUMBER_RESULTS_BY_PAGE))

        switch (fetchUserKnownMemberList.apiResponse.status) {
          case 200: return [...autoCompleteItemList, ...fetchUserKnownMemberList.body.filter(m => m.username).map(m => ({ mention: m.username, detail: m.public_name, ...m }))]
          default: sendGlobalFlashMessage(i18n.t('An error has happened while getting the known members list'), 'warning'); break
        }
      }
      return autoCompleteItemList
    }

    // INFO - CH - 20210318 - This function can add comment and comment as file
    addCommentToTimeline = (comment, timeline, loggedUser, hasBeenRead, initialCommentTranslationState) => {
      const commentForTimeline = comment.content_type === TIMELINE_TYPE.COMMENT
        ? this.buildTimelineItemComment(comment, loggedUser, initialCommentTranslationState)
        : this.buildTimelineItemCommentAsFile(comment, loggedUser)

      return sortTimelineByDate([...timeline, commentForTimeline])
    }

    updateCommentOnTimeline = (comment, timeline, loggedUserUsername) => {
      const oldComment = timeline.find(timelineItem => timelineItem.content_id === comment.content_id)

      if (!oldComment) {
        sendGlobalFlashMessage(i18n.t('Error while saving the comment'), 'warning')
        return timeline
      }

      const newTimeline = timeline.map(timelineItem => timelineItem.content_id === comment.content_id
        ? { ...timelineItem, raw_content: addClassToMentionsOfUser(comment.raw_content, loggedUserUsername) }
        : timelineItem
      )
      return newTimeline
    }

    removeCommentFromTimeline = (commentId, timeline) => {
      return timeline.filter(timelineItem => timelineItem.content_id !== commentId)
    }

    onHandleTranslateComment = async (comment, workspaceId, lang, setState) => {
      setState(previousState => {
        return {
          timeline: this.replaceComment(
            { ...comment, translationState: TRANSLATION_STATE.PENDING },
            previousState.timeline
          )
        }
      })
      const response = await getCommentTranslated(
        this.apiUrl,
        workspaceId,
        comment.parent_id,
        comment.content_id,
        lang
      )
      const errorMessage = getTranslationApiErrorMessage(response)
      if (errorMessage) {
        sendGlobalFlashMessage(errorMessage, 'warning')
        setState(previousState => {
          return {
            timeline: this.replaceComment(
              { ...comment, translationState: TRANSLATION_STATE.UNTRANSLATED },
              previousState.timeline
            )
          }
        })
        return
      }
      const translatedRawContent = await response.text()
      setState(previousState => {
        return {
          timeline: this.replaceComment(
            {
              ...comment,
              translatedRawContent,
              translationState: TRANSLATION_STATE.TRANSLATED
            },
            previousState.timeline
          )
        }
      })
    }

    onHandleRestoreComment = (comment, setState) => {
      setState(previousState => {
        return {
          timeline: this.replaceComment(
            { ...comment, translationState: TRANSLATION_STATE.UNTRANSLATED },
            previousState.timeline
          )
        }
      })
    }

    render () {
      return (
        <WrappedComponent
          {...this.props}
          setApiUrl={this.setApiUrl}
          appContentCustomEventHandlerShowApp={this.appContentCustomEventHandlerShowApp}
          appContentCustomEventHandlerHideApp={this.appContentCustomEventHandlerHideApp}
          appContentCustomEventHandlerReloadAppFeatureData={this.appContentCustomEventHandlerReloadAppFeatureData}
          appContentCustomEventHandlerReloadContent={this.appContentCustomEventHandlerReloadContent}
          appContentCustomEventHandlerAllAppChangeLanguage={this.appContentCustomEventHandlerAllAppChangeLanguage}
          appContentChangeTitle={this.appContentChangeTitle}
          appContentChangeComment={this.appContentChangeComment}
          appContentAddCommentAsFile={this.appContentAddCommentAsFile}
          appContentDeleteComment={this.appContentDeleteComment}
          appContentEditComment={this.appContentEditComment}
          appContentRemoveCommentAsFile={this.appContentRemoveCommentAsFile}
          appContentSaveNewComment={this.appContentSaveNewComment}
          appContentChangeStatus={this.appContentChangeStatus}
          appContentArchive={this.appContentArchive}
          appContentDelete={this.appContentDelete}
          appContentNotifyAll={this.appContentNotifyAll}
          appContentRestoreArchive={this.appContentRestoreArchive}
          appContentRestoreDelete={this.appContentRestoreDelete}
          buildTimelineFromCommentAndRevision={this.buildTimelineFromCommentAndRevision}
          searchForMentionOrLinkInQuery={this.searchForMentionOrLinkInQuery}
          addCommentToTimeline={this.addCommentToTimeline}
          handleTranslateComment={this.onHandleTranslateComment}
          handleRestoreComment={this.onHandleRestoreComment}
          isContentInFavoriteList={this.isContentInFavoriteList}
          addContentToFavoriteList={this.addContentToFavoriteList}
          removeContentFromFavoriteList={this.removeContentFromFavoriteList}
          loadFavoriteContentList={this.loadFavoriteContentList}
          removeCommentFromTimeline={this.removeCommentFromTimeline}
          updateCommentOnTimeline={this.updateCommentOnTimeline}
        />
      )
    }
  }
}
