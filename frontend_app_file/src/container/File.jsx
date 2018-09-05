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
  SelectStatus
} from 'tracim_frontend_lib'
import { MODE, debug } from '../helper.js'
import {
  getFileContent,
  getFileContentPreview,
  getFileComment,
  getFileRevision,
  postFileNewComment,
  putFileContent,
  putFileStatus,
  putFileIsArchived,
  putFileIsDeleted,
  putFileRestoreArchived,
  putFileRestoreDeleted,
  putFileRead,
  getFileContentPreviewRevision,
  getFileContentRaw,
  getFileContentRawRevision
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
      newComment: '',
      newFile: '',
      newFilePreview: null,
      fileCurrentPage: 0,
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
        break
    }
  }

  componentDidMount () {
    console.log('%c<File> did mount', `color: ${this.state.config.hexcolor}`)

    this.loadContent()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<File> did update', `color: ${this.state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) this.loadContent()

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
    const { loggedUser, content, config } = this.state

    const fetchResultFile = getFileContent(loggedUser, config.apiUrl, content.workspace_id, content.content_id)
    const fetchResultFilePreview = getFileContentPreview(loggedUser, config.apiUrl, content.workspace_id, content.content_id, 0)
    const fetchResultComment = getFileComment(loggedUser, config.apiUrl, content.workspace_id, content.content_id)
    const fetchResultRevision = getFileRevision(loggedUser, config.apiUrl, content.workspace_id, content.content_id)

    Promise.all([
      handleFetchResult(await fetchResultFile),
      await fetchResultFilePreview
    ])
      .then(async ([resFile, resFilePreview]) => this.setState({
        content: {
          ...resFile.body,
          previewFile: URL.createObjectURL(await resFilePreview.blob())
        }
      }))

    Promise.all([
      handleFetchResult(await fetchResultComment),
      handleFetchResult(await fetchResultRevision)
    ])
      .then(([resComment, resRevision]) => {
        const resCommentWithProperDateAndAvatar = resComment.body.map(c => ({
          ...c,
          created: (new Date(c.created)).toLocaleString(),
          author: {
            ...c.author,
            avatar_url: c.author.avatar_url
              ? c.author.avatar_url
              : generateAvatarFromPublicName(c.author.public_name)
          }
        }))

        const revisionWithComment = resRevision.body
          .map((r, i) => ({
            ...r,
            created: (new Date(r.created)).toLocaleString(),
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
      })
      .catch(e => {
        console.log('Error loading Timeline.', e)
        this.setState({timeline: []})
      })

    await Promise.all([fetchResultFile, fetchResultComment, fetchResultRevision])
    putFileRead(loggedUser, config.apiUrl, content.workspace_id, content.content_id) // mark as read after all requests are finished
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({type: 'appClosed', data: {}}) // handled by tracim_front::src/container/WorkspaceContent.jsx
  }

  handleSaveEditTitle = async newTitle => {
    const { loggedUser, config, content } = this.state

    const fetchResultSaveFile = putFileContent(loggedUser, config.apiUrl, content.workspace_id, content.content_id, newTitle, content.raw_content)

    handleFetchResult(await fetchResultSaveFile)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.loadContent()
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
      await putFileContent(state.loggedUser, state.config.apiUrl, state.content.workspace_id, state.content.content_id, state.content.label, newDescription)
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
    const { loggedUser, config, content, newComment } = this.state

    const fetchResultSaveNewComment = await postFileNewComment(loggedUser, config.apiUrl, content.workspace_id, content.content_id, newComment)

    handleFetchResult(await fetchResultSaveNewComment)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.setState({newComment: ''})
          if (this.state.timelineWysiwyg) tinymce.get('wysiwygTimelineComment').setContent('')
          this.loadContent()
        } else {
          console.warn('Error saving file comment. Result:', resSave, 'content:', content, 'config:', config)
        }
      })
  }

  handleToggleWysiwyg = () => this.setState(prev => ({timelineWysiwyg: !prev.timelineWysiwyg}))

  handleChangeStatus = async newStatus => {
    const { loggedUser, config, content } = this.state

    const fetchResultSaveEditStatus = putFileStatus(loggedUser, config.apiUrl, content.workspace_id, content.content_id, newStatus)

    handleFetchResult(await fetchResultSaveEditStatus)
      .then(resSave => {
        if (resSave.status !== 204) { // 204 no content so dont take status from resSave.apiResponse.status
          console.warn('Error saving file comment. Result:', resSave, 'content:', content, 'config:', config)
        } else {
          this.loadContent()
        }
      })
  }

  handleClickArchive = async () => {
    const { loggedUser, config, content } = this.state

    const fetchResultArchive = await putFileIsArchived(loggedUser, config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204: this.setState(prev => ({content: {...prev.content, is_archived: true}})); break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: this.props.t('Error while archiving document'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  handleClickDelete = async () => {
    const { loggedUser, config, content } = this.state

    const fetchResultArchive = await putFileIsDeleted(loggedUser, config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204: this.setState(prev => ({content: {...prev.content, is_deleted: true}})); break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: this.props.t('Error while deleting document'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  handleClickRestoreArchived = async () => {
    const { loggedUser, config, content } = this.state

    const fetchResultRestore = await putFileRestoreArchived(loggedUser, config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultRestore.status) {
      case 204: this.setState(prev => ({content: {...prev.content, is_archived: false}})); break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: this.props.t('Error while restoring document'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  handleClickRestoreDeleted = async () => {
    const { loggedUser, config, content } = this.state

    const fetchResultRestore = await putFileRestoreDeleted(loggedUser, config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultRestore.status) {
      case 204: this.setState(prev => ({content: {...prev.content, is_deleted: false}})); break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: this.props.t('Error while restoring document'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  handleClickShowRevision = async revision => {
    const { props, state } = this

    const revisionArray = state.timeline.filter(t => t.timelineType === 'revision')
    const isLastRevision = revision.revision_id === revisionArray[revisionArray.length - 1].revision_id

    if (state.mode === MODE.REVISION && isLastRevision) {
      this.handleClickLastVersion()
      return
    }

    if (state.mode === MODE.VIEW && isLastRevision) return

    const fetchResultFilePreview = await getFileContentPreviewRevision(state.loggedUser, state.config.apiUrl, revision.workspace_id, revision.content_id, 0, revision.revision_id)
    switch (fetchResultFilePreview.status) {
      case 200:
        const filePreviousVersion = URL.createObjectURL(await fetchResultFilePreview.blob())
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
            previewFile: filePreviousVersion
          },
          mode: MODE.REVISION
        }))
        break
      default: this.sendGlobalFlashMessage(props.t('Error while loading previous version'))
    }
  }

  handleClickLastVersion = () => {
    this.loadContent()
    this.setState({mode: MODE.VIEW})
  }

  handleClickProperty = () => this.setState(prev => ({displayProperty: !prev.displayProperty}))

  handleClickDownloadRaw = async () => {
    // const { props, state } = this
    //
    // const fetchFileRaw = getFileContentRaw(state.loggedUser, state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    // const rezFileRaw = await fetchFileRaw
    // console.log(fetchFileRaw)
    // console.log(rezFileRaw.body)
  }

  handleClickDownloadPdfPage = async () => {}

  handleClickDownloadPdfFull = async () => {}

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

    // fetch still doesn't handle event progress. So we need to use old school xhr object
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('loadstart', () => this.setState({progressUpload: {display: false, percent: 0}}), false)
    const uploadInProgress = e => e.lengthComputable && this.setState({progressUpload: {display: true, percent: Math.round(e.loaded / e.total * 100)}})
    xhr.upload.addEventListener('progress', uploadInProgress, false)
    xhr.upload.addEventListener('load', () => this.setState({progressUpload: {display: false, percent: 0}}), false)

    xhr.open('PUT', `${state.config.apiUrl}/workspaces/${state.content.workspace_id}/files/${state.content.content_id}/raw`, true)
    xhr.setRequestHeader('Authorization', 'Basic ' + state.loggedUser.auth)
    xhr.setRequestHeader('Accept', 'application/json')

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        switch (xhr.status) {
          case 204:
            this.loadContent()
            this.setState({
              newFile: '',
              newFilePreview: null
            })
            break
          default: this.sendGlobalFlashMessage(props.t('Error while uploading file'))
        }
      }
    }

    xhr.send(formData)
  }

  handleClickPreviousNextPage = async previousNext => {
    const { props, state } = this

    if (!['previous', 'next'].includes(previousNext)) return
    if (previousNext === 'previous' && state.fileCurrentPage === 0) return
    // if (previousNext === 'next' && state.fileCurrentPage > 999) return // @TODO set proper max page (from api => api doesn't return that info yet)

    const endPoint = state.mode === MODE.REVISION ? getFileContentPreviewRevision : getFileContentPreview
    const nextPageNumber = previousNext === 'previous' ? state.fileCurrentPage - 1 : state.fileCurrentPage + 1

    const fetchNewPage = await endPoint(state.loggedUser, state.config.apiUrl, state.content.workspace_id, state.content.content_id, nextPageNumber, state.content.current_revision_id)

    switch (fetchNewPage.status) {
      case 200: this.setState({
        previewFile: URL.createObjectURL(await fetchNewPage.blob()),
        fileCurrentPage: nextPageNumber
      }); break
      default: this.sendGlobalFlashMessage(props.t('Error while loading new page'))
    }
  }

  handleClickDisplayContentFull = async () => {
    const { props, state } = this

    const endPoint = state.mode === MODE.REVISION ? getFileContentRawRevision : getFileContentRaw
    // last param bellow is only useful for getFileContentRawRevision(). It is just ignored for getFileContentRaw
    const fetchContentFull = await endPoint(state.loggedUser, state.config.apiUrl, state.content.workspace_id, state.content.content_id, state.content.current_revision_id)
    switch (fetchContentFull.status) {
      case 200:
        const contentFull = URL.createObjectURL(await fetchContentFull.blob())
        this.setState(prev => ({content: {...prev.content, contentFull: contentFull}})); break
      default: this.sendGlobalFlashMessage(props.t('Error while loading file'))
    }
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
                  disabled={state.mode !== MODE.VIEW}
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
                  disabled={state.mode === MODE.REVISION}
                />
              }

              {state.loggedUser.idRoleUserWorkspace >= 4 &&
                <ArchiveDeleteContent
                  customColor={state.config.hexcolor}
                  onClickArchiveBtn={this.handleClickArchive}
                  onClickDeleteBtn={this.handleClickDelete}
                  disabled={state.mode === MODE.REVISION}
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
            previewFile={state.content.previewFile ? state.content.previewFile : ''}
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
            onClickDownloadRaw={this.handleClickDownloadRaw}
            onClickDisplayFull={this.handleClickDisplayContentFull}
            contentFull={state.content.contentFull}
            onClickDownloadPdfPage={this.handleClickDownloadPdfPage}
            onClickDownloadPdfFull={this.handleClickDownloadPdfFull}
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
            disableComment={state.mode === MODE.REVISION}
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
