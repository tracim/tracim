import React from 'react'
import HtmlDocumentComponent from '../component/HtmlDocument.jsx'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  addRevisionFromTLM,
  APP_FEATURE_MODE,
  appContentFactory,
  BREADCRUMBS_TYPE,
  buildContentPathBreadcrumbs,
  buildHeadTitle,
  CONTENT_TYPE,
  CUSTOM_EVENT,
  getCurrentContentVersionNumber,
  getInvalidMentionList,
  getOrCreateSessionClientToken,
  handleFetchResult,
  handleInvalidMentionInComment,
  PAGE,
  PopinFixed,
  PopinFixedContent,
  PopinFixedRightPart,
  ROLE,
  Timeline,
  TagList,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent,
  tinymceAutoCompleteHandleInput,
  tinymceAutoCompleteHandleKeyUp,
  tinymceAutoCompleteHandleKeyDown,
  tinymceAutoCompleteHandleClickItem,
  tinymceAutoCompleteHandleSelectionChange,
  LOCAL_STORAGE_FIELD,
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
  getContentComment,
  getFileChildContent,
  handleMentionsBeforeSave,
  handleLinksBeforeSave,
  addClassToMentionsOfUser,
  putUserConfiguration,
  permissiveNumberEqual,
  TRANSLATION_STATE,
  handleTranslateHtmlContent,
  getDefaultTranslationState,
  FAVORITE_STATE
} from 'tracim_frontend_lib'
import { debug } from '../debug.js'
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

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)
    this.state = {
      appName: 'html-document',
      breadcrumbsList: [],
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      externalTranslationList: [
        props.t('Note'),
        props.t('Notes'),
        props.t('note'),
        props.t('notes'),
        props.t('Write a note')
      ],
      displayNewTagForm: false,
      rawContentBeforeEdit: '',
      timeline: [],
      newComment: '',
      newCommentAsFileList: [],
      newContent: {},
      timelineWysiwyg: false,
      mode: APP_FEATURE_MODE.VIEW,
      showRefreshWarning: false,
      editionAuthor: '',
      isLastTimelineItemCurrentToken: false,
      isAutoCompleteActivated: false,
      autoCompleteCursorPosition: 0,
      autoCompleteItemList: [],
      invalidMentionList: [],
      oldInvalidMentionList: [],
      showInvalidMentionPopupInComment: false,
      showInvalidMentionPopupInContent: false,
      translatedRawContent: null,
      translationState: TRANSLATION_STATE.DISABLED,
      translationTargetLanguageCode: param.loggedUser.lang
    }
    this.sessionClientToken = getOrCreateSessionClientToken()

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
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommentModified },
      // INFO - CH - 20210322 - handler below is to handle the addition of comment as file
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCommentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCommentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentDeletedOrRestore },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentDeletedOrRestore },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModified }
    ])
  }

  // TLM Handlers
  handleContentModified = data => {
    const { state } = this
    if (data.fields.content.content_id !== state.content.content_id) return

    const clientToken = state.config.apiHeader['X-Tracim-ClientToken']
    const newContentObject = {
      ...state.content,
      ...data.fields.content,
      raw_content: addClassToMentionsOfUser(data.fields.content.raw_content, state.loggedUser.username)
    }
    this.setState(prev => ({
      ...prev,
      content: clientToken === data.fields.client_token
        ? newContentObject
        : { ...prev.content, number: getCurrentContentVersionNumber(prev.mode, prev.content, prev.timeline) },
      newContent: newContentObject,
      editionAuthor: data.fields.author.public_name,
      showRefreshWarning: clientToken !== data.fields.client_token,
      rawContentBeforeEdit: newContentObject.raw_content,
      timeline: addRevisionFromTLM(data.fields, prev.timeline, prev.loggedUser.lang, data.fields.client_token === this.sessionClientToken),
      isLastTimelineItemCurrentToken: data.fields.client_token === this.sessionClientToken
    }))
    if (clientToken === data.fields.client_token) {
      this.setHeadTitle(newContentObject.label)
      this.buildBreadcrumbs(newContentObject)
    }
  }

  handleContentCommentCreated = (tlm) => {
    const { props, state } = this
    // Not a comment for our content
    if (!permissiveNumberEqual(tlm.fields.content.parent_id, state.content.content_id)) return

    const createdByLoggedUser = tlm.fields.client_token === this.sessionClientToken
    const newTimeline = props.addCommentToTimeline(tlm.fields.content, state.timeline, state.loggedUser, createdByLoggedUser, getDefaultTranslationState(state.config.system.config))
    this.setState({
      timeline: newTimeline,
      isLastTimelineItemCurrentToken: createdByLoggedUser
    })
  }

  handleContentDeletedOrRestore = data => {
    const { state } = this
    if (data.fields.content.content_id !== state.content.content_id) return

    const clientToken = state.config.apiHeader['X-Tracim-ClientToken']
    this.setState(prev => ({
      ...prev,
      content: clientToken === data.fields.client_token
        ? { ...prev.content, ...data.fields.content }
        : { ...prev.content, number: getCurrentContentVersionNumber(prev.mode, prev.content, prev.timeline) },
      newContent: { ...prev.content, ...data.fields.content },
      editionAuthor: data.fields.author.public_name,
      showRefreshWarning: clientToken !== data.fields.client_token,
      timeline: addRevisionFromTLM(data.fields, prev.timeline, prev.loggedUser.lang, data.fields.client_token === this.sessionClientToken),
      isLastTimelineItemCurrentToken: data.fields.client_token === this.sessionClientToken
    }))
  }

  handleUserModified = data => {
    const newTimeline = this.state.timeline.map(timelineItem => timelineItem.author.user_id === data.fields.user.user_id
      ? { ...timelineItem, author: data.fields.user }
      : timelineItem
    )

    this.setState({ timeline: newTimeline })
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
    globalThis.tinymce.remove('#wysiwygNewVersion')
  }

  handleReloadContent = data => {
    const { props, state } = this
    console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_CONTENT, data)

    props.appContentCustomEventHandlerReloadContent(data, this.setState.bind(this), state.appName)
    globalThis.tinymce.remove('#wysiwygNewVersion')
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)

    this.reloadContentWysiwyg()
    this.props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, false)
    this.loadContent()
  }

  reloadContentWysiwyg () {
    if (!document.getElementById('wysiwygNewVersion') || this.state.mode !== APP_FEATURE_MODE.EDIT) return
    globalThis.tinymce.remove('#wysiwygNewVersion')
    globalThis.wysiwyg('#wysiwygNewVersion',
      this.state.loggedUser.lang,
      this.handleChangeText,
      this.handleTinyMceInput,
      this.handleTinyMceKeyDown,
      this.handleTinyMceKeyUp,
      this.handleTinyMceSelectionChange
    )
  }

  async componentDidMount () {
    console.log('%c<HtmlDocument> did mount', `color: ${this.state.config.hexcolor}`)
    await this.loadContent()
    this.props.loadFavoriteContentList(this.state.loggedUser, this.setState.bind(this))
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    const becameVisible = !prevState.isVisible && state.isVisible

    // console.log('%c<HtmlDocument> did update', `color: ${state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) {
      await this.loadContent()
      this.reloadContentWysiwyg()
    }

    if (state.mode === APP_FEATURE_MODE.EDIT && (becameVisible || prevState.mode !== APP_FEATURE_MODE.EDIT)) {
      globalThis.tinymce.remove('#wysiwygTimelineComment')
      this.reloadContentWysiwyg()
    }

    if (!prevState.timelineWysiwyg && state.timelineWysiwyg) {
      globalThis.tinymce.remove('#wysiwygNewVersion')
    } else if (prevState.timelineWysiwyg && !state.timelineWysiwyg) {
      globalThis.tinymce.remove('#wysiwygTimelineComment')
    }
  }

  handleInitTimelineCommentWysiwyg = (handleTinyMceInput, handleTinyMceKeyDown, handleTinyMceKeyUp, handleTinyMceSelectionChange) => {
    globalThis.wysiwyg(
      '#wysiwygTimelineComment',
      this.state.loggedUser.lang,
      this.handleChangeNewComment,
      handleTinyMceInput,
      handleTinyMceKeyDown,
      handleTinyMceKeyUp,
      handleTinyMceSelectionChange
    )
  }

  handleTinyMceInput = (e, position) => {
    tinymceAutoCompleteHandleInput(
      e,
      (state) => { this.setState({ ...state, tinymcePosition: position }) },
      this.searchForMentionOrLinkInQuery,
      this.state.isAutoCompleteActivated
    )
  }

  handleTinyMceSelectionChange = (e, position) => {
    tinymceAutoCompleteHandleSelectionChange(
      (state) => { this.setState({ ...state, tinymcePosition: position }) },
      this.searchForMentionOrLinkInQuery,
      this.state.isAutoCompleteActivated
    )
  }

  handleTinyMceKeyUp = event => {
    const { state } = this

    tinymceAutoCompleteHandleKeyUp(
      event,
      this.setState.bind(this),
      state.isAutoCompleteActivated,
      this.searchForMentionOrLinkInQuery
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
      this.searchForMentionOrLinkInQuery
    )
  }

  componentWillUnmount () {
    console.log('%c<HtmlDocument> will Unmount', `color: ${this.state.config.hexcolor}`)
    globalThis.tinymce.remove('#wysiwygNewVersion')
    globalThis.tinymce.remove('#wysiwygTimelineComment')
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

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

  loadContent = async () => {
    const { props, state } = this

    const fetchResultHtmlDocument = getHtmlDocContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    const fetchResultComment = getContentComment(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    const fetchResultFileChildContent = getFileChildContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    const fetchResultRevision = getHtmlDocRevision(state.config.apiUrl, state.content.workspace_id, state.content.content_id)

    const [resHtmlDocument, resComment, resCommentAsFile, resRevision] = await Promise.all([
      handleFetchResult(await fetchResultHtmlDocument),
      handleFetchResult(await fetchResultComment),
      handleFetchResult(await fetchResultFileChildContent),
      handleFetchResult(await fetchResultRevision)
    ])

    const revisionWithComment = props.buildTimelineFromCommentAndRevision(
      resComment.body,
      resCommentAsFile.body.items,
      resRevision.body,
      state.loggedUser,
      getDefaultTranslationState(state.config.system.config)
    )

    const localStorageComment = getLocalStorageItem(
      state.appName,
      resHtmlDocument.body,
      LOCAL_STORAGE_FIELD.COMMENT
    )

    // first time editing the doc, open in edit mode, unless it has been created with webdav or db imported from tracim v1
    // see https://github.com/tracim/tracim/issues/1206
    // @fixme Côme - 2018/12/04 - this might not be a great idea
    const modeToRender = (
      resRevision.body.length === 1 && // if content has only one revision
      state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && // if user has EDIT authorization
      resRevision.body[0].raw_content === '' // has content been created with raw_content (means it's from webdav or import db)
    )
      ? APP_FEATURE_MODE.EDIT
      : APP_FEATURE_MODE.VIEW

    const localStorageRawContent = getLocalStorageItem(
      state.appName,
      resHtmlDocument.body,
      LOCAL_STORAGE_FIELD.RAW_CONTENT
    )

    const hasLocalStorageRawContent = !!localStorageRawContent

    const rawContentBeforeEdit = addClassToMentionsOfUser(resHtmlDocument.body.raw_content, state.loggedUser.username)
    this.setState(previousState => {
      return {
        mode: modeToRender,
        content: {
          ...resHtmlDocument.body,
          raw_content: modeToRender === APP_FEATURE_MODE.EDIT && hasLocalStorageRawContent
            ? localStorageRawContent
            : rawContentBeforeEdit
        },
        newComment: localStorageComment || '',
        rawContentBeforeEdit: rawContentBeforeEdit,
        timeline: revisionWithComment,
        isLastTimelineItemCurrentToken: false,
        translationState: getDefaultTranslationState(previousState.config.system.config),
        translatedRawContent: null
      }
    })

    this.setHeadTitle(resHtmlDocument.body.label)
    this.buildBreadcrumbs(resHtmlDocument.body)
    await putHtmlDocRead(state.config.apiUrl, state.loggedUser, state.content.workspace_id, state.content.content_id) // mark as read after all requests are finished
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} }) // await above makes sure that we will reload workspace content after the read status update
    const knownMentions = state.config.workspace.memberList.map(member => `@${member.username}`)
    const oldInvalidMentionList = getInvalidMentionList(rawContentBeforeEdit, knownMentions)
    this.setState({ oldInvalidMentionList: oldInvalidMentionList })
  }

  loadTimeline = () => {
    // INFO - CH - 2019-01-03 - this function must exists to match app content interface. Although it isn't used here because
    // we need some timeline data to initialize the app in loadContent(). So the timeline generation is handled by loadContent()
    // The data required to initialize is the number of revisions and whether the first revision has raw_content === '' or not
    // this is used to know whether we should open the app in EDIT or VIEW mode. See modeToRender in function loadContent()
    return true
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
  }

  handleClickNewVersion = () => {
    const previouslyUnsavedRawContent = getLocalStorageItem(this.state.appName, this.state.content, LOCAL_STORAGE_FIELD.RAW_CONTENT)

    this.setState(prev => ({
      content: {
        ...prev.content,
        raw_content: previouslyUnsavedRawContent || prev.content.raw_content
      },
      rawContentBeforeEdit: prev.content.raw_content, // for cancel btn
      mode: APP_FEATURE_MODE.EDIT
    }))
  }

  handleToggleAddTagForm = () => this.setState(prev => ({ displayNewTagForm: !prev.displayNewTagForm }))

  handleCloseNewVersion = () => {
    globalThis.tinymce.remove('#wysiwygNewVersion')

    this.setState(prev => ({
      content: {
        ...prev.content,
        raw_content: prev.rawContentBeforeEdit
      },
      mode: APP_FEATURE_MODE.VIEW
    }))

    removeLocalStorageItem(
      this.state.appName,
      this.state.content,
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
      this.sendGlobalFlashMessage(e.message || props.t('Error while saving the new version'))
      return
    }

    let newDocumentForApiWithMentionAndLink
    try {
      newDocumentForApiWithMentionAndLink = handleLinksBeforeSave(newDocumentForApiWithMention)
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
          state.content,
          LOCAL_STORAGE_FIELD.RAW_CONTENT
        )

        state.loggedUser.config[`content.${state.content.content_id}.notify_all_members_message`] = true
        globalThis.tinymce.remove('#wysiwygNewVersion')
        this.setState(previousState => {
          return {
            mode: APP_FEATURE_MODE.VIEW,
            content: {
              ...previousState.content,
              raw_content: newDocumentForApiWithMentionAndLink
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
          this.sendGlobalFlashMessage(props.t('Error while saving the user configuration'))
        }
        break
      }
      case 400:
        switch (fetchResultSaveHtmlDoc.body.code) {
          case 2067:
            this.sendGlobalFlashMessage(props.t('You are trying to mention an invalid user'))
            break
          case 2044:
            this.sendGlobalFlashMessage(props.t('You must change the status or restore this note before any change'))
            break
          default:
            this.sendGlobalFlashMessage(props.t('Error while saving the new version'))
            break
        }
        break
      default:
        this.sendGlobalFlashMessage(props.t('Error while saving the new version'))
        break
    }
  }

  handleChangeText = e => {
    const newText = e.target.value // because SyntheticEvent is pooled (react specificity)
    this.setState(prev => ({ content: { ...prev.content, raw_content: newText } }))

    setLocalStorageItem(this.state.appName, this.state.content, LOCAL_STORAGE_FIELD.RAW_CONTENT, newText)
  }

  handleChangeNewComment = e => {
    const { props, state } = this
    props.appContentChangeComment(e, state.content, this.setState.bind(this), state.appName)
  }

  handleAddCommentAsFile = fileToUploadList => {
    this.props.appContentAddCommentAsFile(fileToUploadList, this.setState.bind(this))
  }

  handleRemoveCommentAsFile = fileToRemove => {
    this.props.appContentRemoveCommentAsFile(fileToRemove, this.setState.bind(this))
  }

  searchForMentionOrLinkInQuery = async (query) => {
    return await this.props.searchForMentionOrLinkInQuery(query, this.state.content.workspace_id)
  }

  handleClickValidateAnywayNewComment = () => {
    const { props, state } = this
    try {
      props.appContentSaveNewComment(
        state.content,
        state.timelineWysiwyg,
        state.newComment,
        state.newCommentAsFileList,
        this.setState.bind(this),
        state.config.slug,
        state.loggedUser.username
      )
    } catch (e) {
      this.sendGlobalFlashMessage(e.message || props.t('Error while saving the comment'))
    }
  }

  handleClickValidateNewCommentBtn = async () => {
    const { state } = this

    if (!handleInvalidMentionInComment(
      state.config.workspace.memberList,
      state.timelineWysiwyg,
      state.newComment,
      this.setState.bind(this)
    )) {
      this.handleClickValidateAnywayNewComment()
    }
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
    const { state } = this

    const revisionArray = state.timeline.filter(t => t.timelineType === 'revision')
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
          number: revision.number,
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
    globalThis.tinymce.remove('#wysiwygNewVersion')

    const newObjectContent = {
      ...state.content,
      ...state.newContent,
      raw_content: state.rawContentBeforeEdit
    }

    this.setState(previousState => {
      return {
        content: newObjectContent,
        timeline: previousState.timeline.map(timelineItem => ({ ...timelineItem, hasBeenRead: true })),
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
      this.sendGlobalFlashMessage(props.t('Error while saving the user configuration'))
    }
  }

  handleCancelSave = () => this.setState({ showInvalidMentionPopupInContent: false, showInvalidMentionPopupInComment: false })

  handleClickNotifyAll = async () => {
    const { state, props } = this

    props.appContentNotifyAll(state.content, this.setState.bind(this), state.config.slug)
    this.handleCloseNotifyAllMessage()
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

  handleContentCommentModified = (data) => {
    const { props, state } = this
    if (data.fields.content.parent_id !== state.content.content_id) return
    const newTimeline = props.updateCommentOnTimeline(
      data.fields.content,
      state.timeline,
      state.loggedUser.username
    )
    this.setState({ timeline: newTimeline })
  }

  handleContentCommentDeleted = (data) => {
    const { props, state } = this
    if (data.fields.content.parent_id !== state.content.content_id) return

    const newTimeline = props.removeCommentFromTimeline(
      data.fields.content.content_id,
      state.timeline
    )
    this.setState({ timeline: newTimeline })
  }

  handleTranslateDocument = () => {
    const { state } = this
    handleTranslateHtmlContent(
      state.config.apiUrl,
      state.content.workspace_id,
      state.content.content_id,
      state.content.current_revision_id,
      state.translationTargetLanguageCode,
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

  handleClickAutoComplete = () => this.setState({
    autoCompleteFormNewTagActive: false,
    autoCompleteClicked: true
  })

  getMenuItemList = () => {
    const { props, state } = this
    const timelineObject = {
      id: 'timeline',
      label: props.t('Timeline'),
      icon: 'fa-history',
      children: state.config.apiUrl ? (
        <Timeline
          customClass={`${state.config.slug}__contentpage__timeline`}
          customColor={state.config.hexcolor}
          apiUrl={state.config.apiUrl}
          loggedUser={state.loggedUser}
          timelineData={state.timeline}
          memberList={state.config.workspace.memberList}
          newComment={state.newComment}
          newCommentAsFileList={state.newCommentAsFileList}
          disableComment={state.mode === APP_FEATURE_MODE.REVISION || state.mode === APP_FEATURE_MODE.EDIT || !state.content.is_editable}
          availableStatusList={state.config.availableStatuses}
          wysiwyg={state.timelineWysiwyg}
          onChangeNewComment={this.handleChangeNewComment}
          onRemoveCommentAsFile={this.handleRemoveCommentAsFile}
          onValidateCommentFileToUpload={this.handleAddCommentAsFile}
          onClickValidateNewCommentBtn={this.handleClickValidateNewCommentBtn}
          onClickWysiwygBtn={this.handleToggleWysiwyg}
          onClickRevisionBtn={this.handleClickShowRevision}
          shouldScrollToBottom={state.mode !== APP_FEATURE_MODE.REVISION}
          isLastTimelineItemCurrentToken={state.isLastTimelineItemCurrentToken}
          key='Timeline'
          invalidMentionList={state.invalidMentionList}
          onClickCancelSave={this.handleCancelSave}
          onClickSaveAnyway={this.handleClickValidateAnywayNewComment}
          onInitWysiwyg={this.handleInitTimelineCommentWysiwyg}
          showInvalidMentionPopup={state.showInvalidMentionPopupInComment}
          searchForMentionOrLinkInQuery={this.searchForMentionOrLinkInQuery}
          workspaceId={state.content.workspace_id}
          onClickTranslateComment={comment => props.handleTranslateComment(
            comment,
            state.content.workspace_id,
            state.translationTargetLanguageCode,
            this.setState.bind(this)
          )}
          onClickRestoreComment={comment => props.handleRestoreComment(comment, this.setState.bind(this))}
          onClickEditComment={this.handleClickEditComment}
          onClickDeleteComment={this.handleClickDeleteComment}
          onClickOpenFileComment={this.handleClickOpenFileComment}
          translationTargetLanguageList={state.config.system.config.translation_service__target_languages}
          translationTargetLanguageCode={state.translationTargetLanguageCode}
          onChangeTranslationTargetLanguageCode={this.handleChangeTranslationTargetLanguageCode}
        />
      ) : null
    }
    const tag = {
      id: 'tag',
      label: props.t('Tags'),
      icon: 'fas fa-tag',
      children: (
        <TagList
          apiUrl={state.config.apiUrl}
          workspaceId={state.content.workspace_id}
          contentId={state.content.content_id}
          displayNewTagForm={state.displayNewTagForm}
          onClickAddTagBtn={this.handleToggleAddTagForm}
          onClickCloseAddTagBtn={this.handleToggleAddTagForm}
          searchedKnownTagList={props.searchedKnownTagList}
          onClickAutoComplete={this.handleClickAutoComplete}
        />
      )
    }
    return [timelineObject, tag]
  }

  render () {
    const { props, state } = this

    if (!state.isVisible) return null

    const displayTranslatedText = (
      state.mode !== APP_FEATURE_MODE.EDIT &&
      state.translationState === TRANSLATION_STATE.TRANSLATED
    )
    return (
      <PopinFixed
        customClass={`${state.config.slug}`}
        customColor={state.config.hexcolor}
      >
        <PopinFixedContent
          appMode={state.mode}
          availableStatuses={state.config.availableStatuses}
          breadcrumbsList={state.breadcrumbsList}
          componentTitle={<div>{state.content.label}</div>}
          content={state.content}
          config={state.config}
          customClass={state.mode === APP_FEATURE_MODE.EDIT ? `${state.config.slug}__contentpage__edition` : `${state.config.slug}__contentpage`}
          disableChangeTitle={!state.content.is_editable}
          headerButtons={[{
              icon: 'fas fa-plus-circle',
              label: props.t('Edit'),
              key: props.t('Edit'),
              onClick: this.handleClickNewVersion,
              showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id,
              disabled: state.mode !== APP_FEATURE_MODE.VIEW || !state.content.is_editable,
              dataCy: 'popinListItem__newVersion'
            }
          ]}
          isRefreshNeeded={state.showRefreshWarning}
          lastVersion={state.timeline.filter(t => t.timelineType === 'revision').length}
          loggedUser={state.loggedUser}
          onChangeStatus={this.handleChangeStatus}
          onClickCloseBtn={this.handleClickBtnCloseApp}
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
          actionList={[{
            icon: 'far fa-trash-alt',
            label: props.t('Delete'),
            onClick: this.handleClickDelete,
            showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id,
            disabled: state.mode === APP_FEATURE_MODE.REVISION || state.content.is_archived || state.content.is_deleted,
            dataCy: 'popinListItem__delete'
          }
          ]}
        >
          {/*
            FIXME - GB - 2019-06-05 - we need to have a better way to check the state.config than using state.config.availableStatuses[3].slug
            https://github.com/tracim/tracim/issues/1840
          */}
          <HtmlDocumentComponent
            editionAuthor={state.editionAuthor}
            invalidMentionList={state.invalidMentionList}
            mode={state.mode}
            apiUrl={state.config.apiUrl}
            customColor={state.config.hexcolor}
            wysiwygNewVersion='wysiwygNewVersion'
            onClickCloseEditMode={this.handleCloseNewVersion}
            disableValidateBtn={state.rawContentBeforeEdit === state.content.raw_content}
            onClickValidateBtn={this.handleClickSaveDocument}
            text={displayTranslatedText ? state.translatedRawContent : state.content.raw_content}
            onChangeText={this.handleChangeText}
            isArchived={state.content.is_archived}
            isDeleted={state.content.is_deleted}
            isDeprecated={state.content.status === state.config.availableStatuses[3].slug}
            deprecatedStatus={state.config.availableStatuses[3]}
            isDraftAvailable={state.mode === APP_FEATURE_MODE.VIEW && state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && getLocalStorageItem(state.appName, state.content, LOCAL_STORAGE_FIELD.RAW_CONTENT)}
            // onClickRestoreArchived={this.handleClickRestoreArchive}
            onClickRestoreDeleted={this.handleClickRestoreDelete}
            onClickShowDraft={this.handleClickNewVersion}
            key='html-document'
            isRefreshNeeded={state.showRefreshWarning}
            isAutoCompleteActivated={state.isAutoCompleteActivated}
            tinymcePosition={state.tinymcePosition}
            autoCompleteCursorPosition={state.autoCompleteCursorPosition}
            autoCompleteItemList={state.autoCompleteItemList}
            onClickAutoCompleteItem={(mention) => tinymceAutoCompleteHandleClickItem(mention, this.setState.bind(this))}
            displayNotifyAllMessage={this.shouldDisplayNotifyAllMessage()}
            onClickCloseNotifyAllMessage={this.handleCloseNotifyAllMessage}
            onClickNotifyAll={this.handleClickNotifyAll}
            onClickCancelSave={this.handleCancelSave}
            onClickSaveAnyway={this.handleSaveHtmlDocument}
            showInvalidMentionPopup={state.showInvalidMentionPopupInContent}
            onClickTranslateDocument={this.handleTranslateDocument}
            onClickRestoreDocument={this.handleRestoreDocument}
            translationState={state.translationState}
            translationTargetLanguageList={state.config.system.config.translation_service__target_languages}
            translationTargetLanguageCode={state.translationTargetLanguageCode}
            onChangeTranslationTargetLanguageCode={this.handleChangeTranslationTargetLanguageCode}
            onClickRefresh={this.handleClickRefresh}
            onClickLastVersion={this.handleClickLastVersion}
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

export default translate()(Radium(appContentFactory(TracimComponent(HtmlDocument))))
