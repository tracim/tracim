import React from 'react'
import HtmlDocumentComponent from '../component/HtmlDocument.jsx'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
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
  displayDistanceDate,
  convertBackslashNToBr
} from 'tracim_frontend_lib'
import { MODE, debug } from '../helper.js'
import {
  getHtmlDocContent,
  getHtmlDocComment,
  getHtmlDocRevision,
  postHtmlDocNewComment,
  putHtmlDocContent,
  putHtmlDocStatus,
  putHtmlDocIsArchived,
  putHtmlDocIsDeleted,
  putHtmlDocRestoreArchived,
  putHtmlDocRestoreDeleted,
  putHtmlDocRead
} from '../action.async.js'
import Radium from 'radium'

class HtmlDocument extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'html-document',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      externalTradList: [
        props.t('Write a document'),
        props.t('Text Documents')
      ],
      rawContentBeforeEdit: '',
      timeline: props.data ? [] : [], // debug.timeline,
      newComment: '',
      timelineWysiwyg: false,
      mode: MODE.VIEW
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    const { state } = this
    switch (type) {
      case 'html-document_showApp':
        console.log('%c<HtmlDocument> Custom event', 'color: #28a745', type, data)
        this.setState({isVisible: true})
        break
      case 'html-document_hideApp':
        console.log('%c<HtmlDocument> Custom event', 'color: #28a745', type, data)
        this.setState({isVisible: false})
        break
      case 'html-document_reloadContent':
        console.log('%c<HtmlDocument> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({content: {...prev.content, ...data}, isVisible: true}))
        break
      case 'allApp_changeLang':
        console.log('%c<HtmlDocument> Custom event', 'color: #28a745', type, data)

        if (state.timelineWysiwyg) {
          tinymce.remove('#wysiwygTimelineComment')
          wysiwyg('#wysiwygTimelineComment', data, this.handleChangeNewComment)
        }
        if (state.mode === MODE.EDIT) {
          tinymce.remove('#wysiwygNewVersion')
          wysiwyg('#wysiwygNewVersion', data, this.handleChangeText)
        }

        this.setState(prev => ({
          loggedUser: {
            ...prev.loggedUser,
            lang: data
          }
        }))
        i18n.changeLanguage(data)
        this.loadContent()
        break
    }
  }

  componentDidMount () {
    console.log('%c<HtmlDocument> did mount', `color: ${this.state.config.hexcolor}`)

    this.loadContent()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<HtmlDocument> did update', `color: ${this.state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) this.loadContent()

    if (state.mode === MODE.EDIT && prevState.mode !== state.mode) {
      tinymce.remove('#wysiwygNewVersion')
      wysiwyg('#wysiwygNewVersion', state.loggedUser.lang, this.handleChangeText)
    }

    if (!prevState.timelineWysiwyg && state.timelineWysiwyg) wysiwyg('#wysiwygTimelineComment', state.loggedUser.lang, this.handleChangeNewComment)
    else if (prevState.timelineWysiwyg && !state.timelineWysiwyg) tinymce.remove('#wysiwygTimelineComment')
  }

  componentWillUnmount () {
    console.log('%c<HtmlDocument> will Unmount', `color: ${this.state.config.hexcolor}`)
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

    const fetchResultHtmlDocument = getHtmlDocContent(config.apiUrl, content.workspace_id, content.content_id)
    const fetchResultComment = getHtmlDocComment(config.apiUrl, content.workspace_id, content.content_id)
    const fetchResultRevision = getHtmlDocRevision(config.apiUrl, content.workspace_id, content.content_id)

    handleFetchResult(await fetchResultHtmlDocument)
      .then(resHtmlDocument => this.setState({content: resHtmlDocument.body}))
      .catch(e => console.log('Error loading content.', e))

    Promise.all([
      handleFetchResult(await fetchResultComment),
      handleFetchResult(await fetchResultRevision)
    ])
      .then(([resComment, resRevision]) => {
        const resCommentWithProperDateAndAvatar = resComment.body.map(c => ({
          ...c,
          created_raw: c.created,
          created: displayDistanceDate(c.created, loggedUser.lang),
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
            created_raw: r.created,
            created: displayDistanceDate(r.created, loggedUser.lang),
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
          mode: resRevision.body.length === 1 && loggedUser.idRoleUserWorkspace >= 2 ? MODE.EDIT : MODE.VIEW // first time editing the doc, open in edit mode
        })
      })
      .catch(e => {
        console.log('Error loading Timeline.', e)
        this.setState({timeline: []})
      })

    await Promise.all([fetchResultHtmlDocument, fetchResultComment, fetchResultRevision])
    await putHtmlDocRead(loggedUser, config.apiUrl, content.workspace_id, content.content_id) // mark as read after all requests are finished
    GLOBAL_dispatchEvent({type: 'refreshContentList', data: {}}) // await above makes sure that we will reload workspace content after the read status update
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({type: 'appClosed', data: {}}) // handled by tracim_front::src/container/WorkspaceContent.jsx
  }

  handleSaveEditTitle = async newTitle => {
    const { config, content } = this.state

    const fetchResultSaveHtmlDoc = putHtmlDocContent(config.apiUrl, content.workspace_id, content.content_id, newTitle, content.raw_content)

    handleFetchResult(await fetchResultSaveHtmlDoc)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.loadContent()
          GLOBAL_dispatchEvent({ type: 'refreshContentList', data: {} })
        } else {
          console.warn('Error saving html-document. Result:', resSave, 'content:', content, 'config:', config)
        }
      })
  }

  handleClickNewVersion = () => this.setState(prev => ({
    rawContentBeforeEdit: prev.content.raw_content,
    mode: MODE.EDIT
  }))

  handleCloseNewVersion = () => {
    tinymce.remove('#wysiwygNewVersion')
    this.setState(prev => ({
      content: {
        ...prev.content,
        raw_content: prev.rawContentBeforeEdit
      },
      mode: MODE.VIEW
    }))
  }

  handleSaveHtmlDocument = async () => {
    const { content, config } = this.state

    const fetchResultSaveHtmlDoc = putHtmlDocContent(config.apiUrl, content.workspace_id, content.content_id, content.label, content.raw_content)

    handleFetchResult(await fetchResultSaveHtmlDoc)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.handleCloseNewVersion()
          this.loadContent()
        } else {
          console.warn('Error saving html-document. Result:', resSave, 'content:', content, 'config:', config)
        }
      })
  }

  handleChangeText = e => {
    const newText = e.target.value // because SyntheticEvent is pooled (react specificity)
    this.setState(prev => ({content: {...prev.content, raw_content: newText}}))
  }

  handleChangeNewComment = e => {
    const newComment = e.target.value
    this.setState({newComment})
  }

  handleClickValidateNewCommentBtn = async () => {
    const { props, state } = this

    // @FIXME - Côme - 2018/10/31 - line bellow is a hack to force send html to api
    // see https://github.com/tracim/tracim/issues/1101
    const newCommentForApi = state.timelineWysiwyg
      ? state.newComment
      : `<p>${convertBackslashNToBr(state.newComment)}</p>`

    const fetchResultSaveNewComment = await handleFetchResult(await postHtmlDocNewComment(state.config.apiUrl, state.content.workspace_id, state.content.content_id, newCommentForApi))
    switch (fetchResultSaveNewComment.apiResponse.status) {
      case 200:
        this.setState({newComment: ''})
        if (state.timelineWysiwyg) tinymce.get('wysiwygTimelineComment').setContent('')
        this.loadContent()
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new comment')); break
    }
  }

  handleToggleWysiwyg = () => this.setState(prev => ({timelineWysiwyg: !prev.timelineWysiwyg}))

  handleChangeStatus = async newStatus => {
    const { config, content } = this.state

    const fetchResultSaveEditStatus = putHtmlDocStatus(config.apiUrl, content.workspace_id, content.content_id, newStatus)

    handleFetchResult(await fetchResultSaveEditStatus)
      .then(resSave => {
        if (resSave.status !== 204) { // 204 no content so dont take status from resSave.apiResponse.status
          console.warn('Error saving html-document comment. Result:', resSave, 'content:', content, 'config:', config)
        } else {
          this.loadContent()
        }
      })
  }

  handleClickArchive = async () => {
    const { config, content } = this.state

    const fetchResultArchive = await putHtmlDocIsArchived(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_archived: true}, mode: MODE.VIEW}))
        this.loadContent()
        break
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
    const { config, content } = this.state

    const fetchResultArchive = await putHtmlDocIsDeleted(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_deleted: true}, mode: MODE.VIEW}))
        this.loadContent()
        break
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
    const { config, content } = this.state

    const fetchResultRestore = await putHtmlDocRestoreArchived(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultRestore.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_archived: false}}))
        this.loadContent()
        break
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
    const { config, content } = this.state

    const fetchResultRestore = await putHtmlDocRestoreDeleted(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultRestore.status) {
      case 204:
        this.setState(prev => ({content: {...prev.content, is_deleted: false}}))
        this.loadContent()
        break
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

  render () {
    const { isVisible, loggedUser, content, timeline, newComment, timelineWysiwyg, config, mode } = this.state
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
          disableChangeTitle={!content.is_editable}
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
                  disabled={mode !== MODE.VIEW || !content.is_editable}
                  label={t('Edit')}
                />
              }

              {mode === MODE.REVISION &&
                <button
                  className='wsContentGeneric__option__menu__lastversion html-document__lastversionbtn btn highlightBtn'
                  onClick={this.handleClickLastVersion}
                  style={{backgroundColor: config.hexcolor, color: '#fdfdfd'}}
                >
                  <i className='fa fa-history' />
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
                  disabled={mode === MODE.REVISION || content.is_archived || content.is_deleted}
                />
              }

              {loggedUser.idRoleUserWorkspace >= 4 &&
                <ArchiveDeleteContent
                  customColor={config.hexcolor}
                  onClickArchiveBtn={this.handleClickArchive}
                  onClickDeleteBtn={this.handleClickDelete}
                  disabled={mode === MODE.REVISION || content.is_archived || content.is_deleted}
                />
              }
            </div>
          </div>
        </PopinFixedOption>

        <PopinFixedContent
          customClass={`${config.slug}__contentpage`}
          showRightPartOnLoad={mode === MODE.VIEW}
        >
          <HtmlDocumentComponent
            mode={mode}
            customColor={config.hexcolor}
            wysiwygNewVersion={'wysiwygNewVersion'}
            onClickCloseEditMode={this.handleCloseNewVersion}
            onClickValidateBtn={this.handleSaveHtmlDocument}
            version={content.number}
            lastVersion={timeline.filter(t => t.timelineType === 'revision').length}
            text={content.raw_content}
            onChangeText={this.handleChangeText}
            isArchived={content.is_archived}
            isDeleted={content.is_deleted}
            onClickRestoreArchived={this.handleClickRestoreArchived}
            onClickRestoreDeleted={this.handleClickRestoreDeleted}
            key={'html-document'}
          />

          <Timeline
            customClass={`${config.slug}__contentpage`}
            customColor={config.hexcolor}
            loggedUser={loggedUser}
            timelineData={timeline}
            showHeader
            newComment={newComment}
            disableComment={mode === MODE.REVISION || !content.is_editable}
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

export default translate()(Radium(HtmlDocument))
