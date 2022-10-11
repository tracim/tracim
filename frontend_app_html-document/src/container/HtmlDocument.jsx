import React from 'react'
import HtmlDocumentComponent from '../component/HtmlDocument.jsx'
import { translate } from 'react-i18next'
import { uniqBy } from 'lodash'
import i18n from '../i18n.js'
import {
  APP_FEATURE_MODE,
  BREADCRUMBS_TYPE,
  CONTENT_TYPE,
  CUSTOM_EVENT,
  FilenameWithBadges,
  addAllResourceI18n,
  appContentFactory,
  buildContentPathBreadcrumbs,
  buildHeadTitle,
  getContent,
  getInvalidMentionList,
  getOrCreateSessionClientToken,
  getToDo,
  handleClickCopyLink,
  handleFetchResult,
  handleInvalidMentionInComment,
  PAGE,
  PopinFixed,
  PopinFixedContent,
  PopinFixedRightPart,
  ROLE,
  ROLE_LIST,
  Timeline,
  TagList,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  tinymceAutoCompleteHandleClickItem,
  LOCAL_STORAGE_FIELD,
  getLocalStorageItem,
  removeLocalStorageItem,
  handleMentionsBeforeSave,
  handleLinksBeforeSave,
  addClassToMentionsOfUser,
  putUserConfiguration,
  TRANSLATION_STATE,
  handleTranslateHtmlContent,
  getDefaultTranslationState,
  sendGlobalFlashMessage,
  tinymceRemove,
  FAVORITE_STATE,
  addExternalLinksIcons,
  PopinFixedRightPartContent,
  sortContentByCreatedDateAndID,
  sortContentByStatus,
  ToDoManagement
} from 'tracim_frontend_lib'
import {
  getHtmlDocContent,
  getHtmlDocRevision,
  putHtmlDocContent,
  putHtmlDocRead
} from '../action.async.js'
import Radium from 'radium'

export class HtmlDocument extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data
    props.setApiUrl(param.config.apiUrl)
    this.state = {
      appName: 'html-document',
      breadcrumbsList: [],
      isFileCommentLoading: false,
      isTemplate: false,
      isVisible: true,
      config: param.config,
      content: param.content,
      externalTranslationList: [
        props.t('Note'),
        props.t('Notes'),
        props.t('note'),
        props.t('notes'),
        props.t('Write a note')
      ],
      rawContentBeforeEdit: '',
      newContent: {},
      loadingContent: true,
      lockedToDoList: [],
      loggedUser: param.loggedUser,
      timelineWysiwyg: false,
      mode: APP_FEATURE_MODE.VIEW,
      showRefreshWarning: false,
      editionAuthor: '',
      invalidMentionList: [],
      oldInvalidMentionList: [],
      showInvalidMentionPopupInComment: false,
      showInvalidMentionPopupInContent: false,
      translatedRawContent: null,
      translationState: TRANSLATION_STATE.DISABLED,
      translationTargetLanguageCode: param.loggedUser.lang,
      toDoList: [],
      showProgress: true
    }
    this.sessionClientToken = getOrCreateSessionClientToken()
    this.isLoadMoreTimelineInProgress = false

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.SHOW_APP(this.state.config.slug), handler: this.handleShowApp },
      { name: CUSTOM_EVENT.HIDE_APP(this.state.config.slug), handler: this.handleHideApp },
      { name: CUSTOM_EVENT.RELOAD_CONTENT(this.state.config.slug), handler: this.handleReloadContent },
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.COMMENT, handler: this.handleCommentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentRestore },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.TODO, handler: this.handleToDoCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.TODO, handler: this.handleToDoChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.TODO, handler: this.handleToDoDeleted },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleMemberModified }
    ])
  }

  // TLM Handlers

  handleCommentModified = (data) => {
    this.props.updateComment(data)
  }

  handleContentModified = async data => {
    const { props, state } = this
    if (data.fields.content.content_id !== state.content.content_id) return

    const fetchGetContent = await handleFetchResult(await getContent(this.state.config.apiUrl, data.fields.content.content_id))
    switch (fetchGetContent.apiResponse.status) {
      case 200: {
        const clientToken = state.config.apiHeader['X-Tracim-ClientToken']
        const newContentObject = {
          ...state.content,
          ...fetchGetContent.body,
          raw_content: addClassToMentionsOfUser(fetchGetContent.body.raw_content, state.loggedUser.username)
        }
        this.setState(prev => ({
          ...prev,
          content: clientToken === data.fields.client_token
            ? newContentObject
            : prev.content,
          newContent: newContentObject,
          editionAuthor: data.fields.author.public_name,
          showRefreshWarning: clientToken !== data.fields.client_token,
          rawContentBeforeEdit: newContentObject.raw_content
        }))
        if (clientToken === data.fields.client_token) {
          this.setHeadTitle(newContentObject.label)
          this.buildBreadcrumbs(newContentObject)
        }
        break
      }
      default:
        sendGlobalFlashMessage(props.t('Unknown content'))
        break
    }
  }

  handleContentDeleted = data => {
    const { state } = this
    if (data.fields.content.content_id !== state.content.content_id) return

    this.setState(prev => ({
      ...prev,
      content: this.sessionClientToken === data.fields.client_token
        ? { ...prev.content, ...data.fields.content }
        : prev.content,
      newContent: { ...prev.content, ...data.fields.content },
      editionAuthor: data.fields.author.public_name,
      showRefreshWarning: this.sessionClientToken !== data.fields.client_token
    }))
  }

  handleContentRestore = async data => {
    const { props, state } = this
    if (data.fields.content.content_id !== state.content.content_id) return
    const fetchGetContent = await handleFetchResult(await getContent(state.config.apiUrl, data.fields.content.content_id))
    switch (fetchGetContent.apiResponse.status) {
      case 200: {
        this.setState(prev => ({
          ...prev,
          content: this.sessionClientToken === data.fields.client_token
            ? { ...prev.content, ...fetchGetContent.body }
            : prev.content,
          newContent: { ...prev.content, ...fetchGetContent.body },
          editionAuthor: data.fields.author.public_name,
          showRefreshWarning: this.sessionClientToken !== data.fields.client_token
        }))
        break
      }
      default:
        sendGlobalFlashMessage(props.t('Unknown content'))
        break
    }
  }

  handleMemberModified = async data => {
    const { state } = this
    if (data.fields.user.user_id !== state.loggedUser.userId) return

    const newUserRoleId = ROLE_LIST.find(r => data.fields.member.role === r.slug).id

    this.setState(prev => ({ ...prev, loggedUser: { ...prev.loggedUser, userRoleIdInWorkspace: newUserRoleId } }))
  }

  handleToDoCreated = async data => {
    const { state } = this
    if (data.fields.content.parent.content_id !== state.content.content_id) return

    const fecthGetToDo = await handleFetchResult(await getToDo(
      state.config.apiUrl,
      data.fields.workspace.workspace_id,
      data.fields.content.parent.content_id,
      data.fields.content.content_id
    ))

    this.setState(prevState => ({
      toDoList: sortContentByStatus(sortContentByCreatedDateAndID(uniqBy([fecthGetToDo.body, ...prevState.toDoList], 'content_id')))
    }))
  }

  handleToDoChanged = async data => {
    const { state } = this
    if (data.fields.content.parent.content_id !== state.content.content_id) return

    // INFO - MP - 2022-07-19 - We fetch the to do data because we don't trust Redux
    // therefore we only update the to do when we fetch a TLM. Gives the impression
    // of lags
    const fecthGetToDo = await handleFetchResult(await getToDo(
      state.config.apiUrl,
      data.fields.workspace.workspace_id,
      data.fields.content.parent.content_id,
      data.fields.content.content_id
    ))

    this.setState(prevState => ({
      toDoList: prevState.toDoList.map(toDo => toDo.content_id === data.fields.content.content_id ? fecthGetToDo.body : toDo),
      lockedToDoList: prevState.lockedToDoList.filter(toDoId => toDoId !== data.fields.content.content_id)
    }))
  }

  handleToDoDeleted = data => {
    const { state } = this
    if (data.fields.content.parent.content_id !== state.content.content_id) return

    this.setState(prevState => ({
      toDoList: prevState.toDoList.filter(toDo => toDo.content_id !== data.fields.content.content_id),
      lockedToDoList: prevState.lockedToDoList.filter(toDoId => toDoId !== data.fields.content.content_id)
    }))
  }

  // Custom Event Handlers
  handleShowApp = data => {
    const { props, state } = this
    console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP, data)

    props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), this.buildBreadcrumbs)
    if (data.content.content_id === state.content.content_id) this.setHeadTitle(state.content.label)
  }

  handleHideApp = data => {
    const { props } = this
    console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.HIDE_APP, data)

    props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
    tinymceRemove('#wysiwygNewVersion')
  }

  handleReloadContent = data => {
    const { props, state } = this
    console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_CONTENT, data)

    props.appContentCustomEventHandlerReloadContent(data, this.setState.bind(this), state.appName)
    tinymceRemove('#wysiwygNewVersion')
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)

    this.props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, false)
  }

  componentDidMount () {
    const { props } = this
    this.loadContent()
    props.loadFavoriteContentList(this.state.loggedUser, this.setState.bind(this))
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this
    // console.log('%c<HtmlDocument> did update', `color: ${state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) {
      this.loadContent()
    }

    if (!prevState.timelineWysiwyg && state.timelineWysiwyg) {
      tinymceRemove('#wysiwygNewVersion')
    } else if (prevState.timelineWysiwyg && !state.timelineWysiwyg) {
      tinymceRemove('#wysiwygTimelineComment')
    }
  }

  componentWillUnmount () {
    console.log('%c<HtmlDocument> will Unmount', `color: ${this.state.config.hexcolor}`)
    tinymceRemove('#wysiwygNewVersion')
    tinymceRemove('#wysiwygTimelineComment')
  }

  setHeadTitle = (contentName) => {
    const { state } = this

    if (state.config && state.config.workspace && state.isVisible) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([contentName, state.config.workspace.label]) }
      })
    }
  }

  buildBreadcrumbs = async content => {
    try {
      const contentBreadcrumbsList = await buildContentPathBreadcrumbs(this.state.config.apiUrl, content)
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.APPEND_BREADCRUMBS,
        data: {
          breadcrumbs: contentBreadcrumbsList
        }
      })
      const space = {
        link: PAGE.WORKSPACE.DASHBOARD(content.workspace_id),
        label: this.state.config.workspace.label,
        type: BREADCRUMBS_TYPE.CORE,
        isALink: true
      }
      this.setState({ breadcrumbsList: [space, ...contentBreadcrumbsList] })
    } catch (e) {
      console.error('Error in app html-document, count not build breadcrumbs', e)
    }
  }

  loadHtmlDocument = async () => {
    const { state } = this

    this.setState({ loadingContent: true, mode: APP_FEATURE_MODE.VIEW })
    const resHtmlDocument = await handleFetchResult(await getHtmlDocContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id))

    const localStorageRawContent = getLocalStorageItem(
      state.appName,
      resHtmlDocument.body.content_id,
      resHtmlDocument.body.workspace_id,
      LOCAL_STORAGE_FIELD.RAW_CONTENT
    )

    const hasLocalStorageRawContent = !!localStorageRawContent
    const rawContentWithExternalLinkIcons = addExternalLinksIcons(resHtmlDocument.body.raw_content)

    const rawContentBeforeEdit = addClassToMentionsOfUser(rawContentWithExternalLinkIcons, state.loggedUser.username)

    // first time editing the doc, open in edit mode, unless it has been created with webdav or db imported from tracim v1
    // see https://github.com/tracim/tracim/issues/1206
    // @fixme Côme - 2018/12/04 - this might not be a great idea
    const modeToRender = (
      resHtmlDocument.body.current_revision_type === 'creation' && // if content has only one revision
      state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && // if user has EDIT authorization
      resHtmlDocument.body.raw_content === '' // has content been created with raw_content (means it's from webdav or import db)
    )
      ? APP_FEATURE_MODE.EDIT
      : APP_FEATURE_MODE.VIEW

    const knownMentions = state.config.workspace.memberList.map(member => `@${member.username}`)
    const oldInvalidMentionList = getInvalidMentionList(rawContentBeforeEdit, knownMentions)

    this.setState(previousState => ({
      mode: modeToRender,
      content: {
        ...resHtmlDocument.body,
        raw_content: modeToRender === APP_FEATURE_MODE.EDIT && hasLocalStorageRawContent
          ? localStorageRawContent
          : rawContentBeforeEdit
      },
      isTemplate: resHtmlDocument.body.is_template,
      rawContentBeforeEdit: rawContentBeforeEdit,
      translationState: getDefaultTranslationState(previousState.config.system.config),
      translatedRawContent: null,
      oldInvalidMentionList: oldInvalidMentionList,
      loadingContent: false
    }))

    this.setHeadTitle(resHtmlDocument.body.label)
    this.buildBreadcrumbs(resHtmlDocument.body)
    await putHtmlDocRead(state.config.apiUrl, state.loggedUser, state.content.workspace_id, state.content.content_id) // mark as read after all requests are finished
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} }) // await above makes sure that we will reload workspace content after the read status update
  }

  loadContent = () => {
    const { state } = this
    this.loadHtmlDocument()
    this.props.loadTimeline(getHtmlDocRevision, this.state.content)
    if (state.config.toDoEnabled) this.props.getToDoList(this.setState.bind(this), state.content.workspace_id, state.content.content_id)
  }

  handleLoadMoreTimelineItems = async () => {
    const { props } = this

    if (this.isLoadMoreTimelineInProgress) return

    this.isLoadMoreTimelineInProgress = true
    await props.loadMoreTimelineItems(getHtmlDocRevision)
    this.isLoadMoreTimelineInProgress = false
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
  }

  handleChangeMarkedTemplate = (isTemplate) => {
    const { props, state } = this
    props.appContentMarkAsTemplate(this.setState.bind(this), state.content, isTemplate)
  }

  handleClickNewVersion = () => {
    const previouslyUnsavedRawContent = getLocalStorageItem(
      this.state.appName,
      this.state.content.content_id,
      this.state.content.workspace_id,
      LOCAL_STORAGE_FIELD.RAW_CONTENT
    )

    this.setState(prev => ({
      content: {
        ...prev.content,
        raw_content: previouslyUnsavedRawContent || prev.content.raw_content
      },
      rawContentBeforeEdit: prev.content.raw_content, // for cancel btn
      mode: APP_FEATURE_MODE.EDIT
    }))
  }

  handleCloseNewVersion = () => {
    tinymceRemove('#wysiwygNewVersion')

    this.setState(prev => ({
      content: {
        ...prev.content,
        raw_content: prev.rawContentBeforeEdit
      },
      mode: APP_FEATURE_MODE.VIEW
    }))

    removeLocalStorageItem(
      this.state.appName,
      this.state.content.content_id,
      this.state.content.workspace_id,
      LOCAL_STORAGE_FIELD.RAW_CONTENT
    )
  }

  handleClickSaveDocument = async () => {
    const { state } = this
    const knownMentions = state.config.workspace.memberList.map(member => `@${member.username}`)
    const content = tinymce.activeEditor.getContent()
    const allInvalidMentionList = getInvalidMentionList(content, knownMentions)
    const newInvalidMentionList = allInvalidMentionList.filter(mention => {
      return state.oldInvalidMentionList.indexOf(mention) === -1
    })

    if (newInvalidMentionList.length > 0) {
      this.setState({
        invalidMentionList: newInvalidMentionList,
        showInvalidMentionPopupInContent: true
      })
    } else this.handleSaveHtmlDocument()
  }

  handleSaveHtmlDocument = async () => {
    const { state, props } = this

    const content = tinymce.activeEditor.getContent()
    const allInvalidMentionList = [...state.oldInvalidMentionList, ...state.invalidMentionList]

    let newDocumentForApiWithMention
    try {
      newDocumentForApiWithMention = handleMentionsBeforeSave(
        content,
        state.loggedUser.username,
        allInvalidMentionList
      )
    } catch (e) {
      sendGlobalFlashMessage(e.message || props.t('Error while saving the new version'))
      return
    }

    let newDocumentForApiWithMentionAndLink
    try {
      newDocumentForApiWithMentionAndLink = await handleLinksBeforeSave(newDocumentForApiWithMention, state.config.apiUrl)
    } catch (e) {
      return Promise.reject(e.message || props.t('Error while saving the new version'))
    }

    const fetchResultSaveHtmlDoc = await handleFetchResult(
      await putHtmlDocContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id, state.content.label, newDocumentForApiWithMentionAndLink)
    )

    switch (fetchResultSaveHtmlDoc.apiResponse.status) {
      case 200: {
        removeLocalStorageItem(
          state.appName,
          state.content.content_id,
          state.content.workspace_id,
          LOCAL_STORAGE_FIELD.RAW_CONTENT
        )

        state.loggedUser.config[`content.${state.content.content_id}.notify_all_members_message`] = true
        tinymceRemove('#wysiwygNewVersion')
        this.setState(previousState => {
          return {
            mode: APP_FEATURE_MODE.VIEW,
            content: {
              ...previousState.content,
              raw_content: addExternalLinksIcons(newDocumentForApiWithMentionAndLink)
            },
            oldInvalidMentionList: allInvalidMentionList,
            showInvalidMentionPopupInContent: false,
            translatedRawContent: null,
            translationState: getDefaultTranslationState(previousState.config.system.config)
          }
        })
        const fetchPutUserConfiguration = await handleFetchResult(
          await putUserConfiguration(state.config.apiUrl, state.loggedUser.userId, state.loggedUser.config)
        )
        if (fetchPutUserConfiguration.status !== 204) {
          sendGlobalFlashMessage(props.t('Error while saving the user configuration'))
        }
        break
      }
      case 400:
        switch (fetchResultSaveHtmlDoc.body.code) {
          case 2067:
            sendGlobalFlashMessage(props.t('You are trying to mention an invalid user'))
            break
          case 2044:
            sendGlobalFlashMessage(props.t('You must change the status or restore this note before any change'))
            break
          default:
            sendGlobalFlashMessage(props.t('Error while saving the new version'))
            break
        }
        break
      default:
        sendGlobalFlashMessage(props.t('Error while saving the new version'))
        break
    }
    window.history.replaceState(null, '', PAGE.WORKSPACE.CONTENT(state.content.workspace_id, state.content.content_type, state.content.content_id))
  }

  searchForMentionOrLinkInQuery = async (query) => {
    return await this.props.searchForMentionOrLinkInQuery(query, this.state.content.workspace_id)
  }

  handleClickValidateAnywayNewComment = (comment, commentAsFileList) => {
    const { props, state } = this
    try {
      props.appContentSaveNewComment(
        state.content,
        state.timelineWysiwyg,
        comment,
        commentAsFileList,
        this.setState.bind(this),
        state.config.slug,
        state.loggedUser.username
      )
    } catch (e) {
      sendGlobalFlashMessage(e.message || props.t('Error while saving the comment'))
    }
  }

  handleClickValidateNewCommentBtn = (comment, commentAsFileList) => {
    const { state } = this

    if (!handleInvalidMentionInComment(
      state.config.workspace.memberList,
      state.timelineWysiwyg,
      comment,
      this.setState.bind(this)
    )) {
      this.handleClickValidateAnywayNewComment(comment, commentAsFileList)
      return true
    }
    return false
  }

  handleToggleWysiwyg = () => this.setState(prev => ({ timelineWysiwyg: !prev.timelineWysiwyg }))

  handleSaveEditTitle = async newTitle => {
    const { props, state } = this
    props.appContentChangeTitle(state.content, newTitle, state.config.slug)
  }

  handleChangeStatus = async newStatus => {
    const { props, state } = this
    props.appContentChangeStatus(state.content, newStatus, state.config.slug)
  }

  handleClickDelete = async () => {
    const { props, state } = this
    props.appContentDelete(state.content, this.setState.bind(this), state.config.slug)
  }

  // INFO - CH - 2019-05-24 - last path param revision_id is to force browser to not use cache when we upload new revision
  // see https://github.com/tracim/tracim/issues/1804
  getDownloadPDFUrl = ({ config: { apiUrl }, content, mode }) => {
    // FIXME - b.l - refactor urls
    const label = content.label ? encodeURIComponent(content.label + '.pdf') : 'unknown.pdf'
    const urlRevisionPart = mode === APP_FEATURE_MODE.REVISION ? `revisions/${content.current_revision_id}/` : ''
    return `${apiUrl}/workspaces/${content.workspace_id}/html-documents/${content.content_id}/${urlRevisionPart}preview/pdf/full/${label}?force_download=1&revision_id=${content.current_revision_id}`
  }

  handleClickRestoreDelete = async () => {
    const { props, state } = this
    props.appContentRestoreDelete(state.content, this.setState.bind(this), state.config.slug)
  }

  // INFO - G.B. - 2020-05-20 - For now, we decide to hide the archive function - https://github.com/tracim/tracim/issues/2347
  // handleClickArchive = async () => {
  //   const { props, state } = this
  //   props.appContentArchive(state.content, this.setState.bind(this), state.config.slug)
  // }
  // handleClickRestoreArchive = async () => {
  //   const { props, state } = this
  //   props.appContentRestoreArchive(state.content, this.setState.bind(this), state.config.slug)
  // }

  handleClickShowRevision = revision => {
    const { state, props } = this

    const revisionArray = props.timeline.filter(t => t.timelineType === 'revision')
    const isLastRevision = revision.revision_id === revisionArray[revisionArray.length - 1].revision_id

    if (state.mode === APP_FEATURE_MODE.REVISION && isLastRevision) {
      this.handleClickLastVersion()
      return
    }

    if (state.mode === APP_FEATURE_MODE.VIEW && isLastRevision) return

    this.setState(previousState => {
      return {
        content: {
          ...previousState.content,
          label: revision.label,
          raw_content: revision.raw_content,
          status: revision.status,
          current_revision_id: revision.revision_id,
          is_archived: previousState.is_archived, // archived and delete should always be taken from last version
          is_deleted: previousState.is_deleted
        },
        translationState: getDefaultTranslationState(previousState.config.system.config),
        translatedRawContent: null,
        mode: APP_FEATURE_MODE.REVISION
      }
    })
  }

  handleClickLastVersion = () => {
    if (this.state.showRefreshWarning) {
      this.handleClickRefresh()
      return
    }

    this.loadContent()
    this.setState({ mode: APP_FEATURE_MODE.VIEW })
  }

  handleClickRefresh = () => {
    const { state } = this
    tinymceRemove('#wysiwygNewVersion')

    const newObjectContent = {
      ...state.content,
      ...state.newContent,
      raw_content: state.rawContentBeforeEdit
    }

    this.setState(previousState => {
      return {
        content: newObjectContent,
        mode: APP_FEATURE_MODE.VIEW,
        showRefreshWarning: false,
        translatedRawContent: null,
        translationState: getDefaultTranslationState(previousState.config.system.config)
      }
    })
    this.setHeadTitle(newObjectContent.label)
    this.buildBreadcrumbs(newObjectContent)
  }

  handleCloseNotifyAllMessage = async () => {
    const { state, props } = this
    const newConfiguration = state.loggedUser.config
    newConfiguration[`content.${state.content.content_id}.notify_all_members_message`] = false

    this.setState(prev => ({
      ...prev,
      loggedUser: {
        ...prev.loggedUser,
        config: newConfiguration
      }
    }))

    const fetchPutUserConfiguration = await handleFetchResult(
      await putUserConfiguration(state.config.apiUrl, state.loggedUser.userId, newConfiguration)
    )
    if (fetchPutUserConfiguration.status !== 204) {
      sendGlobalFlashMessage(props.t('Error while saving the user configuration'))
    }
  }

  handleCancelSave = () => this.setState({ showInvalidMentionPopupInContent: false, showInvalidMentionPopupInComment: false })

  handleSaveNewToDo = (assignedUserId, toDo) => {
    const { state, props } = this
    props.appContentSaveNewToDo(state.content.workspace_id, state.content.content_id, assignedUserId, toDo, this.setState.bind(this))
    this.setState({ showProgress: true })
  }

  handleDeleteToDo = (toDo) => {
    const { state, props } = this
    props.appContentDeleteToDo(
      state.content.workspace_id,
      state.content.content_id,
      toDo.content_id,
      this.setState.bind(this),
      state.lockedToDoList
    )
  }

  handleChangeStatusToDo = (toDo, status) => {
    const { state, props } = this
    props.appContentChangeStatusToDo(
      state.content.workspace_id,
      state.content.content_id,
      toDo.content_id,
      status,
      this.setState.bind(this),
      state.lockedToDoList
    )
  }

  setShowProgressBarStatus = (showProgressStatus) => {
    this.setState({ showProgress: showProgressStatus })
  }

  handleClickNotifyAll = async () => {
    const { state, props } = this

    props.appContentNotifyAll(state.content, this.setState.bind(this), state.config.slug)
    this.handleCloseNotifyAllMessage()
  }

  handleClickCopyLink = () => {
    const { props, state } = this
    handleClickCopyLink(state.content.content_id)
    sendGlobalFlashMessage(props.t('The link has been copied to clipboard'), 'info')
  }

  shouldDisplayNotifyAllMessage = () => {
    const { state } = this

    const lastModifierIsLoggedUser = (content) => {
      return content.last_modifier && content.last_modifier.user_id === state.loggedUser.userId
    }

    if (
      !state.loggedUser.config ||
      state.content.current_revision_type === 'creation' ||
      !lastModifierIsLoggedUser(state.newContent) ||
      (!state.newContent.last_modifier && !lastModifierIsLoggedUser(state.content)) ||
      state.mode !== APP_FEATURE_MODE.VIEW
    ) return false

    return !!state.loggedUser.config[`content.${state.content.content_id}.notify_all_members_message`]
  }

  handleClickEditComment = (comment) => {
    const { props, state } = this
    props.appContentEditComment(
      state.content.workspace_id,
      comment.parent_id,
      comment.content_id,
      state.loggedUser.username
    )
  }

  handleClickDeleteComment = async (comment) => {
    const { state } = this
    this.props.appContentDeleteComment(
      state.content.workspace_id,
      comment.parent_id,
      comment.content_id
    )
  }

  handleClickOpenFileComment = (comment) => {
    const { state } = this
    state.config.history.push(PAGE.WORKSPACE.CONTENT(
      state.content.workspace_id,
      CONTENT_TYPE.FILE,
      comment.content_id
    ))
  }

  handleTranslateDocument = (languageCode = null) => {
    const { state } = this
    handleTranslateHtmlContent(
      state.config.apiUrl,
      state.content.workspace_id,
      state.content.content_id,
      state.content.current_revision_id,
      languageCode || state.translationTargetLanguageCode,
      state.config.system.config,
      ({ translatedRawContent = state.translatedRawContent, translationState }) => {
        this.setState({ translatedRawContent, translationState })
      }
    )
  }

  handleRestoreDocument = () => {
    this.setState(prev => ({
      translationState: getDefaultTranslationState(prev.config.system.config)
    }))
  }

  handleChangeTranslationTargetLanguageCode = (translationTargetLanguageCode) => {
    this.setState({ translationTargetLanguageCode })
  }

  getMenuItemList = () => {
    const { props, state } = this
    const timelineObject = {
      id: 'timeline',
      label: props.t('Timeline'),
      icon: 'fa-history',
      children: state.config.apiUrl ? (
        <PopinFixedRightPartContent
          label={props.t('Timeline')}
        >
          <Timeline
            contentId={state.content.content_id}
            contentType={state.content.content_type}
            loading={props.loadingTimeline}
            customClass={`${state.config.slug}__contentpage__timeline`}
            customColor={state.config.hexcolor}
            apiUrl={state.config.apiUrl}
            loggedUser={state.loggedUser}
            timelineData={props.timeline}
            memberList={state.config.workspace.memberList}
            disableComment={state.mode === APP_FEATURE_MODE.REVISION || state.mode === APP_FEATURE_MODE.EDIT || !state.content.is_editable}
            availableStatusList={state.config.availableStatuses}
            wysiwyg={state.timelineWysiwyg}
            onClickValidateNewCommentBtn={this.handleClickValidateNewCommentBtn}
            onClickWysiwygBtn={this.handleToggleWysiwyg}
            onClickRevisionBtn={this.handleClickShowRevision}
            shouldScrollToBottom={state.mode !== APP_FEATURE_MODE.REVISION}
            isLastTimelineItemCurrentToken={props.isLastTimelineItemCurrentToken}
            key='Timeline'
            invalidMentionList={state.invalidMentionList}
            onClickCancelSave={this.handleCancelSave}
            onClickSaveAnyway={this.handleClickValidateAnywayNewComment}
            wysiwygIdSelector='#wysiwygTimelineComment'
            showInvalidMentionPopup={state.showInvalidMentionPopupInComment}
            searchForMentionOrLinkInQuery={this.searchForMentionOrLinkInQuery}
            workspaceId={state.content.workspace_id}
            onClickTranslateComment={(comment, languageCode = null) => props.handleTranslateComment(
              comment,
              state.content.workspace_id,
              languageCode || state.translationTargetLanguageCode
            )}
            onClickRestoreComment={props.handleRestoreComment}
            onClickEditComment={this.handleClickEditComment}
            onClickDeleteComment={this.handleClickDeleteComment}
            onClickOpenFileComment={this.handleClickOpenFileComment}
            translationTargetLanguageList={state.config.system.config.translation_service__target_languages}
            translationTargetLanguageCode={state.translationTargetLanguageCode}
            onChangeTranslationTargetLanguageCode={this.handleChangeTranslationTargetLanguageCode}
            onClickShowMoreTimelineItems={this.handleLoadMoreTimelineItems}
            canLoadMoreTimelineItems={props.canLoadMoreTimelineItems}
            isFileCommentLoading={state.isFileCommentLoading}
          />
        </PopinFixedRightPartContent>
      ) : null
    }

    const menuItemList = [timelineObject]

    if (state.config.toDoEnabled) {
      const toDoObject = {
        id: 'todo',
        label: props.t('Tasks'),
        icon: 'fas fa-check-square',
        children: (
          <PopinFixedRightPartContent
            label={props.t('Tasks')}
            toDoList={state.toDoList}
            showProgress={state.showProgress}
          >
            <ToDoManagement
              apiUrl={state.config.apiUrl}
              contentId={state.content.content_id}
              customColor={state.config.hexcolor}
              lockedToDoList={state.lockedToDoList}
              memberList={state.config.workspace.memberList}
              onClickChangeStatusToDo={this.handleChangeStatusToDo}
              onClickDeleteToDo={this.handleDeleteToDo}
              onClickSaveNewToDo={this.handleSaveNewToDo}
              displayProgressBarStatus={this.setShowProgressBarStatus}
              user={state.loggedUser}
              toDoList={state.toDoList}
              workspaceId={state.content.workspace_id}
            />
          </PopinFixedRightPartContent>
        )
      }
      menuItemList.push(toDoObject)
    }

    const tagObject = {
      id: 'tag',
      label: props.t('Tags'),
      icon: 'fas fa-tag',
      children: (
        <PopinFixedRightPartContent
          label={props.t('Tags')}
        >
          <TagList
            apiUrl={state.config.apiUrl}
            workspaceId={state.content.workspace_id}
            contentId={state.content.content_id}
            userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
            userProfile={state.loggedUser.profile}
          />
        </PopinFixedRightPartContent>
      )
    }
    menuItemList.push(tagObject)

    return menuItemList
  }

  render () {
    const { props, state } = this

    if (!state.isVisible) return null

    const displayTranslatedText = (
      state.mode !== APP_FEATURE_MODE.EDIT &&
      state.translationState === TRANSLATION_STATE.TRANSLATED
    )

    const revisionList = props.timeline.filter(t => t.timelineType === 'revision')
    const contentVersionNumber = (revisionList.find(t => t.revision_id === state.content.current_revision_id) || { version_number: 1 }).version_number
    const lastVersionNumber = (revisionList[revisionList.length - 1] || { version_number: 1 }).version_number

    return (
      <PopinFixed
        customClass={`${state.config.slug}`}
        customColor={state.config.hexcolor}
      >
        <PopinFixedContent
          actionList={[
            {
              icon: 'far fa-file-pdf',
              label: props.t('Download as PDF'),
              downloadLink: this.getDownloadPDFUrl(state),
              showAction: true,
              dataCy: 'popinListItem__downloadAsPdf'
            }, {
              icon: 'fas fa-link',
              label: props.t('Copy content link'),
              onClick: this.handleClickCopyLink,
              showAction: true,
              dataCy: 'popinListItem__copyLink'
            }, {
              icon: 'far fa-trash-alt',
              label: props.t('Delete'),
              onClick: this.handleClickDelete,
              showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id,
              disabled: state.mode === APP_FEATURE_MODE.REVISION || state.content.is_archived || state.content.is_deleted,
              dataCy: 'popinListItem__delete'
            }
          ]}
          appMode={state.mode}
          availableStatuses={state.config.availableStatuses}
          breadcrumbsList={state.breadcrumbsList}
          componentTitle={<FilenameWithBadges file={state.content} isTemplate={state.isTemplate} />}
          content={state.content}
          config={state.config}
          contentVersionNumber={contentVersionNumber}
          customClass={state.mode === APP_FEATURE_MODE.EDIT ? `${state.config.slug}__contentpage__edition` : `${state.config.slug}__contentpage`}
          disableChangeIsTemplate={state.disableChangeIsTemplate}
          disableChangeTitle={!state.content.is_editable}
          headerButtons={[
            {
              dataCy: 'newVersionButton',
              disabled: state.mode !== APP_FEATURE_MODE.VIEW || !state.content.is_editable,
              icon: 'fas fa-edit',
              key: props.t('Edit'),
              label: props.t('Edit'),
              onClick: this.handleClickNewVersion,
              showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id
            }
          ]}
          isTemplate={state.isTemplate}
          isRefreshNeeded={state.showRefreshWarning}
          loading={state.loadingContent}
          lastVersion={lastVersionNumber}
          loggedUser={state.loggedUser}
          onChangeStatus={this.handleChangeStatus}
          onChangeTranslationTargetLanguageCode={this.handleChangeTranslationTargetLanguageCode}
          onClickChangeMarkedTemplate={this.handleChangeMarkedTemplate}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onClickRestoreDocument={this.handleRestoreDocument}
          onClickTranslateDocument={this.handleTranslateDocument}
          onValidateChangeTitle={this.handleSaveEditTitle}
          favoriteState={props.isContentInFavoriteList(state.content, state)
            ? FAVORITE_STATE.FAVORITE
            : FAVORITE_STATE.NOT_FAVORITE}
          onClickAddToFavoriteList={() => props.addContentToFavoriteList(
            state.content, state.loggedUser, this.setState.bind(this)
          )}
          onClickRemoveFromFavoriteList={() => props.removeContentFromFavoriteList(
            state.content, state.loggedUser, this.setState.bind(this)
          )}
          showReactions
          showTranslateButton={state.mode === APP_FEATURE_MODE.VIEW || state.mode === APP_FEATURE_MODE.REVISION}
          translationState={state.translationState}
          translationTargetLanguageList={state.config.system.config.translation_service__target_languages}
          translationTargetLanguageCode={state.translationTargetLanguageCode}
          showMarkedAsTemplate
        >
          {/*
            FIXME - GB - 2019-06-05 - we need to have a better way to check the state.config than using state.config.availableStatuses[3].slug
            https://github.com/tracim/tracim/issues/1840
          */}
          <HtmlDocumentComponent
            apiUrl={state.config.apiUrl}
            customColor={state.config.hexcolor}
            contentId={state.content.content_id}
            contentType={CONTENT_TYPE.HTML_DOCUMENT}
            disableValidateBtn={(content) => state.rawContentBeforeEdit === content}
            editionAuthor={state.editionAuthor}
            invalidMentionList={state.invalidMentionList}
            isVisible={state.isVisible}
            lang={state.loggedUser.lang}
            mode={state.mode}
            wysiwygNewVersion='wysiwygNewVersion'
            onClickCloseEditMode={this.handleCloseNewVersion}
            onClickValidateBtn={this.handleClickSaveDocument}
            text={displayTranslatedText ? state.translatedRawContent : state.content.raw_content}
            isArchived={state.content.is_archived}
            isDeleted={state.content.is_deleted}
            isDeprecated={state.content.status === state.config.availableStatuses[3].slug}
            deprecatedStatus={state.config.availableStatuses[3]}
            isDraftAvailable={state.mode === APP_FEATURE_MODE.VIEW && state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && getLocalStorageItem(state.appName, state.content.content_id, state.content.workspace_id, LOCAL_STORAGE_FIELD.RAW_CONTENT)}
            // onClickRestoreArchived={this.handleClickRestoreArchive}
            onClickRestoreDeleted={this.handleClickRestoreDelete}
            onClickShowDraft={this.handleClickNewVersion}
            key='html-document'
            isRefreshNeeded={state.showRefreshWarning}
            onClickAutoCompleteItem={(mention) => tinymceAutoCompleteHandleClickItem(mention, this.setState.bind(this))}
            displayNotifyAllMessage={this.shouldDisplayNotifyAllMessage()}
            onClickCloseNotifyAllMessage={this.handleCloseNotifyAllMessage}
            onClickNotifyAll={this.handleClickNotifyAll}
            onClickCancelSave={this.handleCancelSave}
            onClickSaveAnyway={this.handleSaveHtmlDocument}
            showInvalidMentionPopup={state.showInvalidMentionPopupInContent}
            onClickRefresh={this.handleClickRefresh}
            onClickLastVersion={this.handleClickLastVersion}
            searchForMentionOrLinkInQuery={this.searchForMentionOrLinkInQuery}
            workspaceId={state.content.workspace_id}
          />

          <PopinFixedRightPart
            customClass={`${state.config.slug}__contentpage`}
            customColor={state.config.hexcolor}
            menuItemList={this.getMenuItemList()}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(Radium(appContentFactory(HtmlDocument)))
