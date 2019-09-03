import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import { debug } from '../debug.js'
import {
  addAllResourceI18n,
  handleFetchResult,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  Timeline,
  SelectStatus,
  DeleteContent,
  displayDistanceDate,
  convertBackslashNToBr,
  generateLocalStorageContentId,
  appFeatureCustomEventHandlerShowApp,
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import {
  getThreadContent,
  getThreadComment,
  getThreadRevision,
  postThreadNewComment,
  putThreadStatus,
  putThreadContent,
  putThreadIsDeleted,
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
      externalTranslationList: [
        props.t('Thread'),
        props.t('Threads'),
        props.t('thread'),
        props.t('threads'),
        props.t('Start a topic')
      ]
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    const { state } = this
    switch (type) {
      case CUSTOM_EVENT.SHOW_APP(state.config.slug):
        console.log('%c<Thread> Custom event', 'color: #28a745', type, data)
        const isSameContentId = appFeatureCustomEventHandlerShowApp(data.content, state.content.content_id, state.content.content_type)
        if (isSameContentId) {
          this.setState({ isVisible: true })
          this.buildBreadcrumbs()
        }
        break

      case CUSTOM_EVENT.HIDE_APP(state.config.slug):
        console.log('%c<Thread> Custom event', 'color: #28a745', type, data)
        tinymce.remove('#wysiwygTimelineComment')
        this.setState({
          isVisible: false,
          timelineWysiwyg: false
        })
        break

      case CUSTOM_EVENT.RELOAD_CONTENT(state.config.slug):
        console.log('%c<Thread> Custom event', 'color: #28a745', type, data)
        tinymce.remove('#wysiwygTimelineComment')

        const previouslyUnsavedComment = localStorage.getItem(
          generateLocalStorageContentId(data.workspace_id, data.content_id, state.appName, 'comment')
        )

        this.setState(prev => ({
          content: { ...prev.content, ...data },
          isVisible: true,
          timelineWysiwyg: false,
          newComment: prev.content.content_id === data.content_id ? prev.newComment : previouslyUnsavedComment || ''
        }))
        break

      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<Thread> Custom event', 'color: #28a745', type, data)

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
        this.loadContent()
        break
    }
  }

  async componentDidMount () {
    console.log('%c<Thread> did Mount', `color: ${this.state.config.hexcolor}`)

    const { appName, content } = this.state
    const previouslyUnsavedComment = localStorage.getItem(
      generateLocalStorageContentId(content.workspace_id, content.content_id, appName, 'comment')
    )
    if (previouslyUnsavedComment) this.setState({ newComment: previouslyUnsavedComment })

    await this.loadContent()
    this.buildBreadcrumbs()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<Thread> did Update', `color: ${state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) {
      await this.loadContent()
      this.buildBreadcrumbs()
    }

    if (!prevState.timelineWysiwyg && state.timelineWysiwyg) wysiwyg('#wysiwygTimelineComment', state.loggedUser.lang, this.handleChangeNewComment)
    else if (prevState.timelineWysiwyg && !state.timelineWysiwyg) tinymce.remove('#wysiwygTimelineComment')
  }

  componentWillUnmount () {
    console.log('%c<Thread> will Unmount', `color: ${this.state.config.hexcolor}`)
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

  loadContent = async () => {
    const { loggedUser, content, config } = this.state

    if (content.content_id === '-1') return // debug case

    const fetchResultThread = getThreadContent(config.apiUrl, content.workspace_id, content.content_id)
    const fetchResultThreadComment = getThreadComment(config.apiUrl, content.workspace_id, content.content_id)
    const fetchResultRevision = getThreadRevision(config.apiUrl, content.workspace_id, content.content_id)

    const [resComment, resRevision] = await Promise.all([
      handleFetchResult(await fetchResultThreadComment),
      handleFetchResult(await fetchResultRevision)
    ])

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
          loggedUser: this.state.config.loggedUser
        }))
      ], [])

    const resThread = await handleFetchResult(await fetchResultThread)

    this.setState({
      content: resThread.body,
      listMessage: revisionWithComment
    })

    await putThreadRead(loggedUser, config.apiUrl, content.workspace_id, content.content_id)
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
  }

  buildBreadcrumbs = () => {
    const { state } = this

    GLOBAL_dispatchEvent({
      type: CUSTOM_EVENT.APPEND_BREADCRUMBS,
      data: {
        breadcrumbs: [{
          url: `/ui/workspaces/${state.content.workspace_id}/contents/${state.config.slug}/${state.content.content_id}`,
          label: state.content.label,
          link: null,
          type: BREADCRUMBS_TYPE.APP_FEATURE
        }]
      }
    })
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
  }

  handleSaveEditTitle = async newTitle => {
    const { props, state } = this

    const fetchResultSaveThread = await handleFetchResult(
      await putThreadContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id, newTitle)
    )

    switch (fetchResultSaveThread.apiResponse.status) {
      case 200:
        this.loadContent()
        GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
        break
      case 400:
        switch (fetchResultSaveThread.body.code) {
          case 2041: break // INFO - CH - 2019-04-04 - this means the same title has been sent. Therefore, no modification
          case 3002: this.sendGlobalFlashMessage(props.t('A content with same name already exists')); break
          default: this.sendGlobalFlashMessage(props.t('Error while saving new title')); break
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new title')); break
    }
  }

  handleChangeNewComment = e => {
    const newComment = e.target.value
    this.setState({ newComment })

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

    const fetchResultSaveNewComment = await handleFetchResult(await postThreadNewComment(state.config.apiUrl, state.content.workspace_id, state.content.content_id, newCommentForApi))

    switch (fetchResultSaveNewComment.apiResponse.status) {
      case 200:
        this.setState({ newComment: '' })
        localStorage.removeItem(
          generateLocalStorageContentId(state.content.workspace_id, state.content.content_id, state.appName, 'comment')
        )
        if (state.timelineWysiwyg) tinymce.get('wysiwygTimelineComment').setContent('')
        this.loadContent()
        break
      case 400:
        switch (fetchResultSaveNewComment.body.code) {
          case 2003:
            this.sendGlobalFlashMessage(props.t("You can't send an empty comment"))
            break
          default:
            this.sendGlobalFlashMessage(props.t('Error while saving new comment'))
            break
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new comment')); break
    }
  }

  handleToggleWysiwyg = () => this.setState(prev => ({ timelineWysiwyg: !prev.timelineWysiwyg }))

  handleChangeStatus = async newStatus => {
    const { state, props } = this

    if (newStatus === state.content.status) return

    const fetchResultSaveEditStatus = await handleFetchResult(
      await putThreadStatus(state.config.apiUrl, state.content.workspace_id, state.content.content_id, newStatus)
    )

    switch (fetchResultSaveEditStatus.status) {
      case 204: this.loadContent(); break
      default: this.sendGlobalFlashMessage(props.t('Error while changing status'))
    }
  }

  handleClickDelete = async () => {
    const { config, content } = this.state

    const fetchResultArchive = await putThreadIsDeleted(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204:
        this.setState(prev => ({ content: { ...prev.content, is_deleted: true } }))
        this.loadContent()
        break
      default: GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: this.props.t('Error while deleting thread'),
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
      case 204:
        this.setState(prev => ({ content: { ...prev.content, is_deleted: false } }))
        this.loadContent()
        break
      default: GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
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
          rawTitle={content.label}
          componentTitle={<div>{content.label}</div>}
          userRoleIdInWorkspace={loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
          disableChangeTitle={!content.is_editable}
        />

        <PopinFixedOption
          customClass={`${config.slug}__contentpage`}
          customColor={config.hexcolor}
          i18n={i18n}
        >
          <div className='justify-content-end'>
            {loggedUser.userRoleIdInWorkspace >= 2 &&
              <SelectStatus
                selectedStatus={config.availableStatuses.find(s => s.slug === content.status)}
                availableStatus={config.availableStatuses}
                onChangeStatus={this.handleChangeStatus}
                disabled={content.is_deleted}
              />
            }

            {loggedUser.userRoleIdInWorkspace >= 4 &&
              <DeleteContent
                customColor={config.hexcolor}
                onClickDeleteBtn={this.handleClickDelete}
                disabled={content.is_deleted}
              />
            }
          </div>
        </PopinFixedOption>

        <PopinFixedContent customClass={`${config.slug}__contentpage`}>
          {/* FIXME - GB - 2019-06-05 - we need to have a better way to check the state.config than using config.availableStatuses[3].slug
            https://github.com/tracim/tracim/issues/1840 */}
          <Timeline
            customClass={`${config.slug}__contentpage`}
            customColor={config.hexcolor}
            loggedUser={loggedUser}
            timelineData={listMessage}
            newComment={newComment}
            disableComment={!content.is_editable}
            availableStatusList={config.availableStatuses}
            wysiwyg={timelineWysiwyg}
            onChangeNewComment={this.handleChangeNewComment}
            onClickValidateNewCommentBtn={this.handleClickValidateNewCommentBtn}
            onClickWysiwygBtn={this.handleToggleWysiwyg}
            allowClickOnRevision={false}
            onClickRevisionBtn={() => {}}
            shouldScrollToBottom
            isDeleted={content.is_deleted}
            onClickRestoreDeleted={this.handleClickRestoreDeleted}
            isDeprecated={content.status === config.availableStatuses[3].slug}
            deprecatedStatus={config.availableStatuses[3]}
            showTitle={false}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(Thread)
