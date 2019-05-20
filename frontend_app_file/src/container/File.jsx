import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import FileComponent from '../component/FileComponent.jsx'
import {
  addAllResourceI18n,
  handleFetchResult,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  Timeline,
  NewVersionBtn,
  ArchiveDeleteContent,
  SelectStatus,
  displayDistanceDate,
  convertBackslashNToBr,
  generateLocalStorageContentId,
  Badge,
  BREADCRUMBS_TYPE,
  appFeatureCustomEventHandlerShowApp
} from 'tracim_frontend_lib'
import {
  MODE,
  removeExtensionOfFilename,
  displayFileSize,
  debug
} from '../helper.js'
import {
  getFileContent,
  getFileComment,
  getFileRevision,
  postFileNewComment,
  putFileContent,
  putFileStatus,
  putFileIsArchived,
  putFileIsDeleted,
  putFileRestoreArchived,
  putFileRestoreDeleted,
  putMyselfFileRead
} from '../action.async.js'

class File extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'file',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      timeline: props.data ? [] : [], // debug.timeline,
      externalTranslationList: [
        props.t('File'),
        props.t('Files'),
        props.t('file'),
        props.t('files'),
        props.t('Upload a file')
      ],
      newComment: '',
      newFile: '',
      newFilePreview: null,
      fileCurrentPage: 1,
      timelineWysiwyg: false,
      mode: MODE.VIEW,
      displayProperty: false,
      progressUpload: {
        display: false,
        percent: 0
      }
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    const { state } = this
    switch (type) {
      case 'file_showApp':
        console.log('%c<File> Custom event', 'color: #28a745', type, data)
        const isSameContentId = appFeatureCustomEventHandlerShowApp(data.content, state.content.content_id, state.content.content_type)
        if (isSameContentId) this.setState({isVisible: true})
        break

      case 'file_hideApp':
        console.log('%c<File> Custom event', 'color: #28a745', type, data)
        tinymce.remove('#wysiwygTimelineComment')
        this.setState({
          isVisible: false,
          timelineWysiwyg: false
        })
        break

      case 'file_reloadContent':
        console.log('%c<File> Custom event', 'color: #28a745', type, data)
        tinymce.remove('#wysiwygTimelineComment')

        const previouslyUnsavedComment = localStorage.getItem(
          generateLocalStorageContentId(data.workspace_id, data.content_id, state.appName, 'comment')
        )

        this.setState(prev => ({
          content: {...prev.content, ...data},
          isVisible: true,
          timelineWysiwyg: false,
          newComment: prev.content.content_id === data.content_id ? prev.newComment : previouslyUnsavedComment || ''
        }))
        break

      case 'allApp_changeLang':
        console.log('%c<File> Custom event', 'color: #28a745', type, data)

        if (state.timelineWysiwyg) {
          tinymce.remove('#wysiwygTimelineComment')
          wysiwyg('#wysiwygTimelineComment', data, this.handleChangeNewComment)
        }

        this.setState(prev => ({
          loggedUser: {
            ...prev.loggedUser,
            lang: data
          }
        }))
        i18n.changeLanguage(data)
        this.loadTimeline()
        break
    }
  }

  async componentDidMount () {
    console.log('%c<File> did mount', `color: ${this.state.config.hexcolor}`)

    const { appName, content } = this.state
    const previouslyUnsavedComment = localStorage.getItem(
      generateLocalStorageContentId(content.workspace_id, content.content_id, appName, 'comment')
    )
    if (previouslyUnsavedComment) this.setState({newComment: previouslyUnsavedComment})

    await this.loadContent()
    this.loadTimeline()
    this.buildBreadcrumbs()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<File> did update', `color: ${this.state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) {
      await this.loadContent()
      this.loadTimeline()
      this.buildBreadcrumbs()
    }

    if (!prevState.timelineWysiwyg && state.timelineWysiwyg) wysiwyg('#wysiwygTimelineComment', state.loggedUser.lang, this.handleChangeNewComment)
    else if (prevState.timelineWysiwyg && !state.timelineWysiwyg) tinymce.remove('#wysiwygTimelineComment')
  }

  componentWillUnmount () {
    console.log('%c<File> will Unmount', `color: ${this.state.config.hexcolor}`)
    tinymce.remove('#wysiwygTimelineComment')
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: 'addFlashMsg',
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  loadContent = async (pageToLoad = null) => {
    const { content, config, fileCurrentPage } = this.state

    const fetchResultFile = await handleFetchResult(await getFileContent(config.apiUrl, content.workspace_id, content.content_id))

    switch (fetchResultFile.apiResponse.status) {
      case 200:
        const filenameNoExtension = removeExtensionOfFilename(fetchResultFile.body.filename)
        const pageForPreview = pageToLoad || fileCurrentPage
        this.setState({
          content: {
            ...fetchResultFile.body,
            filenameNoExtension: filenameNoExtension,
            previewUrl: `${config.apiUrl}/workspaces/${content.workspace_id}/files/${content.content_id}/revisions/${fetchResultFile.body.current_revision_id}/preview/jpg/500x500/${filenameNoExtension + '.jpg'}?page=${pageForPreview}`,
            lightboxUrlList: (new Array(fetchResultFile.body.page_nb)).fill('').map((n, i) =>
              `${config.apiUrl}/workspaces/${content.workspace_id}/files/${content.content_id}/revisions/${fetchResultFile.body.current_revision_id}/preview/jpg/1920x1080/${filenameNoExtension + '.jpg'}?page=${i + 1}`
            )
          }
        })
        break
      default:
        this.sendGlobalFlashMessage(this.props.t('Error while loading file'))
        return
    }

    await putMyselfFileRead(config.apiUrl, content.workspace_id, content.content_id)
    GLOBAL_dispatchEvent({type: 'refreshContentList', data: {}})
  }

  loadTimeline = async () => {
    const { loggedUser, content, config, t } = this.state

    const [resComment, resRevision] = await Promise.all([
      handleFetchResult(await getFileComment(config.apiUrl, content.workspace_id, content.content_id)),
      handleFetchResult(await getFileRevision(config.apiUrl, content.workspace_id, content.content_id))
    ])

    if (resComment.apiResponse.status !== 200 && resRevision.apiResponse.status !== 200) {
      this.sendGlobalFlashMessage(t('Error while loading timeline'))
      console.log('Error loading timeline', 'comments', resComment, 'revisions', resRevision)
      return
    }

    const resCommentWithProperDate = resComment.body.map(c => ({
      ...c,
      created_raw: c.created,
      created: displayDistanceDate(c.created, loggedUser.lang)
    }))

    const revisionWithComment = resRevision.body
      .map((r, i) => ({
        ...r,
        created_raw: r.created,
        created: displayDistanceDate(r.created, loggedUser.lang),
        timelineType: 'revision',
        commentList: r.comment_ids.map(ci => ({
          timelineType: 'comment',
          ...resCommentWithProperDate.find(c => c.content_id === ci)
        })),
        number: i + 1
      }))
      .reduce((acc, rev) => [
        ...acc,
        rev,
        ...rev.commentList.map(comment => ({
          ...comment,
          customClass: '',
          loggedUser: config.loggedUser
        }))
      ], [])

    this.setState({
      timeline: revisionWithComment
    })
  }

  buildBreadcrumbs = () => {
    const { state } = this

    GLOBAL_dispatchEvent({
      type: 'appendBreadcrumbs',
      data: {
        breadcrumbs: [{
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
    GLOBAL_dispatchEvent({type: 'appClosed', data: {}}) // handled by tracim_front::src/container/WorkspaceContent.jsx
  }

  handleSaveEditTitle = async newTitle => {
    const { props, state } = this

    const fetchResultSaveFile = await handleFetchResult(
      await putFileContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id, newTitle, state.content.raw_content)
    )

    switch (fetchResultSaveFile.apiResponse.status) {
      case 200:
        this.loadContent()
        this.loadTimeline()
        GLOBAL_dispatchEvent({ type: 'refreshContentList', data: {} })
        break
      case 400:
        switch (fetchResultSaveFile.body.code) {
          case 2041: break // INFO - CH - 2019-04-04 - this means the same title has been sent. Therefore, no modification
          case 3002: this.sendGlobalFlashMessage(props.t('A content with same name already exists')); break
          default: this.sendGlobalFlashMessage(props.t('Error while saving new title')); break
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new title')); break
    }
  }

  handleClickNewVersion = () => this.setState({mode: MODE.EDIT})

  handleClickValidateNewDescription = async newDescription => {
    const { props, state } = this

    const fetchResultSaveFile = await handleFetchResult(
      await putFileContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id, state.content.label, newDescription)
    )
    switch (fetchResultSaveFile.apiResponse.status) {
      case 200: this.setState(prev => ({content: {...prev.content, raw_content: newDescription}})); break
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
    const newComment = e.target.value
    this.setState({newComment})

    const { appName, content } = this.state
    localStorage.setItem(
      generateLocalStorageContentId(content.workspace_id, content.content_id, appName, 'comment'),
      newComment
    )
  }

  handleClickValidateNewCommentBtn = async () => {
    const { props, state } = this

    // @FIXME - Côme - 2018/10/31 - line bellow is a hack to force send html to api
    // see https://github.com/tracim/tracim/issues/1101
    const newCommentForApi = state.timelineWysiwyg
      ? state.newComment
      : `<p>${convertBackslashNToBr(state.newComment)}</p>`

    const fetchResultSaveNewComment = await handleFetchResult(await postFileNewComment(state.config.apiUrl, state.content.workspace_id, state.content.content_id, newCommentForApi))

    switch (fetchResultSaveNewComment.apiResponse.status) {
      case 200:
        this.setState({newComment: ''})
        localStorage.removeItem(
          generateLocalStorageContentId(state.content.workspace_id, state.content.content_id, state.appName, 'comment')
        )
        if (state.timelineWysiwyg) tinymce.get('wysiwygTimelineComment').setContent('')
        this.loadContent()
        this.loadTimeline()
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new comment')); break
    }
  }

  handleToggleWysiwyg = () => this.setState(prev => ({timelineWysiwyg: !prev.timelineWysiwyg}))

  handleChangeStatus = async newStatus => {
    const { state, props } = this

    if (newStatus === state.content.status) return

    const fetchResultSaveEditStatus = await handleFetchResult(
      await putFileStatus(state.config.apiUrl, state.content.workspace_id, state.content.content_id, newStatus)
    )

    switch (fetchResultSaveEditStatus.status) {
      case 204:
        this.loadContent()
        this.loadTimeline()
        break
      default: this.sendGlobalFlashMessage(props.t('Error while changing status'))
    }
  }

  handleClickArchive = async () => {
    const { config, content } = this.state

    const fetchResultArchive = await putFileIsArchived(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_archived: true}}))
        this.loadContent()
        this.loadTimeline()
        break
      default: this.sendGlobalFlashMessage(this.props.t('Error while archiving document'))
    }
  }

  handleClickDelete = async () => {
    const { config, content } = this.state

    const fetchResultArchive = await putFileIsDeleted(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_deleted: true}}))
        this.loadContent()
        this.loadTimeline()
        break
      default: this.sendGlobalFlashMessage(this.props.t('Error while deleting document'))
    }
  }

  handleClickRestoreArchived = async () => {
    const { config, content } = this.state

    const fetchResultRestore = await putFileRestoreArchived(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultRestore.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_archived: false}}))
        this.loadContent()
        this.loadTimeline()
        break
      default: this.sendGlobalFlashMessage(this.props.t('Error while restoring document'))
    }
  }

  handleClickRestoreDeleted = async () => {
    const { config, content } = this.state

    const fetchResultRestore = await putFileRestoreDeleted(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultRestore.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_deleted: false}}))
        this.loadContent()
        this.loadTimeline()
        break
      default: this.sendGlobalFlashMessage(this.props.t('Error while restoring document'))
    }
  }

  handleClickShowRevision = async revision => {
    const { state } = this

    const revisionArray = state.timeline.filter(t => t.timelineType === 'revision')
    const isLastRevision = revision.revision_id === revisionArray[revisionArray.length - 1].revision_id

    if (state.mode === MODE.REVISION && isLastRevision) {
      this.handleClickLastVersion()
      return
    }

    if (state.mode === MODE.VIEW && isLastRevision) return

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
        previewUrl: `${state.config.apiUrl}/workspaces/${state.content.workspace_id}/files/${revision.content_id}/revisions/${revision.revision_id}/preview/jpg/500x500/${filenameNoExtension + '.jpg'}?page=1`,
        lightboxUrlList: (new Array(revision.page_nb)).fill(null).map((n, i) => i + 1).map(pageNb => // create an array [1..revision.page_nb]
          `${state.config.apiUrl}/workspaces/${state.content.workspace_id}/files/${revision.content_id}/revisions/${revision.revision_id}/preview/jpg/1920x1080/${filenameNoExtension + '.jpg'}?page=${pageNb}`
        )
      },
      fileCurrentPage: 1, // always set to first page on revision switch
      mode: MODE.REVISION
    }))
  }

  handleClickLastVersion = () => {
    this.setState({
      fileCurrentPage: 1,
      mode: MODE.VIEW
    })
    this.loadContent(1)
  }

  handleClickProperty = () => this.setState(prev => ({displayProperty: !prev.displayProperty}))

  handleChangeFile = newFile => {
    if (!newFile || !newFile[0]) return

    const fileToSave = newFile[0]

    if (fileToSave.type.includes('image') && fileToSave.size > 2000000) { // allow preview
      this.setState({newFile: fileToSave})

      var reader = new FileReader()
      reader.onload = e => {
        this.setState({newFilePreview: e.total > 0 ? e.target.result : false})
        const img = new Image()
        img.src = e.target.result
        img.onerror = () => this.setState({newFilePreview: false})
      }
      reader.readAsDataURL(fileToSave)
    } else { // no preview
      this.setState({
        newFile: fileToSave,
        newFilePreview: false
      })
    }
  }

  handleClickDropzoneCancel = () => this.setState({mode: MODE.VIEW, newFile: '', newFilePreview: null})

  handleClickDropzoneValidate = async () => {
    const { props, state } = this

    const formData = new FormData()
    formData.append('files', state.newFile)

    // fetch still doesn't handle event progress. So we need to use old school xhr object :scream:
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('loadstart', () => this.setState({progressUpload: {display: false, percent: 0}}), false)
    const uploadInProgress = e => e.lengthComputable && this.setState({progressUpload: {display: true, percent: Math.round(e.loaded / e.total * 100)}})
    xhr.upload.addEventListener('progress', uploadInProgress, false)
    xhr.upload.addEventListener('load', () => this.setState({progressUpload: {display: false, percent: 0}}), false)

    xhr.open('PUT', `${state.config.apiUrl}/workspaces/${state.content.workspace_id}/files/${state.content.content_id}/raw/${state.content.filename}`, true)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.withCredentials = true

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        switch (xhr.status) {
          case 204:
            this.setState({
              newFile: '',
              newFilePreview: null,
              fileCurrentPage: 1,
              mode: MODE.VIEW
            })
            this.loadContent(1)
            this.loadTimeline()
            break
          case 400:
            const jsonResult400 = JSON.parse(xhr.responseText)
            switch (jsonResult400.code) {
              case 3002: this.sendGlobalFlashMessage(props.t('A content with the same name already exists')); break
              default: this.sendGlobalFlashMessage(props.t('Error while uploading file'))
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

    const revisionString = state.mode === MODE.REVISION ? `revisions/${state.content.current_revision_id}/` : ''
    const nextPageNumber = previousNext === 'previous' ? state.fileCurrentPage - 1 : state.fileCurrentPage + 1

    this.setState(prev => ({
      fileCurrentPage: nextPageNumber,
      content: {
        ...prev.content,
        previewUrl: `${state.config.apiUrl}/workspaces/${state.content.workspace_id}/files/${state.content.content_id}/${revisionString}preview/jpg/500x500/${state.content.filenameNoExtension + '.jpg'}?page=${nextPageNumber}`
      }
    }))
  }

  render () {
    const { props, state } = this

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
          idRoleUserWorkspace={state.loggedUser.idRoleUserWorkspace}
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
              {state.loggedUser.idRoleUserWorkspace >= 2 &&
                <NewVersionBtn
                  customColor={state.config.hexcolor}
                  onClickNewVersionBtn={this.handleClickNewVersion}
                  disabled={state.mode !== MODE.VIEW || !state.content.is_editable}
                  label={props.t('Update')}
                />
              }

              {state.mode === MODE.REVISION &&
                <button
                  className='wsContentGeneric__option__menu__lastversion file__lastversionbtn btn'
                  onClick={this.handleClickLastVersion}
                  style={{backgroundColor: state.config.hexcolor, color: '#fdfdfd'}}
                >
                  <i className='fa fa-history' />
                  {props.t('Last version')}
                </button>
              }
            </div>

            <div className='d-flex'>
              {state.loggedUser.idRoleUserWorkspace >= 2 &&
                <SelectStatus
                  selectedStatus={state.config.availableStatuses.find(s => s.slug === state.content.status)}
                  availableStatus={state.config.availableStatuses}
                  onChangeStatus={this.handleChangeStatus}
                  disabled={state.mode === MODE.REVISION || state.content.is_archived || state.content.is_deleted}
                />
              }

              {state.loggedUser.idRoleUserWorkspace >= 4 &&
                <ArchiveDeleteContent
                  customColor={state.config.hexcolor}
                  onClickArchiveBtn={this.handleClickArchive}
                  onClickDeleteBtn={this.handleClickDelete}
                  disabled={state.mode === MODE.REVISION || state.content.is_archived || state.content.is_deleted}
                />
              }
            </div>
          </div>
        </PopinFixedOption>

        <PopinFixedContent
          customClass={`${state.config.slug}__contentpage`}
        >
          <FileComponent
            mode={state.mode}
            customColor={state.config.hexcolor}
            loggedUser={state.loggedUser}
            previewUrl={state.content.previewUrl ? state.content.previewUrl : ''}
            isJpegAvailable={state.content.has_jpeg_preview}
            fileSize={displayFileSize(state.content.size)}
            filePageNb={state.content.page_nb}
            fileCurrentPage={state.fileCurrentPage}
            displayProperty={state.displayProperty}
            onClickProperty={this.handleClickProperty}
            version={state.content.number}
            lastVersion={state.timeline.filter(t => t.timelineType === 'revision').length}
            description={state.content.raw_content}
            onClickValidateNewDescription={this.handleClickValidateNewDescription}
            isArchived={state.content.is_archived}
            isDeleted={state.content.is_deleted}
            isEditable={state.content.is_editable}
            onClickRestoreArchived={this.handleClickRestoreArchived}
            onClickRestoreDeleted={this.handleClickRestoreDeleted}
            downloadRawUrl={(({config: {apiUrl}, content, mode}) =>
              `${apiUrl}/workspaces/${content.workspace_id}/files/${content.content_id}/${mode === MODE.REVISION ? `revisions/${content.current_revision_id}/` : ''}raw/${content.filenameNoExtension}${content.file_extension}?force_download=1`
            )(state)}
            isPdfAvailable={state.content.has_pdf_preview}
            downloadPdfPageUrl={(({config: {apiUrl}, content, mode, fileCurrentPage}) =>
              `${apiUrl}/workspaces/${content.workspace_id}/files/${content.content_id}/${mode === MODE.REVISION ? `revisions/${content.current_revision_id}/` : ''}preview/pdf/${content.filenameNoExtension + '.pdf'}?page=${fileCurrentPage}&force_download=1`
            )(state)}
            downloadPdfFullUrl={(({config: {apiUrl}, content, mode}) =>
              `${apiUrl}/workspaces/${content.workspace_id}/files/${content.content_id}/${mode === MODE.REVISION ? `revisions/${content.current_revision_id}/` : ''}preview/pdf/full/${content.filenameNoExtension + '.pdf'}?force_download=1`
            )(state)}
            lightboxUrlList={state.content.lightboxUrlList}
            onChangeFile={this.handleChangeFile}
            onClickDropzoneCancel={this.handleClickDropzoneCancel}
            onClickDropzoneValidate={this.handleClickDropzoneValidate}
            onClickPreviousPage={() => this.handleClickPreviousNextPage('previous')}
            onClickNextPage={() => this.handleClickPreviousNextPage('next')}
            newFile={state.newFile}
            newFilePreview={state.newFilePreview}
            progressUpload={state.progressUpload}
          />

          <Timeline
            customClass={`${state.config.slug}__contentpage`}
            customColor={state.config.hexcolor}
            loggedUser={state.loggedUser}
            timelineData={state.timeline}
            newComment={state.newComment}
            disableComment={state.mode === MODE.REVISION || state.mode === MODE.EDIT || !state.content.is_editable}
            availableStatusList={state.config.availableStatuses}
            wysiwyg={state.timelineWysiwyg}
            onChangeNewComment={this.handleChangeNewComment}
            onClickValidateNewCommentBtn={this.handleClickValidateNewCommentBtn}
            onClickWysiwygBtn={this.handleToggleWysiwyg}
            onClickRevisionBtn={this.handleClickShowRevision}
            shouldScrollToBottom={state.mode !== MODE.REVISION}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(File)
