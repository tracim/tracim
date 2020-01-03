import React from 'react'
import i18n from './i18n.js'
import {
  handleFetchResult,
  FETCH_CONFIG,
  APP_FEATURE_MODE,
  generateLocalStorageContentId,
  convertBackslashNToBr,
  displayDistanceDate
} from './helper.js'
import { CUSTOM_EVENT } from './customEvent.js'

// INFO - CH - 2019-12-31 - Careful, for setState to work, it must have "this" bind to it when passing it by reference from the app
// For now, I don't have found a good way of checking whether it has been done or not.
export function appContentFactory (WrappedComponent) {
  return class AppContentFactory extends React.Component {
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

    appContentChangeTitle = async (content, newTitle, appSlug) => {
      this.checkApiUrl()

      if (content.label === newTitle) return

      const response = await handleFetchResult(
        await fetch(`${this.apiUrl}/workspaces/${content.workspace_id}/${appSlug}/${content.content_id}`, {
          credentials: 'include',
          headers: { ...FETCH_CONFIG.headers },
          method: 'PUT',
          body: JSON.stringify({
            label: newTitle,
            raw_content: content.raw_content
          })
        })
      )

      switch (response.apiResponse.status) {
        case 200:
          GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appSlug), data: {} })
          GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
          break
        case 400:
          switch (response.body.code) {
            case 2041: break // INFO - CH - 2019-04-04 - this means the same title has been sent. Therefore, no modification
            case 3002: this.sendGlobalFlashMessage(i18n.t('A content with same name already exists')); break
            default: this.sendGlobalFlashMessage(i18n.t('Error while saving new title')); break
          }
          break
        default: this.sendGlobalFlashMessage(i18n.t('Error while saving new title')); break
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

    appContentSaveNewComment = async (content, isContentWysiwyg, newComment, setState, appSlug) => {
      this.checkApiUrl()

      const response = await handleFetchResult(
        await fetch(`${this.apiUrl}/workspaces/${content.workspace_id}/contents/${content.content_id}/comments`, {
          credentials: 'include',
          headers: { ...FETCH_CONFIG.headers },
          method: 'POST',
          body: JSON.stringify({
            // @FIXME - Côme - 2018/10/31 - line bellow is a hack to force send html to api
            // see https://github.com/tracim/tracim/issues/1101
            raw_content: isContentWysiwyg
              ? newComment
              : `<p>${convertBackslashNToBr(newComment)}</p>`
          })
        })
      )

      switch (response.apiResponse.status) {
        case 200:
          setState({ newComment: '' })
          localStorage.removeItem(
            generateLocalStorageContentId(content.workspace_id, content.content_id, appSlug, 'comment')
          )
          GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appSlug), data: {} })
          break
        case 400:
          switch (response.body.code) {
            case 2003:
              this.sendGlobalFlashMessage(i18n.t("You can't send an empty comment"))
              break
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
        await fetch(`${this.apiUrl}/workspaces/${content.workspace_id}/${appSlug}/${content.content_id}/status`, {
          credentials: 'include',
          headers: { ...FETCH_CONFIG.headers },
          method: 'PUT',
          body: JSON.stringify({
            status: newStatus
          })
        })
      )

      switch (response.status) {
        case 204:
          GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appSlug), data: {} })
          break
        default:
          this.sendGlobalFlashMessage(i18n.t('Error while changing status'), 'warning')
          break
      }

      return response
    }

    appContentArchive = async (content, setState, appSlug) => {
      this.checkApiUrl()

      const response = await fetch(`${this.apiUrl}/workspaces/${content.workspace_id}/contents/${content.content_id}/archived`, {
        credentials: 'include',
        headers: { ...FETCH_CONFIG.headers },
        method: 'PUT'
      })

      switch (response.status) {
        case 204:
          setState(prev => ({ content: { ...prev.content, is_archived: true }, mode: APP_FEATURE_MODE.VIEW }))
          GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appSlug), data: {} })
          break
        default:
          GLOBAL_dispatchEvent({
            type: CUSTOM_EVENT.ADD_FLASH_MSG,
            data: {
              msg: i18n.t('Error while archiving document'),
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

      const response = await fetch(`${this.apiUrl}/workspaces/${content.workspace_id}/contents/${content.content_id}/trashed`, {
        credentials: 'include',
        headers: { ...FETCH_CONFIG.headers },
        method: 'PUT'
      })

      switch (response.status) {
        case 204:
          setState(prev => ({ content: { ...prev.content, is_deleted: true }, mode: APP_FEATURE_MODE.VIEW }))
          GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appSlug), data: {} })
          break
        default: GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.ADD_FLASH_MSG,
          data: {
            msg: i18n.t('Error while deleting document'),
            type: 'warning',
            delay: undefined
          }
        })
      }

      return response
    }

    appContentRestoreArchive = async (content, setState, appSlug) => {
      this.checkApiUrl()

      const response = await fetch(`${this.apiUrl}/workspaces/${content.workspace_id}/contents/${content.content_id}/archived/restore`, {
        credentials: 'include',
        headers: { ...FETCH_CONFIG.headers },
        method: 'PUT'
      })

      switch (response.status) {
        case 204:
          setState(prev => ({ content: { ...prev.content, is_archived: false } }))
          GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appSlug), data: {} })
          break
        default: GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.ADD_FLASH_MSG,
          data: {
            msg: i18n.t('Error while restoring document'),
            type: 'warning',
            delay: undefined
          }
        })
      }

      return response
    }

    appContentRestoreDelete = async (content, setState, appSlug) => {
      this.checkApiUrl()

      const response = await fetch(`${this.apiUrl}/workspaces/${content.workspace_id}/contents/${content.content_id}/trashed/restore`, {
        credentials: 'include',
        headers: { ...FETCH_CONFIG.headers },
        method: 'PUT'
      })

      switch (response.status) {
        case 204:
          setState(prev => ({ content: { ...prev.content, is_deleted: false } }))
          GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(appSlug), data: {} })
          break
        default: GLOBAL_dispatchEvent({
          type: CUSTOM_EVENT.ADD_FLASH_MSG,
          data: {
            msg: i18n.t('Error while restoring document'),
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
          created: displayDistanceDate(revision.created, state.loggedUser.lang),
          timelineType: 'revision',
          commentList: revision.comment_ids.map(ci => ({
            timelineType: 'comment',
            ...resCommentWithProperDate.find(c => c.content_id === ci)
          })),
          number: i + 1
        }))
        .flatMap(revision => [revision, ...revision.commentList])
  }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          setApiUrl={this.setApiUrl}
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
