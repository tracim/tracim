import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import FileComponent from '../component/FileComponent.jsx'
import {
  addAllResourceI18n,
  handleFetchResult,
  generateAvatarFromPublicName,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  Timeline,
  NewVersionBtn,
  ArchiveDeleteContent,
  SelectStatus,
  displayDate
} from 'tracim_frontend_lib'
import { MODE, displayFileSize, debug } from '../helper.js'
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
  putFileRead
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
      externalTradList: [
        props.t('Upload a file'),
        props.t('Files')
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
    addAllResourceI18n(i18n, this.state.config.translation)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case 'file_showApp':
        console.log('%c<File> Custom event', 'color: #28a745', type, data)
        this.setState({isVisible: true})
        break
      case 'file_hideApp':
        console.log('%c<File> Custom event', 'color: #28a745', type, data)
        this.setState({isVisible: false})
        break
      case 'file_reloadContent':
        console.log('%c<File> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({content: {...prev.content, ...data}, isVisible: true}))
        break
      case 'allApp_changeLang':
        console.log('%c<File> Custom event', 'color: #28a745', type, data)
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

  componentDidMount () {
    console.log('%c<File> did mount', `color: ${this.state.config.hexcolor}`)

    this.loadContent()
    this.loadTimeline()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<File> did update', `color: ${this.state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) {
      this.loadContent()
      this.loadTimeline()
    }

    if (state.mode === MODE.EDIT && prevState.mode !== state.mode) {
      tinymce.remove('#wysiwygNewVersion')
      wysiwyg('#wysiwygNewVersion', this.handleChangeDescription)
    }

    if (!prevState.timelineWysiwyg && state.timelineWysiwyg) wysiwyg('#wysiwygTimelineComment', this.handleChangeNewComment)
    else if (prevState.timelineWysiwyg && !state.timelineWysiwyg) tinymce.remove('#wysiwygTimelineComment')
  }

  componentWillUnmount () {
    console.log('%c<File> will Unmount', `color: ${this.state.config.hexcolor}`)
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

  loadContent = async () => {
    const { loggedUser, content, config, fileCurrentPage } = this.state

    const fetchResultFile = getFileContent(config.apiUrl, content.workspace_id, content.content_id)

    await handleFetchResult(await fetchResultFile)
      .then(async resFile => this.setState({
        content: {
          ...resFile.body,
          previewUrl: `${config.apiUrl}/workspaces/${content.workspace_id}/files/${content.content_id}/revisions/${resFile.body.current_revision_id}/preview/jpg/500x500?page=${fileCurrentPage}`,
          contentFullScreenUrl: `${config.apiUrl}/workspaces/${content.workspace_id}/files/${content.content_id}/revisions/${resFile.body.current_revision_id}/preview/jpg/1920x1080?page=${fileCurrentPage}`
        }
      }))

    await putFileRead(loggedUser, config.apiUrl, content.workspace_id, content.content_id)
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

    const resCommentWithProperDateAndAvatar = resComment.body.map(c => ({
      ...c,
      created: displayDate(c.created, loggedUser.lang),
      author: {
        ...c.author,
        avatar_url: c.author.avatar_url ? c.author.avatar_url : generateAvatarFromPublicName(c.author.public_name)
      }
    }))

    const revisionWithComment = resRevision.body
      .map((r, i) => ({
        ...r,
        created: displayDate(r.created, loggedUser.lang),
        timelineType: 'revision',
        commentList: r.comment_ids.map(ci => ({
          timelineType: 'comment',
          ...resCommentWithProperDateAndAvatar.find(c => c.content_id === ci)
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
      timeline: revisionWithComment,
      mode: resRevision.body.length === 1 ? MODE.EDIT : MODE.VIEW // first time editing the doc, open in edit mode
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
    const { config, content } = this.state

    const fetchResultSaveFile = putFileContent(config.apiUrl, content.workspace_id, content.content_id, newTitle, content.raw_content)

    handleFetchResult(await fetchResultSaveFile)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.loadContent()
          this.loadTimeline()
          GLOBAL_dispatchEvent({ type: 'refreshContentList', data: {} })
        } else {
          console.warn('Error saving file. Result:', resSave, 'content:', content, 'config:', config)
        }
      })
  }

  handleClickNewVersion = () => this.setState({mode: MODE.EDIT})

  handleClickValidateNewDescription = async newDescription => {
    const { props, state } = this

    const fetchResultSaveFile = await handleFetchResult(
      await putFileContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id, state.content.label, newDescription)
    )
    switch (fetchResultSaveFile.apiResponse.status) {
      case 200: this.setState(prev => ({content: {...prev.content, raw_content: newDescription}})); break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new description'))
    }
  }

  handleChangeNewComment = e => {
    const newComment = e.target.value
    this.setState({newComment})
  }

  handleClickValidateNewCommentBtn = async () => {
    const { config, content, newComment } = this.state

    const fetchResultSaveNewComment = await postFileNewComment(config.apiUrl, content.workspace_id, content.content_id, newComment)

    handleFetchResult(await fetchResultSaveNewComment)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.setState({newComment: ''})
          if (this.state.timelineWysiwyg) tinymce.get('wysiwygTimelineComment').setContent('')
          this.loadContent()
          this.loadTimeline()
        } else {
          console.warn('Error saving file comment. Result:', resSave, 'content:', content, 'config:', config)
        }
      })
  }

  handleToggleWysiwyg = () => this.setState(prev => ({timelineWysiwyg: !prev.timelineWysiwyg}))

  handleChangeStatus = async newStatus => {
    const { config, content } = this.state

    const fetchResultSaveEditStatus = putFileStatus(config.apiUrl, content.workspace_id, content.content_id, newStatus)

    handleFetchResult(await fetchResultSaveEditStatus)
      .then(resSave => {
        if (resSave.status !== 204) { // 204 no content so dont take status from resSave.apiResponse.status
          console.warn('Error saving file comment. Result:', resSave, 'content:', content, 'config:', config)
        } else {
          this.loadContent()
          this.loadTimeline()
        }
      })
  }

  handleClickArchive = async () => {
    const { config, content } = this.state

    const fetchResultArchive = await putFileIsArchived(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_archived: true}}))
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

    this.setState(prev => ({
      content: {
        ...prev.content,
        label: revision.label,
        raw_content: revision.raw_content,
        number: revision.number,
        status: revision.status,
        current_revision_id: revision.revision_id,
        contentFull: null,
        is_archived: prev.is_archived, // archived and delete should always be taken from last version
        is_deleted: prev.is_deleted,
        previewUrl: `${state.config.apiUrl}/workspaces/${revision.workspace_id}/files/${revision.content_id}/revisions/${revision.revision_id}/preview/jpg/500x500?page=${state.fileCurrentPage}`,
        contentFullScreenUrl: `${state.config.apiUrl}/workspaces/${revision.workspace_id}/files/${revision.content_id}/revisions/${revision.revision_id}/preview/jpg/1920x1080?page=${state.fileCurrentPage}`
      },
      mode: MODE.REVISION
    }))
  }

  handleClickLastVersion = () => {
    this.loadContent()
    this.setState({mode: MODE.VIEW})
  }

  handleClickProperty = () => this.setState(prev => ({displayProperty: !prev.displayProperty}))

  handleChangeFile = newFile => {
    if (!newFile || !newFile[0]) return

    const fileToSave = newFile[0]
    this.setState({newFile: fileToSave})

    var reader = new FileReader()
    reader.onload = e => this.setState({newFilePreview: e.target.result})
    reader.readAsDataURL(fileToSave)
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

    xhr.open('PUT', `${state.config.apiUrl}/workspaces/${state.content.workspace_id}/files/${state.content.content_id}/raw`, true)
    // xhr.setRequestHeader('Authorization', 'Basic ' + state.loggedUser.auth)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.withCredentials = true

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        switch (xhr.status) {
          case 204:
            this.setState({
              newFile: '',
              newFilePreview: null
            })
            this.loadContent()
            this.loadTimeline()
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

    const revisionString = state.mode === MODE.REVISION ? `revisions/${state.content.current_revision_id}` : ''
    const nextPageNumber = previousNext === 'previous' ? state.fileCurrentPage - 1 : state.fileCurrentPage + 1

    this.setState(prev => ({
      fileCurrentPage: nextPageNumber,
      content: {
        ...prev.content,
        previewUrl: `${state.config.apiUrl}/workspaces/${state.content.workspace_id}/files/${state.content.content_id}/${revisionString}preview/jpg/500x500?page=${nextPageNumber}`,
        contentFullScreenUrl: `${state.config.apiUrl}/workspaces/${state.content.workspace_id}/files/${state.content.content_id}/${revisionString}preview/jpg/1920x1080?page=${nextPageNumber}`
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
          title={state.content.label}
          idRoleUserWorkspace={state.loggedUser.idRoleUserWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
          disableChangeTitle={state.content.is_archived || state.content.is_deleted}
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
                  disabled={state.mode !== MODE.VIEW || state.content.is_archived || state.content.is_deleted}
                />
              }

              {state.mode === MODE.REVISION &&
                <button
                  className='wsContentGeneric__option__menu__lastversion file__lastversionbtn btn'
                  onClick={this.handleClickLastVersion}
                  style={{backgroundColor: state.config.hexcolor, color: '#fdfdfd'}}
                >
                  <i className='fa fa-code-fork' />
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
          showRightPartOnLoad={state.mode === MODE.VIEW}
        >
          <FileComponent
            mode={state.mode}
            customColor={state.config.hexcolor}
            previewUrl={state.content.previewUrl ? state.content.previewUrl : ''}
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
            onClickRestoreArchived={this.handleClickRestoreArchived}
            onClickRestoreDeleted={this.handleClickRestoreDeleted}
            downloadRawUrl={
              (({config, content, mode}) =>
                `${config.apiUrl}/workspaces/${content.workspace_id}/files/${content.content_id}/${mode === MODE.REVISION ? `revisions/${content.current_revision_id}/` : ''}raw?force_download=1`
              )(state)}
            downloadPdfPageUrl={(({config, content, mode}) =>
              `${config.apiUrl}/workspaces/${content.workspace_id}/files/${content.content_id}/${mode === MODE.REVISION ? `revisions/${content.current_revision_id}/` : ''}preview/pdf?page=${state.fileCurrentPage}&force_download=1`
            )(state)}
            downloadPdfFullUrl={(({config, content, mode}) =>
              `${config.apiUrl}/workspaces/${content.workspace_id}/files/${content.content_id}/${mode === MODE.REVISION ? `revisions/${content.current_revision_id}/` : ''}preview/pdf/full?force_download=1`
            )(state)}
            contentFullScreenUrl={state.content.contentFullScreenUrl}
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
            disableComment={state.mode === MODE.REVISION || state.content.is_archived || state.content.is_deleted}
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
