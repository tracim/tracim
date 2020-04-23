import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import FileComponent from '../component/FileComponent.jsx'
import {
  appContentFactory,
  addAllResourceI18n,
  handleFetchResult,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  PopinFixedRightPart,
  Timeline,
  NewVersionBtn,
  GenericButton,
  ArchiveDeleteContent,
  SelectStatus,
  displayDistanceDate,
  generateLocalStorageContentId,
  Badge,
  BREADCRUMBS_TYPE,
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
  FILE_PREVIEW_STATE
} from 'tracim_frontend_lib'
import { PAGE } from '../helper.js'
import { debug } from '../debug.js'
import {
  deleteShareLink,
  getFileContent,
  getFileComment,
  getFileRevision,
  getShareLinksList,
  postShareLinksList,
  putFileContent,
  putMyselfFileRead
} from '../action.async.js'
import FileProperties from '../component/FileProperties.jsx'

class File extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'file',
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      timeline: [],
      externalTranslationList: [
        props.t('File'),
        props.t('Files'),
        props.t('file'),
        props.t('files'),
        props.t('Upload files')
      ],
      newComment: '',
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
      shareLinkList: []
    }
    this.refContentLeftTop = React.createRef()

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    const { props, state } = this
    switch (type) {
      case CUSTOM_EVENT.SHOW_APP(state.config.slug):
        console.log('%c<File> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), this.buildBreadcrumbs)
        if (data.content.content_id === state.content.content_id) this.setHeadTitle(state.content.label)
        break

      case CUSTOM_EVENT.HIDE_APP(state.config.slug):
        console.log('%c<File> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
        break

      case CUSTOM_EVENT.RELOAD_CONTENT(state.config.slug):
        console.log('%c<File> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerReloadContent(data, this.setState.bind(this), state.appName)
        break

      case CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(state.config.slug):
        console.log('%c<File> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerReloadAppFeatureData(this.loadContent, this.loadTimeline, this.buildBreadcrumbs)
        break

      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<File> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerAllAppChangeLanguage(
          data, this.setState.bind(this), i18n, state.timelineWysiwyg, this.handleChangeNewComment
        )
        this.loadTimeline()
        break
    }
  }

  async componentDidMount () {
    console.log('%c<File> did mount', `color: ${this.state.config.hexcolor}`)
    const { state } = this

    const previouslyUnsavedComment = localStorage.getItem(
      generateLocalStorageContentId(state.content.workspace_id, state.content.content_id, state.appName, 'comment')
    )
    if (previouslyUnsavedComment) this.setState({ newComment: previouslyUnsavedComment })

    await this.loadContent()
    this.loadTimeline()
    this.buildBreadcrumbs()
    if (state.config.workspace.downloadEnabled) this.loadShareLinkList()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<File> did update', `color: ${this.state.config.hexcolor}`, prevState, state)
    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) {
      this.setState({ fileCurrentPage: 1 })
      await this.loadContent(1)
      this.loadTimeline()
      this.buildBreadcrumbs()
      if (state.config.workspace.downloadEnabled) {
        this.setState({})
        this.loadShareLinkList()
      }
    }

    if (!prevState.timelineWysiwyg && state.timelineWysiwyg) wysiwyg('#wysiwygTimelineComment', state.loggedUser.lang, this.handleChangeNewComment)
    else if (prevState.timelineWysiwyg && !state.timelineWysiwyg) tinymce.remove('#wysiwygTimelineComment')
  }

  componentWillUnmount () {
    console.log('%c<File> will Unmount', `color: ${this.state.config.hexcolor}`)
    tinymce.remove('#wysiwygTimelineComment')
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
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

    if (state.config && state.config.system && state.config.system.config && state.config.workspace && state.isVisible) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([contentName, state.config.workspace.label, state.config.system.config.instance_name]) }
      })
    }
  }

  loadContent = async (pageToLoad = null) => {
    const { state, props } = this

    const response = await handleFetchResult(await getFileContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id))

    switch (response.apiResponse.status) {
      case 200:
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
          mode: APP_FEATURE_MODE.VIEW
        })
        this.setHeadTitle(filenameNoExtension)
        break
      default:
        this.sendGlobalFlashMessage(props.t('Error while loading file'))
        return
    }

    await putMyselfFileRead(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
  }

  loadTimeline = async () => {
    const { props, state } = this

    const [resComment, resRevision] = await Promise.all([
      handleFetchResult(await getFileComment(state.config.apiUrl, state.content.workspace_id, state.content.content_id)),
      handleFetchResult(await getFileRevision(state.config.apiUrl, state.content.workspace_id, state.content.content_id))
    ])

    if (resComment.apiResponse.status !== 200 && resRevision.apiResponse.status !== 200) {
      this.sendGlobalFlashMessage(props.t('Error while loading timeline'))
      console.log('Error loading timeline', 'comments', resComment, 'revisions', resRevision)
      return
    }

    const revisionWithComment = props.buildTimelineFromCommentAndRevision(resComment.body, resRevision.body, state.loggedUser.lang)

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

  buildBreadcrumbs = () => {
    const { state } = this

    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.APPEND_BREADCRUMBS,
      data: {
        breadcrumbs: [{
          // FIXME - b.l - refactor urls
          url: `/ui/workspaces/${state.content.workspace_id}/contents/${state.config.slug}/${state.content.content_id}`,
          label: `${state.content.filename}`,
          link: null,
          type: BREADCRUMBS_TYPE.APP_FEATURE
        }]
      }
    })
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
      await putFileContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id, state.content.label, newDescription)
    )
    switch (fetchResultSaveFile.apiResponse.status) {
      case 200: this.setState(prev => ({ content: { ...prev.content, raw_content: newDescription } })); break
      case 400:
        switch (fetchResultSaveFile.body.code) {
          case 2041: break // same description sent, no need for error msg
          default: this.sendGlobalFlashMessage(props.t('Error while saving new description'))
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new description'))
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

  handleClickValidateNewCommentBtn = () => {
    const { props, state } = this
    props.appContentSaveNewComment(state.content, state.timelineWysiwyg, state.newComment, this.setState.bind(this), state.config.slug)
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
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.withCredentials = true

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        switch (xhr.status) {
          case 204:
            this.setState({
              newFile: '',
              newFilePreview: FILE_PREVIEW_STATE.NO_FILE,
              fileCurrentPage: 1,
              mode: APP_FEATURE_MODE.VIEW
            })
            this.loadContent(1)
            this.loadTimeline()
            break
          case 400:
            const jsonResult400 = JSON.parse(xhr.responseText)
            switch (jsonResult400.code) {
              case 3002: this.sendGlobalFlashMessage(props.t('A content with the same name already exists')); break
              case 6002: this.sendGlobalFlashMessage(props.t('The file is larger than the maximum file size allowed')); break
              case 6003: this.sendGlobalFlashMessage(props.t('Error, the shared space exceed its maximum size')); break
              case 6004: this.sendGlobalFlashMessage(props.t('You have reach your storage limit, you cannot add new files')); break
              default: this.sendGlobalFlashMessage(props.t('Error while uploading file')); break
            }
            break
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
    let invalidEmails = []

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
      let invalidEmails = []

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
        props.history.push(PAGE.LOGIN)
        break
      default: this.sendGlobalFlashMessage(props.t('Error while deleting share link'))
    }
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
    `${this.getDownloadBaseUrl(apiUrl, content, mode)}raw/${content.filenameNoExtension}${content.file_extension}?force_download=1&revision_id=${content.current_revision_id}`

  getDownloadPdfPageUrl = ({ config: { apiUrl }, content, mode, fileCurrentPage }) =>
    // FIXME - b.l - refactor urls
    `${this.getDownloadBaseUrl(apiUrl, content, mode)}preview/pdf/${content.filenameNoExtension + '.pdf'}?page=${fileCurrentPage}&force_download=1&revision_id=${content.current_revision_id}`

  getDownloadPdfFullUrl = ({ config: { apiUrl }, content, mode }) =>
    // FIXME - b.l - refactor urls
    `${this.getDownloadBaseUrl(apiUrl, content, mode)}preview/pdf/full/${content.filenameNoExtension + '.pdf'}?force_download=1&revision_id=${content.current_revision_id}`

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
      children: (
        <Timeline
          customClass={`${state.config.slug}__contentpage`}
          customColor={state.config.hexcolor}
          loggedUser={state.loggedUser}
          timelineData={state.timeline}
          newComment={state.newComment}
          disableComment={state.mode === APP_FEATURE_MODE.REVISION || state.mode === APP_FEATURE_MODE.EDIT || !state.content.is_editable}
          availableStatusList={state.config.availableStatuses}
          wysiwyg={state.timelineWysiwyg}
          onChangeNewComment={this.handleChangeNewComment}
          onClickValidateNewCommentBtn={this.handleClickValidateNewCommentBtn}
          onClickWysiwygBtn={this.handleToggleWysiwyg}
          onClickRevisionBtn={this.handleClickShowRevision}
          shouldScrollToBottom={state.mode !== APP_FEATURE_MODE.REVISION}
          key={'Timeline'}
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
          description={state.content.raw_content}
          displayChangeDescriptionBtn={state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id}
          disableChangeDescription={!state.content.is_editable}
          onClickValidateNewDescription={this.handleClickValidateNewDescription}
          key={'FileProperties'}
        />
      )
    }

    if (state.config.workspace.downloadEnabled && state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id) {
      return [
        timelineObject,
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
              key={'ShareDownload'}
            />
          )
        },
        propertiesObject
      ]
    } else {
      return [ timelineObject, propertiesObject ]
    }
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
          componentTitle={<span>{state.content.label} <Badge text={state.content.file_extension} /></span>}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
          disableChangeTitle={!state.content.is_editable}
        />

        <PopinFixedOption
          customColor={state.config.hexcolor}
          customClass={`${state.config.slug}`}
          i18n={i18n}
        >
          <div /* this div in display flex, justify-content space-between */>
            <div className='d-flex'>
              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && (
                <NewVersionBtn
                  customColor={state.config.hexcolor}
                  onClickNewVersionBtn={this.handleClickNewVersion}
                  disabled={state.mode !== APP_FEATURE_MODE.VIEW || !state.content.is_editable}
                  label={props.t('Upload a new version')}
                  icon='upload'
                />
              )}

              {onlineEditionAction && (
                <GenericButton
                  customClass={`${state.config.slug}__option__menu__editBtn btn outlineTextBtn`}
                  dataCy='wsContentGeneric__option__menu__addversion'
                  customColor={state.config.hexcolor}
                  onClick={onlineEditionAction.callback}
                  disabled={state.mode !== APP_FEATURE_MODE.VIEW || !state.content.is_editable}
                  label={props.t(onlineEditionAction.label)}
                  style={{
                    marginLeft: '5px'
                  }}
                  faIcon={'edit'}
                />
              )}

              {state.mode === APP_FEATURE_MODE.REVISION && (
                <button
                  className='wsContentGeneric__option__menu__lastversion file__lastversionbtn btn'
                  onClick={this.handleClickLastVersion}
                  style={{ backgroundColor: state.config.hexcolor, color: '#fdfdfd' }}
                  data-cy='appFileLastVersionBtn'
                >
                  <i className='fa fa-history' />
                  {props.t('Last version')}
                </button>
              )}
            </div>

            <div className='d-flex'>
              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && (
                <SelectStatus
                  selectedStatus={state.config.availableStatuses.find(s => s.slug === state.content.status)}
                  availableStatus={state.config.availableStatuses}
                  onChangeStatus={this.handleChangeStatus}
                  disabled={state.mode === APP_FEATURE_MODE.REVISION || state.content.is_archived || state.content.is_deleted}
                  mobileVersion={onlineEditionAction}
                />
              )}

              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id && (
                <ArchiveDeleteContent
                  customColor={state.config.hexcolor}
                  onClickArchiveBtn={this.handleClickArchive}
                  onClickDeleteBtn={this.handleClickDelete}
                  disabled={state.mode === APP_FEATURE_MODE.REVISION || state.content.is_archived || state.content.is_deleted}
                />
              )}
            </div>
          </div>
        </PopinFixedOption>

        <PopinFixedContent
          customClass={`${state.config.slug}__contentpage`}
        >
          {/* FIXME - GB - 2019-06-05 - we need to have a better way to check the state.config than using state.config.availableStatuses[3].slug
            https://github.com/tracim/tracim/issues/1840 */}
          <FileComponent
            mode={state.mode}
            customColor={state.config.hexcolor}
            loggedUser={state.loggedUser}
            previewUrl={state.content.previewUrl ? state.content.previewUrl : ''}
            isJpegAvailable={state.content.has_jpeg_preview}
            filePageNb={state.content.page_nb}
            fileCurrentPage={state.fileCurrentPage}
            version={state.content.number}
            lastVersion={state.timeline.filter(t => t.timelineType === 'revision').length}
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
            ref={this.refContentLeftTop}
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

export default translate()(appContentFactory(File))
