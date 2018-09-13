import React from 'react'
import i18n from '../i18n.js'
import { debug } from '../helper.js'
import {
  addAllResourceI18n,
  handleFetchResult,
  generateAvatarFromPublicName,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  Timeline,
  SelectStatus,
  ArchiveDeleteContent,
  displayDate
} from 'tracim_frontend_lib'
import {
  getThreadContent,
  getThreadComment,
  postThreadNewComment,
  putThreadStatus,
  putThreadContent,
  putThreadIsArchived,
  putThreadIsDeleted,
  putThreadRestoreArchived,
  putThreadRestoreDeleted,
  putThreadRead
} from '../action.async.js'

class Thread extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'thread',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      listMessage: props.data ? [] : [], // debug.listMessage,
      newComment: '',
      timelineWysiwyg: false,
      externalTradList: [
        i18n.t('Discuss about a topic')
      ]
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    switch (type) {
      case 'thread_showApp':
        console.log('%c<Thread> Custom event', 'color: #28a745', type, data)
        this.setState({isVisible: true})
        break
      case 'thread_hideApp':
        console.log('%c<Thread> Custom event', 'color: #28a745', type, data)
        this.setState({isVisible: false})
        break
      case 'thread_reloadContent':
        console.log('%c<Thread> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({content: {...prev.content, ...data}, isVisible: true}))
        break
      case 'allApp_changeLang':
        console.log('%c<Thread> Custom event', 'color: #28a745', type, data)
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
    console.log('%c<Thread> did Mount', `color: ${this.state.config.hexcolor}`)
    this.loadContent()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<Thread> did Update', `color: ${this.state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) this.loadContent()

    if (!prevState.timelineWysiwyg && state.timelineWysiwyg) wysiwyg('#wysiwygTimelineComment', this.handleChangeNewComment)
    else if (prevState.timelineWysiwyg && !state.timelineWysiwyg) tinymce.remove('#wysiwygTimelineComment')
  }

  componentWillUnmount () {
    console.log('%c<Thread> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  loadContent = async () => {
    const { loggedUser, content, config } = this.state

    if (content.content_id === '-1') return // debug case

    const fetchResultThread = getThreadContent(config.apiUrl, content.workspace_id, content.content_id)
    const fetchResultThreadComment = getThreadComment(config.apiUrl, content.workspace_id, content.content_id)

    Promise.all([
      handleFetchResult(await fetchResultThread),
      handleFetchResult(await fetchResultThreadComment)
    ])
      .then(async ([resThread, resComment]) => {
        this.setState({
          content: resThread.body,
          listMessage: resComment.body.map(c => ({
            ...c,
            timelineType: 'comment',
            created: displayDate(c.created, loggedUser.lang),
            author: {
              ...c.author,
              avatar_url: c.author.avatar_url
                ? c.author.avatar_url
                : generateAvatarFromPublicName(c.author.public_name)
            }
          }))
        })

        await putThreadRead(loggedUser, config.apiUrl, content.workspace_id, content.content_id)
        GLOBAL_dispatchEvent({type: 'refreshContentList', data: {}})
      })
      .catch(e => console.log('Error loading Thread data.', e))
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({type: 'appClosed', data: {}}) // handled by tracim_front::src/container/WorkspaceContent.jsx
  }

  handleSaveEditTitle = async newTitle => {
    const { config, content } = this.state

    const fetchResultSaveThread = putThreadContent(config.apiUrl, content.workspace_id, content.content_id, newTitle)

    handleFetchResult(await fetchResultSaveThread)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.loadContent()
          GLOBAL_dispatchEvent({ type: 'refreshContentList', data: {} })
        } else {
          console.warn('Error saving threads. Result:', resSave, 'content:', content, 'config:', config)
        }
      })
  }

  handleChangeNewComment = e => {
    const newComment = e.target.value
    this.setState({newComment})
  }

  handleClickValidateNewCommentBtn = async () => {
    const { config, content, newComment } = this.state

    const fetchResultSaveNewComment = await postThreadNewComment(config.apiUrl, content.workspace_id, content.content_id, newComment)

    handleFetchResult(await fetchResultSaveNewComment)
      .then(resSave => {
        if (resSave.apiResponse.status === 200) {
          this.setState({newComment: ''})
          if (this.state.timelineWysiwyg) tinymce.get('wysiwygTimelineComment').setContent('')
          this.loadContent()
        } else {
          console.warn('Error saving thread comment. Result:', resSave, 'content:', content, 'config:', config)
        }
      })
  }

  handleToggleWysiwyg = () => this.setState(prev => ({timelineWysiwyg: !prev.timelineWysiwyg}))

  handleChangeStatus = async newStatus => {
    const { config, content } = this.state

    const fetchResultSaveEditStatus = putThreadStatus(config.apiUrl, content.workspace_id, content.content_id, newStatus)

    handleFetchResult(await fetchResultSaveEditStatus)
      .then(resSave => {
        if (resSave.status === 204) { // 204 no content so dont take status from resSave.apiResponse.status
          this.loadContent()
        } else {
          console.warn('Error saving thread comment. Result:', resSave, 'content:', content, 'config:', config)
        }
      })
  }

  handleClickArchive = async () => {
    const { config, content } = this.state

    const fetchResultArchive = await putThreadIsArchived(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204: this.setState(prev => ({content: {...prev.content, is_archived: true}})); break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: this.props.t('Error while archiving thread'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  handleClickDelete = async () => {
    const { config, content } = this.state

    const fetchResultArchive = await putThreadIsDeleted(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204: this.setState(prev => ({content: {...prev.content, is_deleted: true}})); break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: this.props.t('Error while deleting thread'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  handleClickRestoreArchived = async () => {
    const { config, content } = this.state

    const fetchResultRestore = await putThreadRestoreArchived(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultRestore.status) {
      case 204: this.setState(prev => ({content: {...prev.content, is_archived: false}})); break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: this.props.t('Error while restoring thread'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  handleClickRestoreDeleted = async () => {
    const { config, content } = this.state

    const fetchResultRestore = await putThreadRestoreDeleted(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultRestore.status) {
      case 204: this.setState(prev => ({content: {...prev.content, is_deleted: false}})); break
      default: GLOBAL_dispatchEvent({
        type: 'addFlashMsg',
        data: {
          msg: this.props.t('Error while restoring thread'),
          type: 'warning',
          delay: undefined
        }
      })
    }
  }

  render () {
    const { config, isVisible, loggedUser, content, listMessage, newComment, timelineWysiwyg } = this.state

    if (!isVisible) return null

    return (
      <PopinFixed customClass={config.slug} customColor={config.hexcolor}>
        <PopinFixedHeader
          customClass={`${config.slug}__contentpage`}
          customColor={config.hexcolor}
          faIcon={config.faIcon}
          title={content.label}
          idRoleUserWorkspace={loggedUser.idRoleUserWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
        />

        <PopinFixedOption
          customClass={`${config.slug}__contentpage`}
          customColor={config.hexcolor}
          i18n={i18n}
        >
          <div className='justify-content-end'>
            {loggedUser.idRoleUserWorkspace >= 2 &&
              <SelectStatus
                selectedStatus={config.availableStatuses.find(s => s.slug === content.status)}
                availableStatus={config.availableStatuses}
                onChangeStatus={this.handleChangeStatus}
                disabled={false}
              />
            }

            {loggedUser.idRoleUserWorkspace >= 4 &&
              <ArchiveDeleteContent
                customColor={config.hexcolor}
                onClickArchiveBtn={this.handleClickArchive}
                onClickDeleteBtn={this.handleClickDelete}
                disabled={false}
              />
            }
          </div>
        </PopinFixedOption>

        <PopinFixedContent customClass={`${config.slug}__contentpage`}>
          <Timeline
            customClass={`${config.slug}__contentpage`}
            customColor={config.hexcolor}
            loggedUser={loggedUser}
            timelineData={listMessage}
            newComment={newComment}
            disableComment={false}
            wysiwyg={timelineWysiwyg}
            onChangeNewComment={this.handleChangeNewComment}
            onClickValidateNewCommentBtn={this.handleClickValidateNewCommentBtn}
            onClickWysiwygBtn={this.handleToggleWysiwyg}
            onClickRevisionBtn={() => {}}
            shouldScrollToBottom
            showHeader={false}
            isArchived={content.is_archived}
            onClickRestoreArchived={this.handleClickRestoreArchived}
            isDeleted={content.is_deleted}
            onClickRestoreDeleted={this.handleClickRestoreDeleted}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default Thread
