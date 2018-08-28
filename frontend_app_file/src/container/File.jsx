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
  putFileRead, putFileContentRaw
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
      timelineWysiwyg: false,
      mode: MODE.VIEW,
      displayProperty: false
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
              loggedUser: this.state.config.loggedUser
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

  handleSaveFile = async () => {
    const { loggedUser, content, config } = this.state

    const fetchResultSaveFile = putFileContent(loggedUser, config.apiUrl, content.workspace_id, content.content_id, content.label, content.raw_content)

    handleFetchResult(await fetchResultSaveFile)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.handleCloseNewVersion()
          this.loadContent()
        } else {
          console.warn('Error saving file. Result:', resSave, 'content:', content, 'config:', config)
        }
      })
  }

  handleChangeDescription = e => {
    const newText = e.target.value // because SyntheticEvent is pooled (react specificity)
    this.setState(prev => ({content: {...prev.content, raw_content: newText}}))
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

  handleClickShowRevision = revision => {
    const { mode, timeline } = this.state

    const revisionArray = timeline.filter(t => t.timelineType === 'revision')
    const isLastRevision = revision.revision_id === revisionArray[revisionArray.length - 1].revision_id

    if (mode === MODE.REVISION && isLastRevision) {
      this.handleClickLastVersion()
      return
    }

    if (mode === MODE.VIEW && isLastRevision) return

    this.setState(prev => ({
      content: {
        ...prev.content,
        label: revision.label,
        raw_content: revision.raw_content,
        number: revision.number,
        status: revision.status,
        is_archived: prev.is_archived, // archived and delete should always be taken from last version
        is_deleted: prev.is_deleted
      },
      mode: MODE.REVISION
    }))
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

  handleChangeFile = newFile => this.setState({newFile: newFile[0]})

  handleClickDropzoneCancel = () => this.setState({mode: MODE.VIEW})

  handleClickDropzoneValidate = async () => {
    const { props, state } = this

    const formData = new FormData()
    formData.append('files', state.newFile)

    const fetchPutRaw = await handleFetchResult(putFileContentRaw(state.loggedUser, state.config.apiUrl, state.idWorkspace, state.content.content_id, formData))
    switch (fetchPutRaw.status) {
      case 204: this.loadContent(); break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: props.t('Error while creating file'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  render () {
    const { isVisible, loggedUser, content, timeline, newComment, timelineWysiwyg, config, mode, displayProperty } = this.state
    const { t } = this.props

    if (!isVisible) return null

    return (
      <PopinFixed
        customClass={`${config.slug}`}
        customColor={config.hexcolor}
      >
        <PopinFixedHeader
          customClass={`${config.slug}`}
          customColor={config.hexcolor}
          faIcon={config.faIcon}
          title={content.label}
          idRoleUserWorkspace={loggedUser.idRoleUserWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
        />

        <PopinFixedOption
          customColor={config.hexcolor}
          customClass={`${config.slug}`}
          i18n={i18n}
        >
          <div /* this div in display flex, justify-content space-between */>
            <div className='d-flex'>
              {loggedUser.idRoleUserWorkspace >= 2 &&
                <NewVersionBtn
                  customColor={config.hexcolor}
                  onClickNewVersionBtn={this.handleClickNewVersion}
                  disabled={mode !== MODE.VIEW}
                />
              }

              {mode === MODE.REVISION &&
                <button
                  className='wsContentGeneric__option__menu__lastversion file__lastversionbtn btn'
                  onClick={this.handleClickLastVersion}
                  style={{backgroundColor: config.hexcolor, color: '#fdfdfd'}}
                >
                  <i className='fa fa-code-fork' />
                  {t('Last version')}
                </button>
              }
            </div>

            <div className='d-flex'>
              {loggedUser.idRoleUserWorkspace >= 2 &&
                <SelectStatus
                  selectedStatus={config.availableStatuses.find(s => s.slug === content.status)}
                  availableStatus={config.availableStatuses}
                  onChangeStatus={this.handleChangeStatus}
                  disabled={mode === MODE.REVISION}
                />
              }

              {loggedUser.idRoleUserWorkspace >= 4 &&
                <ArchiveDeleteContent
                  customColor={config.hexcolor}
                  onClickArchiveBtn={this.handleClickArchive}
                  onClickDeleteBtn={this.handleClickDelete}
                  disabled={mode === MODE.REVISION}
                />
              }
            </div>
          </div>
        </PopinFixedOption>

        <PopinFixedContent
          customClass={`${config.slug}__contentpage`}
          showRightPartOnLoad={mode === MODE.VIEW}
        >
          <FileComponent
            mode={mode}
            customColor={config.hexcolor}
            // wysiwygNewVersion={'wysiwygNewVersion'}
            // onClickCloseEditMode={this.handleCloseNewVersion}
            // onClickValidateBtn={this.handleSaveFile}
            previewFile={content.previewFile ? content.previewFile : ''}
            displayProperty={displayProperty}
            onClickProperty={this.handleClickProperty}
            version={content.number}
            lastVersion={timeline.filter(t => t.timelineType === 'revision').length}
            description={content.raw_content}
            onChangeDescription={this.handleChangeDescription}
            isArchived={content.is_archived}
            isDeleted={content.is_deleted}
            onClickRestoreArchived={this.handleClickRestoreArchived}
            onClickRestoreDeleted={this.handleClickRestoreDeleted}
            onClickDownloadRaw={this.handleClickDownloadRaw}
            onClickDownloadPdfPage={this.handleClickDownloadPdfPage}
            onClickDownloadPdfFull={this.handleClickDownloadPdfFull}
            onChangeFile={this.handleChangeFile}
            onClickDropzoneCancel={this.handleClickDropzoneCancel}
            onClickDropzoneValidate={this.handleClickDropzoneValidate}
            key={'file'}
          />

          <Timeline
            customClass={`${config.slug}__contentpage`}
            customColor={config.hexcolor}
            loggedUser={loggedUser}
            timelineData={timeline}
            newComment={newComment}
            disableComment={mode === MODE.REVISION}
            wysiwyg={timelineWysiwyg}
            onChangeNewComment={this.handleChangeNewComment}
            onClickValidateNewCommentBtn={this.handleClickValidateNewCommentBtn}
            onClickWysiwygBtn={this.handleToggleWysiwyg}
            onClickRevisionBtn={this.handleClickShowRevision}
            shouldScrollToBottom={mode !== MODE.REVISION}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(File)
