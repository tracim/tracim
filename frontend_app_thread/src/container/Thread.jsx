import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import { debug } from '../debug.js'
import {
  appContentFactory,
  addAllResourceI18n,
  handleFetchResult,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  Timeline,
  SelectStatus,
  ArchiveDeleteContent,
  generateLocalStorageContentId,
  appFeatureCustomEventHandlerShowApp,
  BREADCRUMBS_TYPE,
  ROLE,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import {
  getThreadContent,
  getThreadComment,
  getThreadRevision,
  putThreadRead
} from '../action.async.js'

class Thread extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'thread',
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      listMessage: [],
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

  customEventReducer = async ({ detail: { type, data } }) => { // action: { type: '', data: {} }
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

      // CH - 2019-31-12 - This event is used to send a new content_id that will trigger data reload through componentDidUpdate
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

      case CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(state.config.slug):
        await this.loadContent()
        this.loadTimeline()
        this.buildBreadcrumbs()
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
        await this.loadContent()
        this.loadTimeline()
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
    this.loadTimeline()
    this.buildBreadcrumbs()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<Thread> did Update', `color: ${state.config.hexcolor}`, prevState, state)

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
    const { state } = this

    const response = await handleFetchResult(
      await getThreadContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    )

    this.setState({
      content: response.body
    })

    await putThreadRead(state.loggedUser, state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
  }

  loadTimeline = async () => {
    const { props, state } = this

    const fetchResultThreadComment = getThreadComment(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    const fetchResultRevision = getThreadRevision(state.config.apiUrl, state.content.workspace_id, state.content.content_id)

    const [resComment, resRevision] = await Promise.all([
      handleFetchResult(await fetchResultThreadComment),
      handleFetchResult(await fetchResultRevision)
    ])

    const revisionWithComment = props.buildTimelineFromCommentAndRevision(resComment.body, resRevision.body, state.loggedUser.lang)

    this.setState({
      listMessage: revisionWithComment
    })
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
    props.appContentChangeTitle(state.content, newTitle, state.config.slug)
  }

  handleChangeNewComment = e => {
    const { props, state } = this
    props.appContentChangeComment(e, state.content, this.setState.bind(this))
  }

  handleClickValidateNewCommentBtn = async () => {
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
            {loggedUser.userRoleIdInWorkspace <= ROLE.contributor.id &&
              <SelectStatus
                selectedStatus={config.availableStatuses.find(s => s.slug === content.status)}
                availableStatus={config.availableStatuses}
                onChangeStatus={this.handleChangeStatus}
                disabled={content.is_archived || content.is_deleted}
              />
            }

            {loggedUser.userRoleIdInWorkspace <= ROLE.contentManager.id &&
              <ArchiveDeleteContent
                customColor={config.hexcolor}
                onClickArchiveBtn={this.handleClickArchive}
                onClickDeleteBtn={this.handleClickDelete}
                disabled={content.is_archived || content.is_deleted}
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
            isArchived={content.is_archived}
            onClickRestoreArchived={this.handleClickRestoreArchive}
            isDeleted={content.is_deleted}
            onClickRestoreDeleted={this.handleClickRestoreDelete}
            isDeprecated={content.status === config.availableStatuses[3].slug}
            deprecatedStatus={config.availableStatuses[3]}
            showTitle={false}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(appContentFactory(Thread))
