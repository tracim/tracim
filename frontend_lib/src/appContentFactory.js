import React from 'react'
import i18n from './i18n.js'
import Autolinker from 'autolinker'
import { uniqBy } from 'lodash'

import {
  handleFetchResult,
  APP_FEATURE_MODE,
  NUMBER_RESULTS_BY_PAGE,
  displayDistanceDate,
  sendGlobalFlashMessage,
  TIMELINE_TYPE,
  CONTENT_TYPE,
  permissiveNumberEqual,
  getOrCreateSessionClientToken,
  addRevisionFromTLM,
  stringIncludes
} from './helper.js'

import {
  SORT_BY,
  sortListByMultipleCriteria,
  sortTimelineByDate
} from './sortListHelper.js'

import {
  LOCAL_STORAGE_FIELD,
  getLocalStorageItem,
  setLocalStorageItem
} from './localStorage.js'

import {
  addClassToMentionsOfUser,
  getMatchingGroupMentionList
} from './mentionOrLink.js'

import {
  getTranslationApiErrorMessage,
  TRANSLATION_STATE,
  getDefaultTranslationState
} from './translation.js'

import {
  deleteComment,
  deleteToDo,
  deleteContentFromFavoriteList,
  getComment,
  getCommentTranslated,
  getContent,
  getContentComment,
  getFavoriteContentList,
  getFileChildContent,
  getMyselfKnownContents,
  getSpaceMemberList,
  getTemplateList,
  getToDoList,
  postContentToFavoriteList,
  postNewComment,
  postToDo,
  putComment,
  putContentArchived,
  putContentDeleted,
  putContentRestoreArchive,
  putContentRestoreDelete,
  putContentTemplate,
  putEditContent,
  putEditStatus,
  putToDo
} from './action.async.js'

import {
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST
} from './tracimLiveMessage.js'

import { CUSTOM_EVENT } from './customEvent.js'
import { isFileUploadInErrorState, uploadFile } from './fileUpload.js'
import { TracimComponent } from './tracimComponent.js'

export const TIMELINE_ITEM_COUNT_PER_PAGE = 15

const DEFAULT_TIMELINE_STATE = {
  // INFO - SG - 2021-08-10 - timeline is the portion of wholeTimeline which
  // is visible to the wrapped component through props.timeline.
  // wholeTimeline can contain more elements as the timeline is paginated
  // and comes from 3 different APIs (comments, child files, revisions)
  timeline: [],
  wholeTimeline: [],
  commentPageToken: '',
  hasMoreComments: true,
  revisionPageToken: '',
  hasMoreRevisions: true,
  filePageToken: '',
  hasMoreFiles: true,
  isLastTimelineItemCurrentToken: false,
  loadingTimeline: true
}

// INFO - CH - 2019-12-31 - Careful, for setState to work, it must have "this" bind to it when passing it by reference from the app
// For now, I don't have found a good way of checking if it has been done or not.
export function appContentFactory (WrappedComponent) {
  class AppContentFactory extends React.Component {
    apiUrl = null

    constructor (props) {
      super(props)
      const param = props.data || { content: {} }
      this.state = {
        config: param.config,
        loggedUser: param.loggedUser || props.user,
        content: param.content,
        ...DEFAULT_TIMELINE_STATE
      }
      this.sessionClientToken = getOrCreateSessionClientToken()

      props.registerLiveMessageHandlerList([
        { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, handler: this.handleContentModified },
        { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.COMMENT, handler: this.handleCommentCreated },
        { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.COMMENT, handler: this.handleChildContentDeleted },
        { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommentModified },
        { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.FILE, handler: this.handleChildContentCreated },
        { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FILE, handler: this.handleChildContentDeleted },
        { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FILE, handler: this.handleChildContentModified },
        { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModified }
      ])

      // FIXME - GB - 2021-09-08 - The condition below is needed because appContentFactory is used by
      // frontend components (Publications and FeedItemWithPreview).
      // Inside the frontend the user is called user and in the apps it is called loggedUser.
      // Issue to refactor this behavior: https://github.com/tracim/tracim/issues/749
      const lang = (param.loggedUser || props.user || { lang: 'en' }).lang
      i18n.changeLanguage(lang)
    }

    checkApiUrl = () => {
      if (!this.apiUrl) {
        console.error('Error from appContentFactory. `apiUrl` hasn\'t been set. You must call `props.setApiUrl` in your component\'s constructor.')
      }
    }

    setApiUrl = url => { this.apiUrl = url }

    getContent = async (contentId) => {
      const fetchGetContent = await handleFetchResult(await getContent(this.apiUrl, contentId))

      switch (fetchGetContent.apiResponse.status) {
        case 200: return fetchGetContent.body
        default:
          sendGlobalFlashMessage(i18n.t('Unknown content'))
          return {}
      }
    }

    getTemplateList = async (setState, templateType) => {
      const result = await getTemplateList(this.apiUrl, templateType)
      const fetchGetTemplates = await handleFetchResult(result)
      const templateList = []

      switch (fetchGetTemplates.apiResponse.status) {
        case 200:
          fetchGetTemplates.body.forEach(template => {
            templateList.push({
              ...template,
              value: template.content_id
            })
          })
          setState({ templateList: templateList })
          break
        default:
          sendGlobalFlashMessage(i18n.t('Something went wrong'))
          setState({ templateList: templateList })
          break
      }
    }

    /**
     * Get a complete comment
     * This function exists also in withActivity.jsx
     * @async
     * @param {int} spaceId
     * @param {int} contentId
     * @param {int} commentId
     * @returns {Promise<JSON>}
     */
    getComment = async (spaceId, contentId, commentId) => {
      const fetchGetComment = await handleFetchResult(await getComment(this.apiUrl, spaceId, contentId, commentId))

      switch (fetchGetComment.apiResponse.status) {
        case 200: return fetchGetComment.body
        default:
          sendGlobalFlashMessage(i18n.t('Unknown comment'))
          return {}
      }
    }

    getToDoList = async (setState, workspaceId, contentId) => {
      const fetchGetToDo = await handleFetchResult(await getToDoList(this.apiUrl, workspaceId, contentId))

      switch (fetchGetToDo.apiResponse.status) {
        case 200:
          setState({
            toDoList: sortListByMultipleCriteria(
              uniqBy(fetchGetToDo.body, 'content_id'),
              [SORT_BY.STATUS, SORT_BY.CREATION_DATE, SORT_BY.ID]
            )
          })
          break
        default:
          sendGlobalFlashMessage(i18n.t('Something went wrong'))
          break
      }
    }

    handleCommentCreated = async (tlm) => {
      const { state } = this
      if (!state.content || !permissiveNumberEqual(tlm.fields.content.parent_id, state.content.content_id)) return
      const comment = await this.getComment(tlm.fields.workspace.workspace_id, tlm.fields.content.parent_id, tlm.fields.content.content_id)
      this.handleChildContentCreated({
        ...tlm,
        fields: {
          ...tlm.fields,
          content: {
            ...tlm.fields.content,
            ...comment
          }
        }
      })
    }

    handleChildContentCreated = (tlm) => {
      const { state } = this
      // Not a child of our content
      if (!state.content || !permissiveNumberEqual(tlm.fields.content.parent_id, state.content.content_id)) return

      const isFromCurrentToken = tlm.fields.client_token === this.sessionClientToken
      this.addChildContentToTimeline(
        tlm.fields.content,
        state.loggedUser,
        isFromCurrentToken,
        getDefaultTranslationState(state.config.system.config)
      )
    }

    handleChildContentDeleted = (tlm) => {
      const { state } = this
      if (!state.content || !permissiveNumberEqual(tlm.fields.content.parent_id, state.content.content_id)) return
      this.setState(prevState => {
        const wholeTimeline = prevState.wholeTimeline.filter(timelineItem => timelineItem.content_id !== tlm.fields.content.content_id)
        const timeline = this.getTimeline(wholeTimeline, prevState.timeline.length - 1)
        return { timeline, wholeTimeline }
      })
    }

    handleChildContentModified = (tlm) => {
      const { state, props } = this

      if (
        props.data === undefined ||
        tlm.fields.content.workspace_id !== props.data.content.workspace_id ||
        tlm.fields.content.parent_id !== props.data.content.content_id
      ) return

      const wholeTimeline = [...state.wholeTimeline]
      const index = wholeTimeline.findIndex(element => element.content_id === tlm.fields.content.content_id)
      if (index < 0) return

      wholeTimeline[index] = this.buildTimelineItemCommentAsFile(tlm.fields.content, state.loggedUser)
      const timeline = this.getTimeline(wholeTimeline, state.timeline.length)

      this.setState({
        wholeTimeline,
        timeline
      })
    }

    handleContentCommentModified = async (tlm) => {
      const { state } = this
      if (!state.content || !permissiveNumberEqual(tlm.fields.content.parent_id, state.content.content_id)) return

      const comment = await this.getComment(tlm.fields.workspace.workspace_id, tlm.fields.content.parent_id, tlm.fields.content.content_id)

      this.setState(prevState => {
        const wholeTimeline = this.updateCommentOnTimeline(
          { ...tlm.fields.content, ...comment },
          prevState.wholeTimeline,
          prevState.loggedUser.username
        )
        const timeline = this.getTimeline(wholeTimeline, prevState.timeline.length + 1)
        return { wholeTimeline, timeline }
      })
    }

    handleUserModified = tlm => {
      this.setState(prevState => {
        const wholeTimeline = prevState.wholeTimeline.map(
          timelineItem => timelineItem.author.user_id === tlm.fields.user.user_id
            ? { ...timelineItem, author: tlm.fields.user }
            : timelineItem
        )
        const timeline = this.getTimeline(wholeTimeline, prevState.timeline.length)
        return { wholeTimeline, timeline }
      })
    }

    handleContentModified = async (tlm) => {
      const { state } = this
      // Not our content
      if (!state.content || !permissiveNumberEqual(tlm.fields.content.content_id, state.content.content_id)) return

      const content = await this.getContent(tlm.fields.content.content_id)

      this.setState(prevState => {
        const isFromCurrentToken = tlm.fields.client_token === this.sessionClientToken
        const wholeTimeline = addRevisionFromTLM(
          {
            ...tlm.fields,
            content: {
              ...tlm.fields.content,
              ...content
            }
          },
          prevState.wholeTimeline,
          prevState.loggedUser.lang,
          isFromCurrentToken
        )

        return {
          timeline: this.getTimeline(wholeTimeline, prevState.timeline.length + 1),
          wholeTimeline,
          isLastTimelineItemCurrentToken: isFromCurrentToken
        }
      })
    }

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
      setState({
        isVisible: false
      })
    }

    // CH - 2019-31-12 - This event is used to send a new content_id that will trigger data reload through componentDidUpdate
    appContentCustomEventHandlerReloadContent = (newContent, setState, appSlug) => {
      setState(prev => ({
        content: { ...prev.content, ...newContent },
        isVisible: true,
        newComment: prev.content.content_id === newContent.content_id
          ? prev.newComment
          : getLocalStorageItem(
            appSlug,
            newContent.content_id,
            newContent.workspace_id,
            LOCAL_STORAGE_FIELD.COMMENT
          ) || ''
      }))
    }

    // CH - 2019-31-12 - This event is used to reload all app data. It's not supposed to handle content id change
    appContentCustomEventHandlerReloadAppFeatureData = async (loadContent, loadTimeline) => {
      loadContent()
      loadTimeline()
    }

    appContentCustomEventHandlerAllAppChangeLanguage = (newLang, setState, i18n) => {
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

    appContentMarkAsTemplate = async (setState, content, isTemplate = false) => {
      setState({ disableChangeIsTemplate: true })
      this.checkApiUrl()

      if (!content) {
        return {}
      }

      const response = await handleFetchResult(
        await putContentTemplate(this.apiUrl, content.workspace_id, content.content_id, isTemplate)
      )

      switch (response.status) {
        case 204:
          setState({ isTemplate: isTemplate })
          break
        default:
          sendGlobalFlashMessage('Error while marking this as a template')
          break
      }

      setState({ disableChangeIsTemplate: false })
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

    appContentSaveNewToDo = async (workspaceId, contentId, assignedUserId, toDo, setState) => {
      this.checkApiUrl()
      const response = await handleFetchResult(await postToDo(this.apiUrl, workspaceId, contentId, assignedUserId, toDo))
      if (response.apiResponse.status !== 200) sendGlobalFlashMessage(i18n.t('Error while saving new to do'))
      return response
    }

    appContentDeleteToDo = async (workspaceId, contentId, toDoId, setState, previousLockedToDoList) => {
      this.checkApiUrl()
      setState({ lockedToDoList: [...previousLockedToDoList, toDoId] })

      const response = await handleFetchResult(await deleteToDo(this.apiUrl, workspaceId, contentId, toDoId))

      switch (response.status) {
        case 204: break
        case 403:
          setState({ lockedToDoList: [...previousLockedToDoList] })
          sendGlobalFlashMessage(i18n.t('You are not allowed to delete this to do'))
          break
        default:
          setState({ lockedToDoList: [...previousLockedToDoList] })
          sendGlobalFlashMessage(i18n.t('Error while deleting to do'))
          break
      }

      return response
    }

    appContentChangeStatusToDo = async (workspaceId, contentId, toDoId, status, setState, previousLockedToDoList) => {
      this.checkApiUrl()
      setState({ lockedToDoList: [...previousLockedToDoList, toDoId] })

      const response = await handleFetchResult(await putToDo(this.apiUrl, workspaceId, contentId, toDoId, status))

      switch (response.status) {
        case 204: break
        case 403:
          setState({ lockedToDoList: [...previousLockedToDoList] })
          sendGlobalFlashMessage(i18n.t('You are not allowed to change the status of this to do'))
          break
        default:
          setState({ lockedToDoList: [...previousLockedToDoList] })
          sendGlobalFlashMessage(i18n.t('Error while saving new to do'))
          break
      }

      return response
    }

    appContentEditComment = async (workspaceId, contentId, commentId, newComment) => {
      this.checkApiUrl()

      const response = await handleFetchResult(
        await putComment(this.apiUrl, workspaceId, contentId, commentId, newComment)
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
        content.content_id,
        content.workspace_id,
        LOCAL_STORAGE_FIELD.COMMENT,
        newComment
      )
    }

    appContentSaveNewCommentText = async (content, newComment) => {
      this.checkApiUrl()

      if (newComment === '') {
        return { apiResponse: { status: 400 }, body: { code: 2003 } }
      }

      const contentToSend = Autolinker.link(newComment, { stripPrefix: false })

      const response = await handleFetchResult(
        await postNewComment(
          this.apiUrl,
          content.workspace_id,
          content.content_id,
          contentToSend,
          content.content_namespace
        )
      )

      switch (response.apiResponse.status) {
        case 200:
          // Nothing to do
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

    appContentSaveNewCommentFile = async (content, file) => {
      this.checkApiUrl()

      const errorMessageList = [
        { status: 400, code: 3002, message: i18n.t('A content with the same name already exists') },
        { status: 400, code: 6002, message: i18n.t('The file is larger than the maximum file size allowed') },
        { status: 400, code: 6003, message: i18n.t('Error, the space exceed its maximum size') },
        { status: 400, code: 6004, message: i18n.t('You have reached your storage limit, you cannot add new files') }
      ]
      const parentNamespace = content.contentNamespace ? content.contentNamespace : content.content_namespace
      return uploadFile(
        file,
        `${this.apiUrl}/workspaces/${content.workspace_id}/files`,
        {
          additionalFormData: {
            parent_id: content.content_id,
            content_namespace: parentNamespace
          },
          httpMethod: 'POST',
          progressEventHandler: () => { },
          errorMessageList: errorMessageList,
          defaultErrorMessage: i18n.t('Error while uploading file')
        }
      )
    }

    appContentSaveNewCommentFileList = async (setState, content, fileList) => {
      this.checkApiUrl()

      setState({ isFileCommentLoading: true })
      const responseList = await Promise.all(
        fileList.map(file => this.appContentSaveNewCommentFile(content, file))
      )

      // TODO - MP - 2023-01-11 - Send ONE global flash message for every files in error instead of
      // one message per file
      // [#6090}(https://github.com/tracim/tracim/issues/6090)
      const uploadFailedList = responseList.filter(upload => isFileUploadInErrorState(upload))
      uploadFailedList.forEach(fileInError => sendGlobalFlashMessage(fileInError.errorMessage))

      setState({ fileList: uploadFailedList, isFileCommentLoading: false })
    }

    appContentChangeStatus = async (content, newStatus, appSlug) => {
      this.checkApiUrl()

      if (newStatus === content.status) return

      const response = await handleFetchResult(
        await putEditStatus(this.apiUrl, content.workspace_id, content.content_id, appSlug, newStatus)
      )

      if (response.status !== 204) {
        sendGlobalFlashMessage(i18n.t('Error while changing status'))
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

    appContentNotifyAll = (content) => {
      const comment = i18n.t('Please notice that I did an important update on this content.')
      const commentWithMention = `<html-mention roleid="0"></html-mention> ${comment}`

      this.appContentSaveNewCommentText(content, commentWithMention)
    }

    buildTimelineItemComment = (content, loggedUser, initialCommentTranslationState) => ({
      ...content,
      timelineType: TIMELINE_TYPE.COMMENT,
      created_raw: content.created,
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

    buildTimelineItemRevision = (revision, loggedUser) => ({
      ...revision,
      created_raw: revision.created,
      created: displayDistanceDate(revision.created, loggedUser.lang),
      timelineType: TIMELINE_TYPE.REVISION
    })

    buildTimelineFromCommentAndRevision = (
      commentList, commentAsFileList, revisionList, loggedUser, initialCommentTranslationState = TRANSLATION_STATE.DISABLED
    ) => {
      const timelineCommentList = commentList.map(c => this.buildTimelineItemComment(c, loggedUser, initialCommentTranslationState))
      const timelineCommentAsFileList = commentAsFileList.map(c => this.buildTimelineItemCommentAsFile(c, loggedUser))
      const timelineRevisionList = revisionList.map((r, i) => this.buildTimelineItemRevision(r, loggedUser))

      const fullTimeline = [
        ...timelineCommentList,
        ...timelineCommentAsFileList,
        ...timelineRevisionList
      ]

      return sortTimelineByDate(fullTimeline)
    }

    loadMoreTimelineItems = async (getContentRevision, newContent = null, keepPreviousItems = true) => {
      const { props, state } = this

      const content = newContent || state.content
      const curState = newContent ? DEFAULT_TIMELINE_STATE : state
      const newItemCount = curState.timeline.length + TIMELINE_ITEM_COUNT_PER_PAGE

      const fetchResult = async (fetchPromise) => {
        return await handleFetchResult(await fetchPromise)
      }

      // Get the newest comments, files and revisions from the paginated backend API
      const [commentsResponse, filesResponse, revisionsResponse] = await Promise.all([
        fetchResult(getContentComment(this.apiUrl, content.workspace_id, content.content_id, curState.commentPageToken, TIMELINE_ITEM_COUNT_PER_PAGE, 'created:desc')),
        fetchResult(getFileChildContent(this.apiUrl, content.workspace_id, content.content_id, curState.filePageToken, TIMELINE_ITEM_COUNT_PER_PAGE, 'created:desc')),
        // INFO - 2021/08/17 - S.G. - the order is done with "modified" for revisions as the "created" field is the creation
        // date of the content, not of a revision (and thus is the same for all revisions of a content).
        fetchResult(getContentRevision(this.apiUrl, content.workspace_id, content.content_id, curState.revisionPageToken, TIMELINE_ITEM_COUNT_PER_PAGE, 'modified:desc'))
      ])

      if (!commentsResponse.apiResponse.ok || !filesResponse.apiResponse.ok || !revisionsResponse.apiResponse.ok) {
        sendGlobalFlashMessage(props.t('Error while loading timeline'))
        console.error('Error loading timeline', 'comments:', commentsResponse, 'revisions:', revisionsResponse, 'files:', filesResponse)
        return
      }

      const newTimeline = this.buildTimelineFromCommentAndRevision(
        commentsResponse.body.items,
        filesResponse.body.items,
        revisionsResponse.body.items,
        state.loggedUser,
        getDefaultTranslationState(state.config.system.config)
      )

      this.setState((prevState) => {
        const wholeTimeline = sortTimelineByDate(keepPreviousItems ? [...newTimeline, ...prevState.wholeTimeline] : newTimeline)
        return {
          commentPageToken: commentsResponse.body.next_page_token,
          hasMoreComments: commentsResponse.body.has_next,
          filePageToken: filesResponse.body.next_page_token,
          hasMoreFiles: filesResponse.body.has_next,
          revisionPageToken: revisionsResponse.body.next_page_token,
          hasMoreRevisions: revisionsResponse.body.has_next,
          wholeTimeline,
          content,
          timeline: this.getTimeline(wholeTimeline, newItemCount)
        }
      })
    }

    resetTimeline = () => this.setState(DEFAULT_TIMELINE_STATE)

    loadTimeline = async (getContentRevision, content) => {
      this.resetTimeline()
      try {
        await this.loadMoreTimelineItems(getContentRevision, content, false)
      } finally {
        this.setState({ loadingTimeline: false })
      }
    }

    getTimeline = (wholeTimeline, itemCount) => {
      // INFO - 2021-08-18 - S.G. - timeline is a view of the last "itemCount" items of wholeTimeline.
      const timelineStartIndex = Math.max(wholeTimeline.length - itemCount, 0)
      return wholeTimeline.slice(timelineStartIndex)
    }

    canLoadMoreTimelineItems = () => {
      const { state } = this
      return (
        state.wholeTimeline.length > state.timeline.length ||
        state.hasMoreComments ||
        state.hasMoreFiles ||
        state.hasMoreRevisions
      )
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
          default: sendGlobalFlashMessage(i18n.t('An error has happened while getting the known content list')); break
        }
      } else {
        autoCompleteItemList = getMatchingGroupMentionList(keyword)
        const fetchSpaceMemberList = await handleFetchResult(
          await getSpaceMemberList(this.apiUrl, workspaceId)
        )

        const includesKeyword = stringIncludes(keyword)

        switch (fetchSpaceMemberList.apiResponse.status) {
          case 200: return [
            ...autoCompleteItemList,
            ...fetchSpaceMemberList.body
              .filter(m => includesKeyword(m.user.username) || includesKeyword(m.user.public_name))
              .map(m => ({ mention: m.user.username, detail: m.user.public_name, ...m.user }))
          ]
          default: sendGlobalFlashMessage(i18n.t('An error has happened while getting the known members list')); break
        }
      }
      return autoCompleteItemList
    }

    buildChildContentTimelineItem = (content, loggedUser, initialCommentTranslationState) => {
      const timelineItem = content.content_type === TIMELINE_TYPE.COMMENT
        ? this.buildTimelineItemComment(content, loggedUser, initialCommentTranslationState)
        : this.buildTimelineItemCommentAsFile(content, loggedUser)
      return timelineItem
    }

    // INFO - CH - 20210318 - This function can add comment and file
    addChildContentToTimeline = (content, loggedUser, isFromCurrentToken, initialCommentTranslationState) => {
      const timelineItem = this.buildChildContentTimelineItem(content, loggedUser, initialCommentTranslationState)
      this.setState(prevState => {
        const wholeTimeline = sortTimelineByDate([...prevState.wholeTimeline, timelineItem])
        const timeline = sortTimelineByDate([...prevState.timeline, timelineItem])
        return {
          timeline,
          wholeTimeline,
          isLastTimelineItemCurrentToken: isFromCurrentToken
        }
      })
    }

    updateCommentOnTimeline = (comment, timeline, loggedUserUsername) => {
      const oldComment = timeline.find(timelineItem => timelineItem.content_id === comment.content_id)

      if (!oldComment) {
        sendGlobalFlashMessage(i18n.t('Error while saving the comment'))
        return timeline
      }

      const newTimeline = timeline.map(timelineItem => timelineItem.content_id === comment.content_id
        ? { ...timelineItem, ...comment, raw_content: addClassToMentionsOfUser(comment.raw_content, loggedUserUsername) }
        : timelineItem
      )
      return newTimeline
    }

    onHandleTranslateComment = async (comment, workspaceId, lang) => {
      this.setState(previousState => {
        const wholeTimeline = this.replaceComment(
          { ...comment, translationState: TRANSLATION_STATE.PENDING },
          previousState.wholeTimeline
        )
        return {
          wholeTimeline,
          timeline: this.getTimeline(wholeTimeline, previousState.timeline.length)
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
        sendGlobalFlashMessage(errorMessage)
        this.setState(previousState => {
          const wholeTimeline = this.replaceComment(
            { ...comment, translationState: TRANSLATION_STATE.UNTRANSLATED },
            previousState.wholeTimeline
          )
          return {
            wholeTimeline,
            timeline: this.getTimeline(wholeTimeline, previousState.timeline.length)
          }
        })
        return
      }
      const translatedRawContent = await response.text()
      this.setState(previousState => {
        const wholeTimeline = this.replaceComment(
          {
            ...comment,
            translatedRawContent,
            translationState: TRANSLATION_STATE.TRANSLATED
          },
          previousState.wholeTimeline
        )
        return {
          wholeTimeline,
          timeline: this.getTimeline(wholeTimeline, previousState.timeline.length)
        }
      })
    }

    onHandleRestoreComment = (comment) => {
      this.setState(previousState => {
        const wholeTimeline = this.replaceComment(
          {
            ...comment,
            translationState: TRANSLATION_STATE.UNTRANSLATED
          },
          previousState.wholeTimeline
        )
        return {
          wholeTimeline,
          timeline: this.getTimeline(wholeTimeline, previousState.timeline.length)
        }
      })
    }

    render () {
      return (
        <WrappedComponent
          {...this.props}
          setApiUrl={this.setApiUrl}
          addContentToFavoriteList={this.addContentToFavoriteList}
          appContentChangeStatusToDo={this.appContentChangeStatusToDo}
          appContentCustomEventHandlerShowApp={this.appContentCustomEventHandlerShowApp}
          appContentCustomEventHandlerHideApp={this.appContentCustomEventHandlerHideApp}
          appContentCustomEventHandlerReloadAppFeatureData={this.appContentCustomEventHandlerReloadAppFeatureData}
          appContentCustomEventHandlerReloadContent={this.appContentCustomEventHandlerReloadContent}
          appContentCustomEventHandlerAllAppChangeLanguage={this.appContentCustomEventHandlerAllAppChangeLanguage}
          appContentChangeTitle={this.appContentChangeTitle}
          appContentChangeComment={this.appContentChangeComment}
          appContentDeleteComment={this.appContentDeleteComment}
          appContentDeleteToDo={this.appContentDeleteToDo}
          appContentEditComment={this.appContentEditComment}
          appContentMarkAsTemplate={this.appContentMarkAsTemplate}
          appContentSaveNewCommentText={this.appContentSaveNewCommentText}
          appContentSaveNewCommentFileList={this.appContentSaveNewCommentFileList}
          appContentChangeStatus={this.appContentChangeStatus}
          appContentArchive={this.appContentArchive}
          appContentDelete={this.appContentDelete}
          appContentNotifyAll={this.appContentNotifyAll}
          appContentRestoreArchive={this.appContentRestoreArchive}
          appContentRestoreDelete={this.appContentRestoreDelete}
          appContentSaveNewToDo={this.appContentSaveNewToDo}
          buildTimelineFromCommentAndRevision={this.buildTimelineFromCommentAndRevision}
          getTemplateList={this.getTemplateList}
          getToDoList={this.getToDoList}
          handleTranslateComment={this.onHandleTranslateComment}
          handleRestoreComment={this.onHandleRestoreComment}
          isContentInFavoriteList={this.isContentInFavoriteList}
          searchForMentionOrLinkInQuery={this.searchForMentionOrLinkInQuery}
          removeContentFromFavoriteList={this.removeContentFromFavoriteList}
          loadFavoriteContentList={this.loadFavoriteContentList}
          buildChildContentTimelineItem={this.buildChildContentTimelineItem}
          updateCommentOnTimeline={this.updateCommentOnTimeline}
          timeline={this.state.timeline}
          loadTimeline={this.loadTimeline}
          loadMoreTimelineItems={this.loadMoreTimelineItems}
          resetTimeline={this.resetTimeline}
          canLoadMoreTimelineItems={this.canLoadMoreTimelineItems}
          isLastTimelineItemCurrentToken={this.state.isLastTimelineItemCurrentToken}
          loadingTimeline={this.state.loadingTimeline}
        />
      )
    }
  }
  return TracimComponent(AppContentFactory)
}
