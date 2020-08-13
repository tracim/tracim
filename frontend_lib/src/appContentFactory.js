import React from 'react'
import i18n from './i18n.js'
import {
  handleFetchResult,
  APP_FEATURE_MODE,
  generateLocalStorageContentId,
  convertBackslashNToBr,
  displayDistanceDate
} from './helper.js'
import {
  putEditContent,
  postNewComment,
  putEditStatus,
  putContentArchived,
  putContentDeleted,
  putContentRestoreArchive,
  putContentRestoreDelete
} from './action.async.js'
import { CUSTOM_EVENT } from './customEvent.js'
import Autolinker from 'autolinker'

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

    setApiUrl = url => this.apiUrl = url

    sendGlobalFlashMessage = (msg, type, delay = undefined) => GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.ADD_FLASH_MSG,
      data: {
        msg: msg,
        type: type || 'warning',
        delay: delay || undefined
      }
    })

    // INFO - CH - 2019-01-08 - event called by OpenContentApp to open the show the app if it is already rendered
    appContentCustomEventHandlerShowApp = (newContent, content, setState, buildBreadcrumbs) => {
      if (newContent.content_id !== content.content_id) {
        GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.RELOAD_CONTENT(content.content_type), data: newContent })
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

      const previouslyUnsavedComment = localStorage.getItem(
        generateLocalStorageContentId(newContent.workspace_id, newContent.content_id, appSlug, 'comment')
      )

      setState(prev => ({
        content: { ...prev.content, ...newContent },
        isVisible: true,
        timelineWysiwyg: false,
        newComment: prev.content.content_id === newContent.content_id
          ? prev.newComment
          : (previouslyUnsavedComment || '')
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
              case 3002: this.sendGlobalFlashMessage(i18n.t('A content with same name already exists')); break
              default: this.sendGlobalFlashMessage(i18n.t('Error while saving the title')); break
            }
            break
          default: this.sendGlobalFlashMessage(i18n.t('Error while saving the title')); break
        }
      }
      return response
    }

    appContentChangeComment = (e, content, setState, appSlug) => {
      const newComment = e.target.value
      setState({ newComment: newComment })

      localStorage.setItem(
        generateLocalStorageContentId(content.workspace_id, content.content_id, appSlug, 'comment'),
        newComment
      )
    }

    appContentSaveNewComment = async (content, isCommentWysiwyg, newComment, setState, appSlug) => {
      this.checkApiUrl()

      // @FIXME - Côme - 2018/10/31 - line bellow is a hack to force send html to api
      // see https://github.com/tracim/tracim/issues/1101
      const newCommentForApi = isCommentWysiwyg ? newComment : Autolinker.link(`<p>${convertBackslashNToBr(newComment)}</p>`)

      const response = await handleFetchResult(
        await postNewComment(this.apiUrl, content.workspace_id, content.content_id, newCommentForApi)
      )

      switch (response.apiResponse.status) {
        case 200:
          setState({ newComment: '' })
          if (isCommentWysiwyg) tinymce.get('wysiwygTimelineComment').setContent('')

          localStorage.removeItem(
            generateLocalStorageContentId(content.workspace_id, content.content_id, appSlug, 'comment')
          )
          break
        case 400:
          switch (response.body.code) {
            case 2003:
              this.sendGlobalFlashMessage(i18n.t("You can't send an empty comment"))
              break
            case 2044:
              this.sendGlobalFlashMessage(i18n.t('You must change the status or restore this content before any change'))
            default:
              this.sendGlobalFlashMessage(i18n.t('Error while saving new comment'))
              break
          }
          break
        default: this.sendGlobalFlashMessage(i18n.t('Error while saving new comment')); break
      }

      return response
    }

    appContentChangeStatus = async (content, newStatus, appSlug) => {
      this.checkApiUrl()

      if (newStatus === content.status) return

      const response = await handleFetchResult(
        await putEditStatus(this.apiUrl, content.workspace_id, content.content_id, appSlug, newStatus)
      )

      if (response.status !== 204) {
        this.sendGlobalFlashMessage(i18n.t('Error while changing status'), 'warning')
      }

      return response
    }

    appContentArchive = async (content, setState, appSlug) => {
      this.checkApiUrl()

      const response = await await handleFetchResult(
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

      const response = await await handleFetchResult(
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

      const response = await await handleFetchResult(
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

      const response = await await handleFetchResult(
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

    buildTimelineFromCommentAndRevision = (commentList, revisionList, userLang) => {
      const resCommentWithProperDate = commentList.map(c => ({
        ...c,
        created_raw: c.created,
        created: displayDistanceDate(c.created, userLang)
      }))

      return revisionList
        .map((revision, i) => ({
          ...revision,
          created_raw: revision.created,
          created: displayDistanceDate(revision.created, userLang),
          timelineType: 'revision',
          commentList: revision.comment_ids.map(ci => ({
            timelineType: 'comment',
            ...resCommentWithProperDate.find(c => c.content_id === ci)
          })),
          number: i + 1,
          hasBeenRead: true
        }))
        .flatMap(revision => [revision, ...revision.commentList])
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
          appContentSaveNewComment={this.appContentSaveNewComment}
          appContentChangeStatus={this.appContentChangeStatus}
          appContentArchive={this.appContentArchive}
          appContentDelete={this.appContentDelete}
          appContentRestoreArchive={this.appContentRestoreArchive}
          appContentRestoreDelete={this.appContentRestoreDelete}
          buildTimelineFromCommentAndRevision={this.buildTimelineFromCommentAndRevision}
        />
      )
    }
  }
}
