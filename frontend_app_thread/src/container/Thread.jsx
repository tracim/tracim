import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import { debug } from '../debug.js'
import {
  appContentFactory,
  addAllResourceI18n,
  buildContentPathBreadcrumbs,
  handleFetchResult,
  handleInvalidMentionInComment,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  Timeline,
  SelectStatus,
  ArchiveDeleteContent,
  ROLE,
  CUSTOM_EVENT,
  LOCAL_STORAGE_FIELD,
  getLocalStorageItem,
  buildHeadTitle,
  addRevisionFromTLM,
  RefreshWarningMessage,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent,
  getOrCreateSessionClientToken,
  getContentComment,
  permissiveNumberEqual
} from 'tracim_frontend_lib'
import {
  getThreadContent,
  getThreadRevision,
  putThreadRead
} from '../action.async.js'

export class Thread extends React.Component {
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
      timeline: [],
      newComment: '',
      newContent: {},
      timelineWysiwyg: false,
      externalTranslationList: [
        props.t('Thread'),
        props.t('Threads'),
        props.t('thread'),
        props.t('threads'),
        props.t('Start a topic')
      ],
      showRefreshWarning: false,
      editionAuthor: '',
      invalidMentionList: [],
      isLastTimelineItemCurrentToken: false,
      showInvalidMentionPopupInComment: false
    }
    this.sessionClientToken = getOrCreateSessionClientToken()

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.SHOW_APP(this.state.config.slug), handler: this.handleShowApp },
      { name: CUSTOM_EVENT.HIDE_APP(this.state.config.slug), handler: this.handleHideApp },
      { name: CUSTOM_EVENT.RELOAD_CONTENT(this.state.config.slug), handler: this.handleReloadContent },
      { name: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(this.state.config.slug), handler: this.handleReloadAppFeatureData },
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.COMMENT, handler: this.handleCommentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentChanged },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModified }
    ])
  }

  handleShowApp = data => {
    const { props, state } = this
    console.log('%c<Thread> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP(state.config.slug), data)
    props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), this.buildBreadcrumbs)
    if (data.content.content_id === state.content.content_id) this.setHeadTitle(state.content.label)
  }

  handleHideApp = data => {
    console.log('%c<Thread> Custom event', 'color: #28a745', CUSTOM_EVENT.HIDE_APP(this.state.config.slug), data)
    this.props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
  }

  handleReloadContent = data => {
    console.log('%c<Thread> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_CONTENT(this.state.config.slug), data)
    this.props.appContentCustomEventHandlerReloadContent(data, this.setState.bind(this), this.state.appName)
  }

  handleReloadAppFeatureData = () => {
    console.log('%c<Thread> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(this.state.config.slug))
    this.props.appContentCustomEventHandlerReloadAppFeatureData(this.loadContent, this.loadTimeline)
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<Thread> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)
    this.props.appContentCustomEventHandlerAllAppChangeLanguage(
      data, this.setState.bind(this), i18n, this.state.timelineWysiwyg, this.handleChangeNewComment
    )
    this.loadTimeline()
  }

  handleContentChanged = data => {
    const { state } = this
    if (data.fields.content.content_id !== state.content.content_id) return

    const clientToken = state.config.apiHeader['X-Tracim-ClientToken']
    const newContentObject = { ...state.content, ...data.fields.content }
    this.setState(prev => ({
      content: clientToken === data.fields.client_token ? newContentObject : prev.content,
      newContent: newContentObject,
      editionAuthor: data.fields.author.public_name,
      showRefreshWarning: clientToken !== data.fields.client_token,
      timeline: addRevisionFromTLM(data.fields, prev.timeline, prev.loggedUser.lang),
      isLastTimelineItemCurrentToken: data.fields.client_token === this.sessionClientToken
    }))
    if (clientToken === data.fields.client_token) {
      this.setHeadTitle(newContentObject.label)
      this.buildBreadcrumbs(newContentObject)
    }
  }

  handleCommentCreated = (tlm) => {
    const { props, state } = this
    // Not a comment for our content
    if (!permissiveNumberEqual(tlm.fields.content.parent_id !== state.content.content_id)) return

    const createdByLoggedUser = tlm.fields.client_token === this.sessionClientToken
    const newTimeline = props.addCommentToTimeline(tlm.fields.content, state.timeline, state.loggedUser, createdByLoggedUser)
    this.setState({
      timeline: newTimeline,
      isLastTimelineItemCurrentToken: createdByLoggedUser
    })
  }

  handleUserModified = data => {
    const newTimeline = this.state.timeline.map(timelineItem => timelineItem.author.user_id === data.fields.user.user_id
      ? { ...timelineItem, author: data.fields.user }
      : timelineItem
    )

    this.setState({ timeline: newTimeline })
  }

  componentDidMount () {
    console.log('%c<Thread> did Mount', `color: ${this.state.config.hexcolor}`)
    this.updateTimelineAndContent()
  }

  async updateTimelineAndContent () {
    this.setState({
      newComment: getLocalStorageItem(
        this.state.appName,
        this.state.content,
        LOCAL_STORAGE_FIELD.COMMENT
      ) || ''
    })

    await this.loadContent()
    this.loadTimeline()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this
    console.log('%c<Thread> did Update', `color: ${state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) {
      this.updateTimelineAndContent()
    }

    if (prevState.timelineWysiwyg && !state.timelineWysiwyg) globalThis.tinymce.remove('#wysiwygTimelineComment')
  }

  componentWillUnmount () {
    console.log('%c<Thread> will Unmount', `color: ${this.state.config.hexcolor}`)
    globalThis.tinymce.remove('#wysiwygTimelineComment')
  }

  handleInitWysiwyg = (handleTinyMceInput, handleTinyMceKeyDown, handleTinyMceKeyUp, handleTinyMceSelectionChange) => {
    globalThis.wysiwyg(
      '#wysiwygTimelineComment',
      this.state.loggedUser.lang,
      this.handleChangeNewComment,
      handleTinyMceInput,
      handleTinyMceKeyDown,
      handleTinyMceKeyUp,
      handleTinyMceSelectionChange
    )
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

    if (state.config && state.config.workspace && state.isVisible) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([contentName, state.config.workspace.label]) }
      })
    }
  }

  loadContent = async () => {
    const { state } = this

    const response = await handleFetchResult(
      await getThreadContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    )
    this.setState({
      content: response.body,
      isLastTimelineItemCurrentToken: false
    })
    this.setHeadTitle(response.body.label)
    this.buildBreadcrumbs(response.body)

    await putThreadRead(state.loggedUser, state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
  }

  loadTimeline = async () => {
    const { props, state } = this

    const fetchResultThreadComment = getContentComment(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    const fetchResultRevision = getThreadRevision(state.config.apiUrl, state.content.workspace_id, state.content.content_id)

    const [resComment, resRevision] = await Promise.all([
      handleFetchResult(await fetchResultThreadComment),
      handleFetchResult(await fetchResultRevision)
    ])

    const revisionWithComment = props.buildTimelineFromCommentAndRevision(resComment.body, resRevision.body, state.loggedUser)

    this.setState({ timeline: revisionWithComment })
  }

  buildBreadcrumbs = (content) => {
    buildContentPathBreadcrumbs(this.state.config.apiUrl, content, this.props)
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
    props.appContentChangeComment(e, state.content, this.setState.bind(this), state.appName)
  }

  searchForMentionInQuery = async (query) => {
    return await this.props.searchForMentionInQuery(query, this.state.content.workspace_id)
  }

  handleClickValidateNewCommentBtn = async () => {
    const { state } = this

    if (!handleInvalidMentionInComment(
      state.config.workspace.memberList,
      state.timelineWysiwyg,
      state.newComment,
      this.setState.bind(this)
    )) {
      this.handleClickValidateAnywayNewComment()
    }
  }

  handleClickValidateAnywayNewComment = () => {
    const { props, state } = this
    try {
      props.appContentSaveNewComment(
        state.content,
        state.timelineWysiwyg,
        state.newComment,
        this.setState.bind(this),
        state.config.slug,
        state.loggedUser.username
      )
    } catch (e) {
      this.sendGlobalFlashMessage(e.message || props.t('Error while saving the comment'))
    }
  }

  handleToggleWysiwyg = () => this.setState(prev => ({ timelineWysiwyg: !prev.timelineWysiwyg }))

  handleCancelSave = () => this.setState({ showInvalidMentionPopupInComment: false })

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

  handleClickRefresh = () => {
    const { state } = this

    const newObjectContent = {
      ...state.content,
      ...state.newContent
    }

    this.setState(prev => ({
      content: {
        ...prev.content,
        ...prev.newContent
      },
      showRefreshWarning: false
    }))
    this.setHeadTitle(newObjectContent.label)
    this.buildBreadcrumbs(newObjectContent)
  }

  render () {
    const { state } = this

    if (!state.isVisible) return null

    return (
      <PopinFixed customClass={state.config.slug} customColor={state.config.hexcolor}>
        <PopinFixedHeader
          customClass={`${state.config.slug}__contentpage`}
          customColor={state.config.hexcolor}
          faIcon={state.config.faIcon}
          rawTitle={state.content.label}
          componentTitle={<div>{state.content.label}</div>}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
          disableChangeTitle={!state.content.is_editable}
        />

        <PopinFixedOption
          customClass={`${state.config.slug}__contentpage`}
          customColor={state.config.hexcolor}
          i18n={i18n}
        >
          <div>
            {state.showRefreshWarning && (
              <RefreshWarningMessage
                tooltip={this.props.t('The content has been modified by {{author}}', { author: state.editionAuthor, interpolation: { escapeValue: false } })}
                onClickRefresh={this.handleClickRefresh}
              />
            )}

            <div className='thread__rightMenu'>
              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && (
                <SelectStatus
                  selectedStatus={state.config.availableStatuses.find(s => s.slug === state.content.status)}
                  availableStatus={state.config.availableStatuses}
                  onChangeStatus={this.handleChangeStatus}
                  disabled={state.content.is_archived || state.content.is_deleted}
                />
              )}

              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id && (
                <ArchiveDeleteContent
                  customColor={state.config.hexcolor}
                  onClickArchiveBtn={this.handleClickArchive}
                  onClickDeleteBtn={this.handleClickDelete}
                  disabled={state.content.is_archived || state.content.is_deleted}
                />
              )}
            </div>
          </div>
        </PopinFixedOption>

        <PopinFixedContent customClass={`${state.config.slug}__contentpage`}>
          {/* FIXME - GB - 2019-06-05 - we need to have a better way to check the state.config than using state.config.availableStatuses[3].slug
            https://github.com/tracim/tracim/issues/1840 */}
          <Timeline
            customClass={`${state.config.slug}__contentpage`}
            customColor={state.config.hexcolor}
            loggedUser={state.loggedUser}
            timelineData={state.timeline}
            newComment={state.newComment}
            disableComment={!state.content.is_editable}
            availableStatusList={state.config.availableStatuses}
            wysiwyg={state.timelineWysiwyg}
            onChangeNewComment={this.handleChangeNewComment}
            onClickValidateNewCommentBtn={this.handleClickValidateNewCommentBtn}
            onClickWysiwygBtn={this.handleToggleWysiwyg}
            allowClickOnRevision={false}
            onClickRevisionBtn={() => {}}
            shouldScrollToBottom
            isArchived={state.content.is_archived}
            onClickRestoreArchived={this.handleClickRestoreArchive}
            isDeleted={state.content.is_deleted}
            onClickRestoreDeleted={this.handleClickRestoreDelete}
            isDeprecated={state.content.status === state.config.availableStatuses[3].slug}
            deprecatedStatus={state.config.availableStatuses[3]}
            showTitle={false}
            invalidMentionList={state.invalidMentionList}
            isLastTimelineItemCurrentToken={state.isLastTimelineItemCurrentToken}
            onClickCancelSave={this.handleCancelSave}
            onClickSaveAnyway={this.handleClickValidateAnywayNewComment}
            onInitWysiwyg={this.handleInitWysiwyg}
            showInvalidMentionPopup={state.showInvalidMentionPopupInComment}
            searchForMentionInQuery={this.searchForMentionInQuery}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(appContentFactory(TracimComponent(Thread)))
