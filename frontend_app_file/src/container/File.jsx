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
  PopinFixedContent,
  PopinFixedRightPart,
  Timeline,
  displayDistanceDate,
  FilenameWithExtension,
  CUSTOM_EVENT,
  ShareDownload,
  displayFileSize,
  checkEmailValidity,
  parserStringToList,
  removeExtensionOfFilename,
  buildFilePreviewUrl,
  buildHeadTitle,
  tinymceRemove,
  ROLE,
  APP_FEATURE_MODE,
  computeProgressionPercentage,
  FILE_PREVIEW_STATE,
  setupCommonRequestHeaders,
  getOrCreateSessionClientToken,
  getFileContent,
  getFileRevision,
  PAGE,
  putFileDescription,
  putMyselfFileRead,
  putUserConfiguration,
  FAVORITE_STATE,
  PopinFixedRightPartContent,
  sendGlobalFlashMessage,
  TagList,
  getFileRevisionPreviewInfo
} from 'tracim_frontend_lib'
import { isVideoMimeTypeAndIsAllowed, DISALLOWED_VIDEO_MIME_TYPE_LIST } from '../helper.js'
import {
  deleteShareLink,
  getShareLinksList,
  postShareLinksList
} from '../action.async.js'
import FileProperties from '../component/FileProperties.jsx'

const ACTION_EDIT = 'edit'

export class File extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'file',
      breadcrumbsList: [],
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      externalTranslationList: [
        props.t('File'),
        props.t('Files'),
        props.t('file'),
        props.t('files'),
        props.t('Upload files')
      ],
      newContent: {},
      loadingContent: true,
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
      showInvalidMentionPopupInComment: false,
      translationTargetLanguageCode: param.loggedUser.lang,
      previewInfo: {
        has_jpeg_preview: false,
        has_pdf_preview: false,
        content_id: param.content.content_id,
        revision_id: param.content.current_revision_id,
        page_nb: 1
      }
    }
    this.refContentLeftTop = React.createRef()
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
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.FILE, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentDeletedOrRestored },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.FILE, handler: this.handleContentDeletedOrRestored }
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
  }

  handleContentModified = (data) => {
    const { state } = this
    if (data.fields.content.content_id !== state.content.content_id) return

    const clientToken = this.sessionClientToken
    const filenameNoExtension = removeExtensionOfFilename(data.fields.content.filename)
    const newContentObject = {
      ...state.content,
      ...data.fields.content
    }

    this.setState(prev => ({
      content: clientToken === data.fields.client_token
        ? newContentObject
        : prev.content,
      newContent: newContentObject,
      editionAuthor: data.fields.author.public_name,
      showRefreshWarning: clientToken !== data.fields.client_token
    }))
    if (clientToken === data.fields.client_token) {
      this.setHeadTitle(filenameNoExtension)
      this.buildBreadcrumbs(newContentObject)
    }
  }

  handleContentDeletedOrRestored = data => {
    const { state } = this
    const isTlmAboutCurrentContent = data.fields.content.content_id === state.content.content_id

    if (!isTlmAboutCurrentContent) return

    const clientToken = this.sessionClientToken
    const newContentObject = {
      ...state.content,
      ...data.fields.content
    }
    this.setState(prev => ({
      content: clientToken === data.fields.client_token
        ? newContentObject
        : prev.content,
      newContent: newContentObject,
      editionAuthor: data.fields.author.public_name,
      showRefreshWarning: clientToken !== data.fields.client_token,
      mode: clientToken === data.fields.client_token ? APP_FEATURE_MODE.VIEW : prev.mode
    }))
  }

  async componentDidMount () {
    console.log('%c<File> did mount', `color: ${this.state.config.hexcolor}`)
    this.updateTimelineAndContent()
    this.props.loadFavoriteContentList(this.state.loggedUser, this.setState.bind(this))
  }

  async updateTimelineAndContent () {
    const { props } = this
    this.loadContent()
    props.loadTimeline(getFileRevision, this.state.content)

    if (this.state.config.workspace.downloadEnabled) this.loadShareLinkList()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    // console.log('%c<File> did update', `color: ${this.state.config.hexcolor}`, prevState, state)
    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) {
      this.setState({ fileCurrentPage: 1 })
      this.updateTimelineAndContent()
    } else if (prevState.content.current_revision_id !== state.content.current_revision_id) {
      this.setState({ fileCurrentPage: 1 })
      // User selected a revision in the timeline, update the preview info to get the right page number
      const previewInfoResponse = await handleFetchResult(
        await getFileRevisionPreviewInfo(
          state.config.apiUrl,
          state.content.workspace_id,
          state.content.content_id,
          state.content.current_revision_id
        )
      )
      this.setState({ previewInfo: previewInfoResponse.body })
    }

    if (prevState.timelineWysiwyg && !state.timelineWysiwyg) tinymceRemove('#wysiwygTimelineComment')
  }

  componentWillUnmount () {
    console.log('%c<File> will Unmount', `color: ${this.state.config.hexcolor}`)
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

  loadContent = async () => {
    const { state, props } = this

    // RJ - 2021-08-07 the state is set before the await, and is therefore not redundant
    // with the setState at the end of the function
    this.setState({ loadingContent: true })
    const response = await handleFetchResult(await getFileContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id))
    const content = response.body
    switch (response.apiResponse.status) {
      case 200: {
        const previewInfoResponse = await handleFetchResult(
          await getFileRevisionPreviewInfo(
            state.config.apiUrl,
            content.workspace_id,
            content.content_id,
            content.current_revision_id
          )
        )
        const filenameNoExtension = removeExtensionOfFilename(response.body.filename)
        this.setState({
          loadingContent: false,
          content,
          mode: APP_FEATURE_MODE.VIEW,
          previewInfo: previewInfoResponse.body
        })
        this.setHeadTitle(filenameNoExtension)
        this.buildBreadcrumbs(content)
        break
      }
      default:
        sendGlobalFlashMessage(props.t('Error while loading file'))
        return
    }

    await putMyselfFileRead(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
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
      default: sendGlobalFlashMessage(props.t('Error while loading share links list')); break
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

  handleLoadMoreTimelineItems = async () => {
    const { props } = this

    if (this.isLoadMoreTimelineInProgress) return

    this.isLoadMoreTimelineInProgress = true
    await props.loadMoreTimelineItems(getFileRevision)
    this.isLoadMoreTimelineInProgress = false
  }

  handleClickBtnCloseApp = () => {
    const { state, props } = this

    if (state.progressUpload.display) {
      sendGlobalFlashMessage(props.t('Please wait until the upload ends'))
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
        if (fetchPutUserConfiguration.status !== 204) { sendGlobalFlashMessage(props.t('Error while saving the user configuration')) }
        break
      }
      case 400:
        switch (fetchResultSaveFile.body.code) {
          case 2041: break // same description sent, no need for error msg
          default: sendGlobalFlashMessage(props.t('Error while saving the new description'))
        }
        break
      default: sendGlobalFlashMessage(props.t('Error while saving the new description'))
    }
  }

  handleChangeNewComment = e => {
    const { props, state } = this
    props.appContentChangeComment(e, state.content, this.setState.bind(this), state.appName)
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

  handleClickRestoreDelete = async () => {
    const { props, state } = this
    props.appContentRestoreDelete(state.content, this.setState.bind(this), state.config.slug)
  }

  handleClickShowRevision = async revision => {
    const { state, props } = this

    const revisionArray = props.timeline.filter(t => t.timelineType === 'revision')
    const isLastRevision = revision.revision_id === revisionArray[revisionArray.length - 1].revision_id

    if (state.mode === APP_FEATURE_MODE.REVISION && isLastRevision) {
      this.handleClickLastVersion()
      return
    }

    if (state.mode === APP_FEATURE_MODE.VIEW && isLastRevision) return

    this.setState(prev => ({
      content: {
        ...prev.content,
        ...revision,
        workspace_id: state.content.workspace_id, // don't overrides workspace_id because if file has been moved to a different workspace, workspace_id will change and break image urls
        current_revision_id: revision.revision_id,
        is_archived: prev.is_archived, // archived and delete should always be taken from last version
        is_deleted: prev.is_deleted
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
    this.loadContent()
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
            if (fetchPutUserConfiguration.status !== 204) { sendGlobalFlashMessage(props.t('Error while saving the user configuration')) }
            break
          }
          case 400: {
            const jsonResult400 = JSON.parse(xhr.responseText)
            switch (jsonResult400.code) {
              case 3002: sendGlobalFlashMessage(props.t('A content with the same name already exists')); break
              case 6002: sendGlobalFlashMessage(props.t('The file is larger than the maximum file size allowed')); break
              case 6003: sendGlobalFlashMessage(props.t('Error, the space exceed its maximum size')); break
              case 6004: sendGlobalFlashMessage(props.t('You have reached your storage limit, you cannot add new files')); break
              default: sendGlobalFlashMessage(props.t('Error while uploading file')); break
            }
            break
          }
          default: sendGlobalFlashMessage(props.t('Error while uploading file'))
        }
      }
    }

    xhr.send(formData)
  }

  handleClickPreviousNextPage = async previousNext => {
    const { state } = this

    if (!['previous', 'next'].includes(previousNext)) return
    if (previousNext === 'previous' && state.fileCurrentPage === 0) return
    if (previousNext === 'next' && state.fileCurrentPage > state.previewInfo.page_nb) return

    const nextPageNumber = previousNext === 'previous' ? state.fileCurrentPage - 1 : state.fileCurrentPage + 1

    this.setState(prev => ({
      fileCurrentPage: nextPageNumber
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
      sendGlobalFlashMessage(props.t('The password is too short (minimum 6 characters)'))
      return false
    }

    if (isPasswordActive && state.sharePassword.length > 512) {
      sendGlobalFlashMessage(props.t('The password is too long (maximum 512 characters)'))
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
            sendGlobalFlashMessage(props.t('The password length must be between 6 and 512 characters and the email(s) must be valid'))
            break
          default: sendGlobalFlashMessage(props.t('Error while creating new share link'))
        }
        break
      default: sendGlobalFlashMessage(props.t('Error while creating new share link'))
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
        sendGlobalFlashMessage(this.props.t(`Error: ${invalidEmails} are not valid`))
      } else {
        this.setState({ shareEmails: emailList.join('\n') })
      }
    }
  }

  handleCancelSave = () => this.setState({ showInvalidMentionPopupInComment: false })

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
        sendGlobalFlashMessage(props.t('Error in the URL'))
        state.config.history.push(PAGE.LOGIN)
        break
      default: sendGlobalFlashMessage(props.t('Error while deleting share link'))
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
    `${this.getDownloadBaseUrl(apiUrl, content, mode)}raw/${encodeURIComponent(content.filename)}?force_download=1&revision_id=${content.current_revision_id}`

  getDownloadPdfPageUrl = ({ config: { apiUrl }, content, mode, fileCurrentPage }) => {
    // FIXME - b.l - refactor urls
    const filenameNoExtension = content.filename ? encodeURIComponent(removeExtensionOfFilename(content.filename) + '.pdf') : 'unknown.pdf'
    return `${this.getDownloadBaseUrl(apiUrl, content, mode)}preview/pdf/${filenameNoExtension}?page=${fileCurrentPage}&force_download=1&revision_id=${content.current_revision_id}`
  }

  getDownloadPdfFullUrl = ({ config: { apiUrl }, content, mode }) => {
    // FIXME - b.l - refactor urls
    const filenameNoExtension = content.filename ? encodeURIComponent(removeExtensionOfFilename(content.filename) + '.pdf') : 'unknown.pdf'
    return `${this.getDownloadBaseUrl(apiUrl, content, mode)}preview/pdf/full/${filenameNoExtension}?force_download=1&revision_id=${content.current_revision_id}`
  }

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
        <PopinFixedRightPartContent
          label={props.t('Timeline')}
        >
          <Timeline
            contentId={state.content.content_id}
            contentType={state.content.content_type}
            loading={props.loadingTimeline}
            customClass={`${state.config.slug}__contentpage`}
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
          />
        </PopinFixedRightPartContent>
      ) : null
    }
    const tag = {
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
    const propertiesObject = {
      id: 'properties',
      label: props.t('Properties'),
      icon: 'fa-info-circle',
      children: (
        <PopinFixedRightPartContent
          label={props.t('Properties')}
        >
          <FileProperties
            color={state.config.hexcolor}
            fileType={state.content.mimetype}
            fileSize={displayFileSize(state.content.size)}
            filePageNb={state.previewInfo.page_nb}
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
        </PopinFixedRightPartContent>
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
            <PopinFixedRightPartContent
              label={props.t('Share')}
            >
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
            </PopinFixedRightPartContent>
          )
        },
        propertiesObject

      ]
    } else {
      return [timelineObject, tag, propertiesObject]
    }
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

    const revisionList = props.timeline.filter(t => t.timelineType === 'revision')
    const contentVersionNumber = (revisionList.find(t => t.revision_id === state.content.current_revision_id) || { version_number: 1 }).version_number
    const lastVersionNumber = (revisionList[revisionList.length - 1] || { version_number: 1 }).version_number
    const filenameWithoutExtension = state.loadingContent ? '' : removeExtensionOfFilename(state.content.filename)
    const previewUrl = buildFilePreviewUrl(
      state.config.apiUrl,
      state.content.workspace_id,
      state.content.content_id,
      state.content.current_revision_id,
      filenameWithoutExtension,
      state.fileCurrentPage,
      500,
      500
    )
    const lightboxUrlList = (new Array(state.previewInfo.page_nb))
      .fill(null)
      .map((n, index) => // create an array [1..revision.page_nb]
        buildFilePreviewUrl(
          state.config.apiUrl,
          state.content.workspace_id,
          state.content.content_id,
          state.content.current_revision_id,
          filenameWithoutExtension,
          index + 1,
          1920,
          1080
        )
      )

    return (
      <PopinFixed
        customClass={`${state.config.slug}`}
        customColor={state.config.hexcolor}
      >
        <PopinFixedContent
          loading={state.loadingContent}
          appMode={state.mode}
          availableStatuses={state.config.availableStatuses}
          breadcrumbsList={state.breadcrumbsList}
          componentTitle={<FilenameWithExtension file={state.content} />}
          content={state.content}
          config={state.config}
          customClass={`${state.config.slug}__contentpage`}
          disableChangeTitle={!state.content.is_editable}
          headerButtons={[
            {
              icon: 'fas fa-edit',
              label: onlineEditionAction ? props.t(onlineEditionAction.label) : '',
              onClick: onlineEditionAction ? onlineEditionAction.handleClick : undefined,
              showAction: onlineEditionAction && onlineEditionAction.action === ACTION_EDIT,
              disabled: state.mode !== APP_FEATURE_MODE.VIEW || !state.content.is_editable,
              dataCy: 'wsContentGeneric__option__menu__addversion'
            }, {
              icon: 'fas fa-upload',
              label: props.t('Upload a new version'),
              onClick: this.handleClickNewVersion,
              showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id &&
                (!onlineEditionAction || (onlineEditionAction && onlineEditionAction.action !== ACTION_EDIT)),
              disabled: state.mode !== APP_FEATURE_MODE.VIEW || !state.content.is_editable,
              dataCy: 'newVersionBtn'
            }
          ]}
          isRefreshNeeded={state.showRefreshWarning}
          contentVersionNumber={contentVersionNumber}
          lastVersion={lastVersionNumber}
          loggedUser={state.loggedUser}
          onChangeStatus={this.handleChangeStatus}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
          actionList={[
            {
              icon: 'fas fa-upload',
              label: props.t('Upload a new version'),
              onClick: this.handleClickNewVersion,
              showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id &&
                (onlineEditionAction && onlineEditionAction.action === ACTION_EDIT),
              disabled: state.mode !== APP_FEATURE_MODE.VIEW || !state.content.is_editable,
              dataCy: 'newVersionBtn'
            }, {
              icon: 'fas fa-play',
              label: props.t('Play video'),
              onClick: () => this.setState({ previewVideo: true }),
              showAction: isVideoMimeTypeAndIsAllowed(state.content.mimetype, DISALLOWED_VIDEO_MIME_TYPE_LIST),
              dataCy: 'popinListItem__playVideo'
            }, {
              icon: 'fas fa-edit',
              label: onlineEditionAction ? props.t(onlineEditionAction.label) : '',
              onClick: onlineEditionAction ? onlineEditionAction.handleClick : undefined,
              showAction: onlineEditionAction && onlineEditionAction.action !== ACTION_EDIT,
              disabled: state.mode !== APP_FEATURE_MODE.VIEW || !state.content.is_editable,
              dataCy: 'wsContentGeneric__option__menu__addversion'
            }, {
              icon: 'far fa-file',
              label: props.t('Download current page as PDF'),
              downloadLink: this.getDownloadPdfPageUrl(state),
              showAction: state.previewInfo.has_pdf_preview,
              dataCy: 'popinListItem__downloadPageAsPdf'
            }, {
              icon: 'far fa-file-pdf',
              label: props.t('Download as PDF'),
              downloadLink: this.getDownloadPdfFullUrl(state),
              showAction: state.previewInfo.has_pdf_preview,
              dataCy: 'popinListItem__downloadAsPdf'
            }, {
              icon: 'fas fa-download',
              label: props.t('Download file'),
              downloadLink: this.getDownloadRawUrl(state),
              showAction: true,
              dataCy: 'popinListItem__downloadFile'
            }, {
              icon: 'far fa-trash-alt',
              label: props.t('Delete'),
              onClick: this.handleClickDelete,
              showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id,
              disabled: state.mode === APP_FEATURE_MODE.REVISION || state.content.is_archived || state.content.is_deleted,
              dataCy: 'popinListItem__delete'
            }
          ]}
          showReactions
          favoriteState={props.isContentInFavoriteList(state.content, state)
            ? FAVORITE_STATE.FAVORITE
            : FAVORITE_STATE.NOT_FAVORITE}
          onClickAddToFavoriteList={() => props.addContentToFavoriteList(
            state.content, state.loggedUser, this.setState.bind(this)
          )}
          onClickRemoveFromFavoriteList={() => props.removeContentFromFavoriteList(
            state.content, state.loggedUser, this.setState.bind(this)
          )}
        >
          {/* FIXME - GB - 2019-06-05 - we need to have a better way to check the state.config than using state.config.availableStatuses[3].slug
            https://github.com/tracim/tracim/issues/1840 */}
          <FileComponent
            editionAuthor={state.editionAuthor}
            isRefreshNeeded={state.showRefreshWarning}
            mode={state.mode}
            customColor={state.config.hexcolor}
            loggedUser={state.loggedUser}
            previewUrl={previewUrl}
            isJpegAvailable={state.previewInfo.has_jpeg_preview}
            filePageNb={state.previewInfo.page_nb}
            fileCurrentPage={state.fileCurrentPage}
            mimeType={state.content.mimetype}
            isArchived={state.content.is_archived}
            isDeleted={state.content.is_deleted}
            isDeprecated={state.content.status === state.config.availableStatuses[3].slug}
            deprecatedStatus={state.config.availableStatuses[3]}
            onClickRestoreArchived={this.handleClickRestoreArchive}
            onClickRestoreDeleted={this.handleClickRestoreDelete}
            downloadRawUrl={this.getDownloadRawUrl(state)}
            isPdfAvailable={state.previewInfo.has_pdf_preview}
            downloadPdfPageUrl={this.getDownloadPdfPageUrl(state)}
            downloadPdfFullUrl={this.getDownloadPdfFullUrl(state)}
            lightboxUrlList={lightboxUrlList}
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
