import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import FileComponent from '../component/FileComponent.jsx'
import {
  BREADCRUMBS_TYPE,
  buildContentPathBreadcrumbs,
  CONTENT_TYPE,
  TracimComponent,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_SUB_TYPE as TLM_ST,
  appContentFactory,
  addAllResourceI18n,
  handleFetchResult,
  handleInvalidMentionInComment,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  PopinFixedRightPart,
  Timeline,
  NewVersionBtn,
  GenericButton,
  AppContentRightMenu,
  displayDistanceDate,
  LOCAL_STORAGE_FIELD,
  getLocalStorageItem,
  FilenameWithExtension,
  CUSTOM_EVENT,
  ShareDownload,
  displayFileSize,
  checkEmailValidity,
  parserStringToList,
  removeExtensionOfFilename,
  buildFilePreviewUrl,
  buildHeadTitle,
  ROLE,
  APP_FEATURE_MODE,
  computeProgressionPercentage,
  FILE_PREVIEW_STATE,
  addRevisionFromTLM,
  setupCommonRequestHeaders,
  getOrCreateSessionClientToken,
  getCurrentContentVersionNumber,
  getContentComment,
  getFileChildContent,
  getFileContent,
  getFileRevision,
  PAGE,
  putFileDescription,
  putMyselfFileRead,
  putUserConfiguration,
  permissiveNumberEqual,
  getDefaultTranslationState,
  FavoriteButton,
  FAVORITE_STATE,
  ToolBar,
  TagList
} from 'tracim_frontend_lib'
import { isVideoMimeTypeAndIsAllowed, DISALLOWED_VIDEO_MIME_TYPE_LIST } from '../helper.js'
import { debug } from '../debug.js'
import {
  deleteShareLink,
  getShareLinksList,
  postShareLinksList
} from '../action.async.js'
import FileProperties from '../component/FileProperties.jsx'

// import { IMG_LOAD_STATE } from 'tracim_frontend_lib'

export class File extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'file',
      breadcrumbsList: [],
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      timeline: [],
      displayNewTagForm: false,
      externalTranslationList: [
        props.t('File'),
        props.t('Files'),
        props.t('file'),
        props.t('files'),
        props.t('Upload files')
      ],
      newComment: '',
      newCommentAsFileList: [],
      newContent: {},
      newFile: '',
      newFilePreview: FILE_PREVIEW_STATE.NO_FILE,
      fileCurrentPage: 1,
      timelineWysiwyg: false,
      mode: APP_FEATURE_MODE.VIEW,
      progressUpload: {
        display: false,
        percent: 0
      },
      shareEmails: '',
      sharePassword: '',
      shareLinkList: [],
      previewVideo: false,
      showRefreshWarning: false,
      editionAuthor: '',
      invalidMentionList: [],
      isLastTimelineItemCurrentToken: false,
      showInvalidMentionPopupInComment: false,
      translationTargetLanguageCode: param.loggedUser.lang
    }
    this.refContentLeftTop = React.createRef()
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
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FILE, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentDeletedOrRestored },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentDeletedOrRestored },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommentDeleted },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCommentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.FILE, handler: this.handleContentCommentCreated },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModified }
    ])
  }

  // Custom Event Handlers
  handleShowApp = data => {
    const { props, state } = this
    console.log('%c<File> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP(state.config.slug), data)

    props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), this.buildBreadcrumbs)
    if (data.content.content_id === state.content.content_id) this.setHeadTitle(state.content.label)
  }

  handleHideApp = data => {
    const { props, state } = this
    console.log('%c<File> Custom event', 'color: #28a745', CUSTOM_EVENT.HIDE_APP(state.config.slug), data)

    props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
  }

  handleReloadContent = data => {
    const { props, state } = this
    console.log('%c<File> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_CONTENT(state.config.slug), data)

    props.appContentCustomEventHandlerReloadContent(data, this.setState.bind(this), state.appName)
  }

  handleAllAppChangeLanguage = data => {
    const { state, props } = this
    console.log('%c<File> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)

    props.appContentCustomEventHandlerAllAppChangeLanguage(
      data, this.setState.bind(this), i18n, state.timelineWysiwyg, this.handleChangeNewComment
    )
    this.loadTimeline()
  }

  handleContentModified = (data) => {
    const { state } = this
    if (data.fields.content.content_id !== state.content.content_id) return

    const clientToken = state.config.apiHeader['X-Tracim-ClientToken']
    const filenameNoExtension = removeExtensionOfFilename(data.fields.content.filename)
    const newContentObject = {
      ...state.content,
      ...data.fields.content,
      previewUrl: buildFilePreviewUrl(state.config.apiUrl, state.content.workspace_id, data.fields.content.content_id, data.fields.content.current_revision_id, filenameNoExtension, 1, 500, 500),
      lightboxUrlList: (new Array(data.fields.content.page_nb)).fill(null).map((n, i) => i + 1).map(pageNb => // create an array [1..revision.page_nb]
        buildFilePreviewUrl(state.config.apiUrl, state.content.workspace_id, data.fields.content.content_id, data.fields.content.current_revision_id, filenameNoExtension, pageNb, 1920, 1080)
      )
    }

    this.setState(prev => ({
      content: clientToken === data.fields.client_token
        ? newContentObject
        : { ...prev.content, number: getCurrentContentVersionNumber(prev.mode, prev.content, prev.timeline) },
      newContent: newContentObject,
      editionAuthor: data.fields.author.public_name,
      showRefreshWarning: clientToken !== data.fields.client_token,
      timeline: addRevisionFromTLM(data.fields, prev.timeline, prev.loggedUser.lang, clientToken === data.fields.client_token),
      isLastTimelineItemCurrentToken: data.fields.client_token === this.sessionClientToken
    }))
    if (clientToken === data.fields.client_token) {
      this.setHeadTitle(filenameNoExtension)
      this.buildBreadcrumbs(newContentObject)
    }
  }

  handleContentCommentCreated = (tlm) => {
    const { props, state } = this
    // Not a comment for our content
    if (!permissiveNumberEqual(tlm.fields.content.parent_id, state.content.content_id)) return

    const createdByLoggedUser = tlm.fields.client_token === this.sessionClientToken
    const newTimeline = props.addCommentToTimeline(
      tlm.fields.content, state.timeline, state.loggedUser, createdByLoggedUser, getDefaultTranslationState(state.config.system.config)
    )
    this.setState({
      timeline: newTimeline,
      isLastTimelineItemCurrentToken: createdByLoggedUser
    })
  }

  handleContentDeletedOrRestored = data => {
    const { state } = this
    const isTlmAboutCurrentContent = data.fields.content.content_id === state.content.content_id
    const isTlmAboutCurrentContentChildren = data.fields.content.parent_id === state.content.content_id

    if (!isTlmAboutCurrentContent && !isTlmAboutCurrentContentChildren) return

    if (isTlmAboutCurrentContent) {
      const clientToken = state.config.apiHeader['X-Tracim-ClientToken']
      this.setState(prev =>
        ({
          content: clientToken === data.fields.client_token
            ? { ...prev.content, ...data.fields.content }
            : { ...prev.content, number: getCurrentContentVersionNumber(prev.mode, prev.content, prev.timeline) },
          newContent: {
            ...prev.content,
            ...data.fields.content
          },
          editionAuthor: data.fields.author.public_name,
          showRefreshWarning: clientToken !== data.fields.client_token,
          mode: clientToken === data.fields.client_token ? APP_FEATURE_MODE.VIEW : prev.mode,
          timeline: addRevisionFromTLM(data.fields, prev.timeline, prev.loggedUser.lang, clientToken === data.fields.client_token),
          isLastTimelineItemCurrentToken: data.fields.client_token === this.sessionClientToken
        })
      )
      return
    }

    if (isTlmAboutCurrentContentChildren) {
      this.handleContentCommentDeleted(data)
    }
  }

  handleUserModified = data => {
    const newTimeline = this.state.timeline.map(timelineItem => timelineItem.author.user_id === data.fields.user.user_id
      ? { ...timelineItem, author: data.fields.user }
      : timelineItem
    )

    this.setState({ timeline: newTimeline })
  }

  async componentDidMount () {
    console.log('%c<File> did mount', `color: ${this.state.config.hexcolor}`)
    this.updateTimelineAndContent()
    this.props.loadFavoriteContentList(this.state.loggedUser, this.setState.bind(this))
  }

  async updateTimelineAndContent (pageToLoad = null) {
    this.setState({
      newComment: getLocalStorageItem(
        this.state.appName,
        this.state.content,
        LOCAL_STORAGE_FIELD.COMMENT
      ) || ''
    })

    await this.loadContent(pageToLoad)
    this.loadTimeline()
    if (this.state.config.workspace.downloadEnabled) this.loadShareLinkList()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    // console.log('%c<File> did update', `color: ${this.state.config.hexcolor}`, prevState, state)
    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) {
      this.setState({ fileCurrentPage: 1 })
      this.updateTimelineAndContent(1)
    }

    if (prevState.timelineWysiwyg && !state.timelineWysiwyg) globalThis.tinymce.remove('#wysiwygTimelineComment')
  }

  componentWillUnmount () {
    console.log('%c<File> will Unmount', `color: ${this.state.config.hexcolor}`)
    globalThis.tinymce.remove('#wysiwygTimelineComment')
  }

  sendGlobalFlashMessage = (msg, type) => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: type || 'warning',
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

  loadContent = async (pageToLoad = null) => {
    const { state, props } = this

    const response = await handleFetchResult(await getFileContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id))

    switch (response.apiResponse.status) {
      case 200: {
        const filenameNoExtension = removeExtensionOfFilename(response.body.filename)
        const pageForPreview = pageToLoad || state.fileCurrentPage
        this.setState({
          content: {
            ...response.body,
            filenameNoExtension: filenameNoExtension,
            // FIXME - b.l - refactor urls
            previewUrl: `${state.config.apiUrl}/workspaces/${state.content.workspace_id}/files/${state.content.content_id}/revisions/${response.body.current_revision_id}/preview/jpg/500x500/${filenameNoExtension + '.jpg'}?page=${pageForPreview}&revision_id=${response.body.current_revision_id}`,
            lightboxUrlList: (new Array(response.body.page_nb)).fill('').map((n, i) =>
              // FIXME - b.l - refactor urls
              `${state.config.apiUrl}/workspaces/${state.content.workspace_id}/files/${state.content.content_id}/revisions/${response.body.current_revision_id}/preview/jpg/1920x1080/${filenameNoExtension + '.jpg'}?page=${i + 1}`
            )
          },
          mode: APP_FEATURE_MODE.VIEW,
          isLastTimelineItemCurrentToken: false
        })
        this.setHeadTitle(filenameNoExtension)
        this.buildBreadcrumbs(response.body)
        break
      }
      default:
        this.sendGlobalFlashMessage(props.t('Error while loading file'))
        return
    }

    await putMyselfFileRead(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
  }

  loadTimeline = async () => {
    const { props, state } = this

    const [resComment, resCommentAsFile, resRevision] = await Promise.all([
      handleFetchResult(await getContentComment(state.config.apiUrl, state.content.workspace_id, state.content.content_id)),
      handleFetchResult(await getFileChildContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id)),
      handleFetchResult(await getFileRevision(state.config.apiUrl, state.content.workspace_id, state.content.content_id))
    ])

    if (
      resComment.apiResponse.status !== 200 &&
      resCommentAsFile.apiResponse.status !== 200 &&
      resRevision.apiResponse.status !== 200
    ) {
      this.sendGlobalFlashMessage(props.t('Error while loading timeline'))
      console.log('Error loading timeline', 'comments', resComment, 'revisions', resRevision)
      return
    }

    const revisionWithComment = props.buildTimelineFromCommentAndRevision(
      resComment.body,
      resCommentAsFile.body.items,
      resRevision.body,
      state.loggedUser,
      getDefaultTranslationState(state.config.system.config)
    )

    this.setState({ timeline: revisionWithComment })
  }

  loadShareLinkList = async () => {
    const { props, state } = this

    if (state.loggedUser.userRoleIdInWorkspace < ROLE.contributor.id) return

    const response = await handleFetchResult(await getShareLinksList(state.config.apiUrl, state.content.workspace_id, state.content.content_id))

    switch (response.apiResponse.status) {
      case 200:
        this.setState({
          shareEmails: '',
          sharePassword: '',
          shareLinkList: response.body
        })
        break
      default: this.sendGlobalFlashMessage(props.t('Error while loading share links list')); break
    }
  }

  buildBreadcrumbs = async (content) => {
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
      console.error('Error in app file, count not build breadcrumbs', e)
    }
  }

  handleClickBtnCloseApp = () => {
    const { state, props } = this

    if (state.progressUpload.display) {
      this.sendGlobalFlashMessage(props.t('Please wait until the upload ends'))
      return
    }

    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
  }

  handleClickNewVersion = () => {
    this.refContentLeftTop.current.scrollIntoView({ behavior: 'instant' })
    this.setState({ mode: APP_FEATURE_MODE.EDIT })
  }

  handleClickValidateNewDescription = async newDescription => {
    const { props, state } = this

    const fetchResultSaveFile = await handleFetchResult(
      await putFileDescription(state.config.apiUrl, state.content.workspace_id, state.content.content_id, state.content.label, newDescription)
    )
    switch (fetchResultSaveFile.apiResponse.status) {
      case 200: {
        const newConfiguration = state.loggedUser.config
        newConfiguration[`content.${state.content.content_id}.notify_all_members_message`] = true

        this.setState(prev => ({ ...prev, loggedUser: { ...prev.loggedUser, config: newConfiguration } }))

        const fetchPutUserConfiguration = await handleFetchResult(await putUserConfiguration(state.config.apiUrl, state.loggedUser.userId, state.loggedUser.config))
        if (fetchPutUserConfiguration.status !== 204) { this.sendGlobalFlashMessage(props.t('Error while saving the user configuration')) }
        break
      }
      case 400:
        switch (fetchResultSaveFile.body.code) {
          case 2041: break // same description sent, no need for error msg
          default: this.sendGlobalFlashMessage(props.t('Error while saving the new description'))
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving the new description'))
    }
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

  handleSaveEditTitle = async newTitle => {
    const { props, state } = this
    const response = await props.appContentChangeTitle(state.content, newTitle, state.config.slug)
    if (response.apiResponse.status === 200) {
      if (state.config.workspace.downloadEnabled) this.loadShareLinkList()
    }
  }

  searchForMentionOrLinkInQuery = async (query) => {
    return await this.props.searchForMentionOrLinkInQuery(query, this.state.content.workspace_id)
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

  handleToggleWysiwyg = () => this.setState(prev => ({ timelineWysiwyg: !prev.timelineWysiwyg }))

  handleChangeStatus = async newStatus => {
    const { props, state } = this
    props.appContentChangeStatus(state.content, newStatus, state.config.slug)
  }

  handleClickArchive = async () => {
    const { props, state } = this
    props.appContentArchive(state.content, this.setState.bind(this), state.config.slug)
  }

  handleClickDelete = async () => {
    const { props, state } = this
    props.appContentDelete(state.content, this.setState.bind(this), state.config.slug)
  }

  handleClickRestoreArchive = async () => {
    const { props, state } = this
    props.appContentRestoreArchive(state.content, this.setState.bind(this), state.config.slug)
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
      comment.content_id,
      comment.content_type
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

  handleClickRestoreDelete = async () => {
    const { props, state } = this
    props.appContentRestoreDelete(state.content, this.setState.bind(this), state.config.slug)
  }

  handleClickShowRevision = async revision => {
    const { state } = this

    const revisionArray = state.timeline.filter(t => t.timelineType === 'revision')
    const isLastRevision = revision.revision_id === revisionArray[revisionArray.length - 1].revision_id

    if (state.mode === APP_FEATURE_MODE.REVISION && isLastRevision) {
      this.handleClickLastVersion()
      return
    }

    if (state.mode === APP_FEATURE_MODE.VIEW && isLastRevision) return

    const filenameNoExtension = removeExtensionOfFilename(revision.filename)

    this.setState(prev => ({
      content: {
        ...prev.content,
        ...revision,
        workspace_id: state.content.workspace_id, // don't overrides workspace_id because if file has been moved to a different workspace, workspace_id will change and break image urls
        filenameNoExtension: filenameNoExtension,
        current_revision_id: revision.revision_id,
        contentFull: null,
        is_archived: prev.is_archived, // archived and delete should always be taken from last version
        is_deleted: prev.is_deleted,
        // use state.content.workspace_id instead of revision.workspace_id because if file has been moved to a different workspace, workspace_id will change and break image urls
        previewUrl: buildFilePreviewUrl(state.config.apiUrl, state.content.workspace_id, revision.content_id, revision.revision_id, filenameNoExtension, 1, 500, 500),
        lightboxUrlList: (new Array(revision.page_nb)).fill(null).map((n, i) => i + 1).map(pageNb => // create an array [1..revision.page_nb]
          buildFilePreviewUrl(state.config.apiUrl, state.content.workspace_id, revision.content_id, revision.revision_id, filenameNoExtension, pageNb, 1920, 1080)
        )
      },
      fileCurrentPage: 1, // always set to first page on revision switch
      mode: APP_FEATURE_MODE.REVISION
    }))
  }

  handleClickLastVersion = () => {
    this.setState({
      fileCurrentPage: 1,
      mode: APP_FEATURE_MODE.VIEW
    })
    this.loadContent(1)
  }

  handleChangeFile = newFile => {
    if (!newFile || !newFile[0]) return

    const fileToSave = newFile[0]

    if (fileToSave.type.includes('image') && fileToSave.size <= 2000000) {
      this.setState({ newFile: fileToSave })

      var reader = new FileReader()
      reader.onload = e => {
        this.setState({ newFilePreview: e.total > 0 ? e.target.result : FILE_PREVIEW_STATE.NO_PREVIEW })
        const img = new Image()
        img.src = e.target.result
        img.onerror = () => this.setState({ newFilePreview: FILE_PREVIEW_STATE.NO_PREVIEW })
      }
      reader.readAsDataURL(fileToSave)
    } else {
      this.setState({
        newFile: fileToSave,
        newFilePreview: FILE_PREVIEW_STATE.NO_PREVIEW
      })
    }
  }

  handleClickDropzoneCancel = () => this.setState({ mode: APP_FEATURE_MODE.VIEW, newFile: '', newFilePreview: FILE_PREVIEW_STATE.NO_FILE })

  handleClickDropzoneValidate = async () => {
    const { props, state } = this

    const formData = new FormData()
    formData.append('files', state.newFile)

    // fetch still doesn't handle event progress. So we need to use old school xhr object :scream:
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('loadstart', () => this.setState({ progressUpload: { display: false, percent: 0 } }), false)
    const uploadInProgress = e => e.lengthComputable && this.setState({ progressUpload: { display: true, percent: Math.round(computeProgressionPercentage(e.loaded, e.total)) } })
    xhr.upload.addEventListener('progress', uploadInProgress, false)
    xhr.upload.addEventListener('load', () => this.setState({ progressUpload: { display: false, percent: 0 } }), false)

    // FIXME - b.l - refactor urls
    xhr.open('PUT', `${state.config.apiUrl}/workspaces/${state.content.workspace_id}/files/${state.content.content_id}/raw/${state.content.filename}`, true)
    setupCommonRequestHeaders(xhr)
    xhr.withCredentials = true

    xhr.onreadystatechange = async () => {
      if (xhr.readyState === 4) {
        switch (xhr.status) {
          case 204: {
            const newConfiguration = state.loggedUser.config
            newConfiguration[`content.${state.content.content_id}.notify_all_members_message`] = true

            this.setState(prev => ({
              ...prev,
              newFile: '',
              newFilePreview: FILE_PREVIEW_STATE.NO_FILE,
              fileCurrentPage: 1,
              mode: APP_FEATURE_MODE.VIEW,
              loggedUser: { ...prev.loggedUser, config: newConfiguration }
            }))

            const fetchPutUserConfiguration = await handleFetchResult(await putUserConfiguration(state.config.apiUrl, state.loggedUser.userId, state.loggedUser.config))
            if (fetchPutUserConfiguration.status !== 204) { this.sendGlobalFlashMessage(props.t('Error while saving the user configuration')) }
            break
          }
          case 400: {
            const jsonResult400 = JSON.parse(xhr.responseText)
            switch (jsonResult400.code) {
              case 3002: this.sendGlobalFlashMessage(props.t('A content with the same name already exists')); break
              case 6002: this.sendGlobalFlashMessage(props.t('The file is larger than the maximum file size allowed')); break
              case 6003: this.sendGlobalFlashMessage(props.t('Error, the space exceed its maximum size')); break
              case 6004: this.sendGlobalFlashMessage(props.t('You have reached your storage limit, you cannot add new files')); break
              default: this.sendGlobalFlashMessage(props.t('Error while uploading file')); break
            }
            break
          }
          default: this.sendGlobalFlashMessage(props.t('Error while uploading file'))
        }
      }
    }

    xhr.send(formData)
  }

  handleClickPreviousNextPage = async previousNext => {
    const { state } = this

    if (!['previous', 'next'].includes(previousNext)) return
    if (previousNext === 'previous' && state.fileCurrentPage === 0) return
    if (previousNext === 'next' && state.fileCurrentPage > state.content.page_nb) return

    const nextPageNumber = previousNext === 'previous' ? state.fileCurrentPage - 1 : state.fileCurrentPage + 1

    this.setState(prev => ({
      fileCurrentPage: nextPageNumber,
      content: {
        ...prev.content,
        previewUrl: buildFilePreviewUrl(state.config.apiUrl, state.content.workspace_id, state.content.content_id, state.content.current_revision_id, state.content.filenameNoExtension, nextPageNumber, 500, 500)
      }
    }))
  }

  handleClickNewShare = async isPasswordActive => {
    const { state, props } = this

    let shareEmailList = parserStringToList(state.shareEmails)
    const invalidEmails = []

    shareEmailList.forEach(shareEmail => {
      if (!checkEmailValidity(shareEmail)) invalidEmails.push(shareEmail)
    })

    shareEmailList = shareEmailList.filter(shareEmail => !invalidEmails.includes(shareEmail))

    if (invalidEmails.length > 0 || shareEmailList === 0) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: <div>{props.t('The following emails are not valid:')}<br />{invalidEmails.join(', ')}</div>,
          type: 'warning',
          delay: undefined
        }
      })
      return false
    }

    if (isPasswordActive && state.sharePassword.length < 6) {
      this.sendGlobalFlashMessage(props.t('The password is too short (minimum 6 characters)'))
      return false
    }

    if (isPasswordActive && state.sharePassword.length > 512) {
      this.sendGlobalFlashMessage(props.t('The password is too long (maximum 512 characters)'))
      return false
    }

    const response = await handleFetchResult(await postShareLinksList(
      state.config.apiUrl,
      state.content.workspace_id,
      state.content.content_id,
      shareEmailList,
      isPasswordActive ? state.sharePassword : null
    ))

    switch (response.apiResponse.status) {
      case 200:
        this.setState(prev => ({
          shareLinkList: [...prev.shareLinkList, ...response.body],
          shareEmails: '',
          sharePassword: ''
        }))
        return true
      case 400:
        switch (response.body.code) {
          case 2001:
            this.sendGlobalFlashMessage(props.t('The password length must be between 6 and 512 characters and the email(s) must be valid'))
            break
          default: this.sendGlobalFlashMessage(props.t('Error while creating new share link'))
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while creating new share link'))
    }
    return false
  }

  handleChangeEmails = e => this.setState({ shareEmails: e.target.value })
  handleChangePassword = e => this.setState({ sharePassword: e.target.value })
  handleKeyDownEnter = e => {
    if (e.key === 'Enter') {
      const emailList = parserStringToList(this.state.shareEmails)
      const invalidEmails = []

      emailList.forEach(email => {
        if (!checkEmailValidity(email)) invalidEmails.push(email)
      })

      if (invalidEmails.length > 0) {
        this.sendGlobalFlashMessage(this.props.t(`Error: ${invalidEmails} are not valid`))
      } else {
        this.setState({ shareEmails: emailList.join('\n') })
      }
    }
  }

  handleCancelSave = () => this.setState({ showInvalidMentionPopupInComment: false })

  handleClickAutoComplete = () => this.setState({
    autoCompleteFormNewTagActive: false,
    autoCompleteClicked: true
  })

  handleToggleAddTagForm = () => this.setState(prev => ({ displayNewTagForm: !prev.displayNewTagForm }))

  handleClickDeleteShareLink = async shareLinkId => {
    const { props, state } = this

    const response = await handleFetchResult(
      await deleteShareLink(state.config.apiUrl, state.content.workspace_id, state.content.content_id, shareLinkId)
    )

    switch (response.status) {
      case 204:
        this.loadShareLinkList()
        break
      case 400:
        this.sendGlobalFlashMessage(props.t('Error in the URL'))
        state.config.history.push(PAGE.LOGIN)
        break
      default: this.sendGlobalFlashMessage(props.t('Error while deleting share link'))
    }
  }

  handleClickRefresh = () => {
    const { state } = this

    const newObjectContent = {
      ...state.content,
      ...state.newContent
    }

    this.setState(prev => ({
      content: newObjectContent,
      timeline: prev.timeline.map(timelineItem => ({ ...timelineItem, hasBeenRead: true })),
      mode: APP_FEATURE_MODE.VIEW,
      showRefreshWarning: false
    }))
    const filenameNoExtension = removeExtensionOfFilename(this.state.newContent.filename)
    this.setHeadTitle(filenameNoExtension)
    this.buildBreadcrumbs(newObjectContent)
  }

  getDownloadBaseUrl = (apiUrl, content, mode) => {
    const urlRevisionPart = mode === APP_FEATURE_MODE.REVISION ? `revisions/${content.current_revision_id}/` : ''
    // FIXME - b.l - refactor urls
    return `${apiUrl}/workspaces/${content.workspace_id}/files/${content.content_id}/${urlRevisionPart}`
  }

  // INFO - CH - 2019-05-24 - last path param revision_id is to force browser to not use cache when we upload new revision
  // see https://github.com/tracim/tracim/issues/1804
  getDownloadRawUrl = ({ config: { apiUrl }, content, mode }) =>
    // FIXME - b.l - refactor urls
    `${this.getDownloadBaseUrl(apiUrl, content, mode)}raw/${encodeURIComponent(content.filenameNoExtension + content.file_extension)}?force_download=1&revision_id=${content.current_revision_id}`

  getDownloadPdfPageUrl = ({ config: { apiUrl }, content, mode, fileCurrentPage }) =>
    // FIXME - b.l - refactor urls
    `${this.getDownloadBaseUrl(apiUrl, content, mode)}preview/pdf/${encodeURIComponent(content.filenameNoExtension) + '.pdf'}?page=${fileCurrentPage}&force_download=1&revision_id=${content.current_revision_id}`

  getDownloadPdfFullUrl = ({ config: { apiUrl }, content, mode }) =>
    // FIXME - b.l - refactor urls
    `${this.getDownloadBaseUrl(apiUrl, content, mode)}preview/pdf/full/${encodeURIComponent(content.filenameNoExtension) + '.pdf'}?force_download=1&revision_id=${content.current_revision_id}`

  getOnlineEditionAction = () => {
    const { state } = this
    try {
      if (!appCollaborativeDocumentEdition) {
        return null
      }
      return appCollaborativeDocumentEdition.default.getOnlineEditionAction(
        state.content,
        state.config.system.config.collaborative_document_edition,
        state.loggedUser.userRoleIdInWorkspace
      )
    } catch (error) {
      // INFO - B.L - 2019/08/05 - if appCollaborativeDocumentEdition is not activated in the backend
      // the global variable will not exists and cause a ReferenceError
      if (error instanceof ReferenceError) {
        console.log('appCollaborativeDocumentEdition is not activated disabling online edition')
        return null
      }
      throw error
    }
  }

  getMenuItemList = () => {
    const { props, state } = this
    const timelineObject = {
      id: 'timeline',
      label: props.t('Timeline'),
      icon: 'fa-history',
      children: state.config.apiUrl ? (
        <Timeline
          customClass={`${state.config.slug}__contentpage`}
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
    const propertiesObject = {
      id: 'properties',
      label: props.t('Properties'),
      icon: 'fa-info-circle',
      children: (
        <FileProperties
          color={state.config.hexcolor}
          fileType={state.content.mimetype}
          fileSize={displayFileSize(state.content.size)}
          filePageNb={state.content.page_nb}
          activesShares={state.content.actives_shares}
          creationDateFormattedWithTime={(new Date(state.content.created)).toLocaleString(props.i18n.language, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          creationDateFormatted={(new Date(state.content.created)).toLocaleString(props.i18n.language)}
          lastModification={displayDistanceDate(state.content.modified, state.loggedUser.lang)}
          lastModificationFormatted={(new Date(state.content.modified)).toLocaleString(props.i18n.language)}
          description={state.content.description}
          displayChangeDescriptionBtn={state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id}
          disableChangeDescription={!state.content.is_editable}
          onClickValidateNewDescription={this.handleClickValidateNewDescription}
          key='FileProperties'
        />
      )
    }

    if (state.config.workspace.downloadEnabled && state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id) {
      return [
        timelineObject,
        tag,
        {
          id: 'share',
          label: props.t('Share'),
          icon: 'fa-share-alt',
          children: (
            <ShareDownload
              label={props.t(state.config.label)}
              hexcolor={state.config.hexcolor}
              shareEmails={state.shareEmails}
              onChangeEmails={this.handleChangeEmails}
              onKeyDownEnter={this.handleKeyDownEnter}
              sharePassword={state.sharePassword}
              onChangePassword={this.handleChangePassword}
              shareLinkList={state.shareLinkList}
              onClickDeleteShareLink={this.handleClickDeleteShareLink}
              onClickNewShare={this.handleClickNewShare}
              userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
              emailNotifActivated={state.config.system.config.email_notification_activated}
              key='ShareDownload'
            />
          )
        },
        propertiesObject

      ]
    } else {
      return [timelineObject, tag, propertiesObject]
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

  handleClickNotifyAll = async () => {
    const { state, props } = this

    props.appContentNotifyAll(state.content, this.setState.bind(this), state.config.slug)
    this.handleCloseNotifyAllMessage()
  }

  shouldDisplayNotifyAllMessage = () => {
    const { state } = this
    if (
      !state.loggedUser.config ||
      state.content.current_revision_type === 'creation' ||
      (
        state.newContent.last_modifier &&
        state.newContent.last_modifier.user_id !== state.loggedUser.userId
      ) ||
      (
        !state.newContent.last_modifier &&
        state.content.last_modifier &&
        state.content.last_modifier.user_id !== state.loggedUser.userId
      )
    ) return false

    return !!state.loggedUser.config[`content.${state.content.content_id}.notify_all_members_message`]
  }

  handleChangeTranslationTargetLanguageCode = (translationTargetLanguageCode) => {
    this.setState({ translationTargetLanguageCode })
  }

  render () {
    const { props, state } = this
    const onlineEditionAction = this.getOnlineEditionAction()

    if (!state.isVisible) return null

    return (
      <PopinFixed
        customClass={`${state.config.slug}`}
        customColor={state.config.hexcolor}
      >
        <PopinFixedHeader
          customClass={`${state.config.slug}`}
          customColor={state.config.hexcolor}
          faIcon={state.config.faIcon}
          rawTitle={state.content.label}
          componentTitle={<FilenameWithExtension file={state.content} />}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
          disableChangeTitle={!state.content.is_editable}
          actionList={[
            {
              icon: 'fas fa-upload',
              label: props.t('Upload a new version'),
              key: props.t('Upload a new version'),
              onClick: this.handleClickNewVersion,
              showAction: '' //state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id
            } , {
              icon: 'far fa-file',
              label: props.t('Download current page as PDF'),
              onClick: '', // () => this.getDownloadPdfPageUrl(state),
              showAction: ''
            }, {
              icon: 'far fa-file-pdf',
              label: props.t('Download as PDF'),
              onClick: '', // () => this.getDownloadPdfFullUrl(state),
              showAction: ''
            }, {
              icon: 'fas fa-download',
              label: props.t('Download file'),
              onClick: '', // () => this.getDownloadRawUrl(state),
              showAction: ''
            }
          ]}
        />

        <PopinFixedOption
          customColor={state.config.hexcolor}
          customClass={`${state.config.slug}`}
          i18n={i18n}
        >
          <div>
            <ToolBar>
              <FavoriteButton
                favoriteState={props.isContentInFavoriteList(state.content, state)
                  ? FAVORITE_STATE.FAVORITE
                  : FAVORITE_STATE.NOT_FAVORITE}
                onClickAddToFavoriteList={() => props.addContentToFavoriteList(
                  state.content, state.loggedUser, this.setState.bind(this)
                )}
                onClickRemoveFromFavoriteList={() => props.removeContentFromFavoriteList(
                  state.content, state.loggedUser, this.setState.bind(this)
                )}
              />
              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && (
                <NewVersionBtn
                  customColor={state.config.hexcolor}
                  onClickNewVersionBtn={this.handleClickNewVersion}
                  disabled={state.mode !== APP_FEATURE_MODE.VIEW || !state.content.is_editable}
                  label={props.t('Upload a new version')}
                  icon='fas fa-upload'
                />
              )}

              {onlineEditionAction && (
                <GenericButton
                  customClass={`${state.config.slug}__option__menu__editBtn btn outlineTextBtn`}
                  dataCy='wsContentGeneric__option__menu__addversion'
                  customColor={state.config.hexcolor}
                  onClick={onlineEditionAction.handleClick}
                  disabled={state.mode !== APP_FEATURE_MODE.VIEW || !state.content.is_editable}
                  label={props.t(onlineEditionAction.label)}
                  style={{
                    marginLeft: '5px'
                  }}
                  faIcon='fas fa-edit'
                />
              )}

              {isVideoMimeTypeAndIsAllowed(state.content.mimetype, DISALLOWED_VIDEO_MIME_TYPE_LIST) && (
                <GenericButton
                  customClass={`${state.config.slug}__option__menu__editBtn btn outlineTextBtn`}
                  customColor={state.config.hexcolor}
                  label={props.t('Play video')}
                  onClick={() => this.setState({ previewVideo: true })}
                  faIcon='fas fa-play'
                  style={{ marginLeft: '5px' }}
                />
              )}
            </ToolBar>
            <AppContentRightMenu
              apiUrl={state.config.apiUrl}
              content={state.content}
              appMode={state.mode}
              loggedUser={state.loggedUser}
              hexcolor={state.config.hexcolor}
              onClickArchive={this.handleClickArchive}
              onClickDelete={this.handleClickDelete}
            />
          </div>
        </PopinFixedOption>

        <PopinFixedContent
          appMode={state.mode}
          availableStatuses={state.config.availableStatuses}
          breadcrumbsList={state.breadcrumbsList}
          content={state.content}
          customClass={`${state.config.slug}__contentpage`}
          isRefreshNeeded={state.showRefreshWarning}
          lastVersion={state.timeline.filter(t => t.timelineType === 'revision').length}
          loggedUser={state.loggedUser}
          onChangeStatus={this.handleChangeStatus}
          version={state.content.number}
        >
          {/* FIXME - GB - 2019-06-05 - we need to have a better way to check the state.config than using state.config.availableStatuses[3].slug
            https://github.com/tracim/tracim/issues/1840 */}
          <FileComponent
            editionAuthor={state.editionAuthor}
            isRefreshNeeded={state.showRefreshWarning}
            mode={state.mode}
            customColor={state.config.hexcolor}
            loggedUser={state.loggedUser}
            previewUrl={state.content.previewUrl ? state.content.previewUrl : ''}
            isJpegAvailable={state.content.has_jpeg_preview}
            filePageNb={state.content.page_nb}
            fileCurrentPage={state.fileCurrentPage}
            mimeType={state.content.mimetype}
            isArchived={state.content.is_archived}
            isDeleted={state.content.is_deleted}
            isDeprecated={state.content.status === state.config.availableStatuses[3].slug}
            deprecatedStatus={state.config.availableStatuses[3]}
            onClickRestoreArchived={this.handleClickRestoreArchive}
            onClickRestoreDeleted={this.handleClickRestoreDelete}
            downloadRawUrl={this.getDownloadRawUrl(state)}
            isPdfAvailable={state.content.has_pdf_preview}
            downloadPdfPageUrl={this.getDownloadPdfPageUrl(state)}
            downloadPdfFullUrl={this.getDownloadPdfFullUrl(state)}
            lightboxUrlList={state.content.lightboxUrlList}
            onChangeFile={this.handleChangeFile}
            onClickDropzoneCancel={this.handleClickDropzoneCancel}
            onClickDropzoneValidate={this.handleClickDropzoneValidate}
            onClickPreviousPage={() => this.handleClickPreviousNextPage('previous')}
            onClickNextPage={() => this.handleClickPreviousNextPage('next')}
            newFile={state.newFile}
            newFilePreview={state.newFilePreview}
            progressUpload={state.progressUpload}
            previewVideo={state.previewVideo}
            workspaceId={state.content.workspace_id}
            onClickClosePreviewVideo={() => this.setState({ previewVideo: false })}
            ref={this.refContentLeftTop}
            displayNotifyAllMessage={this.shouldDisplayNotifyAllMessage()}
            onClickCloseNotifyAllMessage={this.handleCloseNotifyAllMessage}
            onClickNotifyAll={this.handleClickNotifyAll}
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

export default translate()(appContentFactory(TracimComponent(File)))
