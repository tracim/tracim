import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  APP_CUSTOM_ACTION_LOCATION_OBJECT,
  appContentFactory,
  addAllResourceI18n,
  BREADCRUMBS_TYPE,
  buildContentPathBreadcrumbs,
  CONTENT_NAMESPACE,
  CONTENT_TYPE,
  EmojiReactions,
  handleClickCopyLink,
  handleFetchResult,
  PAGE,
  PopinFixed,
  ConfirmPopup,
  PopinFixedHeader,
  PopinFixedContent,
  Timeline,
  CUSTOM_EVENT,
  buildHeadTitle,
  RefreshWarningMessage,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent,
  getOrCreateSessionClientToken,
  sendGlobalFlashMessage,
  FAVORITE_STATE,
  ROLE,
  COLORS,
  SelectStatus,
  buildAppCustomActionLinkList,
  defaultApiContent
} from 'tracim_frontend_lib'
import {
  getThreadContent,
  getThreadRevision,
  putThreadRead
} from '../action.async.js'

export class Thread extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'thread',
      breadcrumbsList: [],
      isVisible: true,
      config: param.config,
      content: param.content,
      loggedUser: param.loggedUser,
      loading: false,
      newContent: {},
      externalTranslationList: [
        props.t('Thread'),
        props.t('Threads'),
        props.t('thread'),
        props.t('threads'),
        props.t('Start a topic')
      ],
      showRefreshWarning: false,
      showChangeTypeContentPopup: false,
      showPermanentlyDeletePopup: false,
      editionAuthor: '',
      invalidMentionList: [],
      showInvalidMentionPopupInComment: false,
      translationTargetLanguageCode: param.loggedUser.lang,
      isFileCommentLoading: false
    }
    this.sessionClientToken = getOrCreateSessionClientToken()
    this.isLoadMoreTimelineInProgress = false

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
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.THREAD, handler: this.handleContentChanged }
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
    const dataWithPropertyReset = {
      ...defaultApiContent,
      ...data
    }
    this.props.appContentCustomEventHandlerReloadContent(dataWithPropertyReset, this.setState.bind(this), this.state.appName)
  }

  handleReloadAppFeatureData = () => {
    console.log('%c<Thread> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(this.state.config.slug))
    this.props.appContentCustomEventHandlerReloadAppFeatureData(this.loadContent, () => { this.props.loadTimeline(getThreadRevision, this.state.content) })
  }

  handleAllAppChangeLanguage = data => {
    const { props } = this
    console.log('%c<Thread> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)
    props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n)
  }

  handleClickPermanentlyDeleteButton = () => {
    const { state } = this
    console.log(state.loggedUser)
    this.setState(prev => ({ showPermanentlyDeletePopup: !prev.showPermanentlyDeletePopup }))
  }

  handleClickValidatePermanentlyDeleteButton = () => {
    const { state } = this
    this.props.appContentDeletePermanently(state.content.workspace_id, state.content.content_id, this.handleClickBtnCloseApp)
    this.handleClickPermanentlyDeleteButton()
  }

  // TLM Handlers

  handleContentChanged = data => {
    const { state } = this
    if (data.fields.content.content_id !== state.content.content_id) return

    const clientToken = state.config.apiHeader['X-Tracim-ClientToken']
    const newContentObject = { ...state.content, ...data.fields.content }
    this.setState(prev => ({
      content: clientToken === data.fields.client_token ? newContentObject : prev.content,
      newContent: newContentObject,
      editionAuthor: data.fields.author.public_name,
      showRefreshWarning: clientToken !== data.fields.client_token
    }))
    if (clientToken === data.fields.client_token) {
      this.setHeadTitle(newContentObject.label)
      this.buildBreadcrumbs(newContentObject)
    }
  }

  componentDidMount () {
    console.log('%c<Thread> did Mount', `color: ${this.state.config.hexcolor}`)
    this.updateTimelineAndContent()
    this.props.loadFavoriteContentList(this.state.loggedUser, this.setState.bind(this))
  }

  updateTimelineAndContent () {
    const { props } = this
    this.loadContent()
    props.loadTimeline(getThreadRevision, this.state.content)
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this
    console.log('%c<Thread> did Update', `color: ${state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    // INFO - MP - 24-08-2022 - We update the timeline when there is a new content added to the
    // thread or a content removed from the thread
    if (prevState.content.content_id !== state.content.content_id) {
      this.updateTimelineAndContent()
    }
  }

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

    // RJ - 2021-08-07 the state is set before the await, and is therefore not redundant
    // with the setState at the end of the function
    this.setState({ loadingContent: true })

    const response = await handleFetchResult(
      await getThreadContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    )
    this.setState({
      content: response.body,
      loadingContent: false
    })
    this.setHeadTitle(response.body.label)
    this.buildBreadcrumbs(response.body)

    await putThreadRead(state.loggedUser, state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
  }

  buildBreadcrumbs = async content => {
    try {
      const contentBreadcrumbsList = await buildContentPathBreadcrumbs(this.state.config.apiUrl, content)
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.APPEND_BREADCRUMBS,
        data: {
          breadcrumbs: contentBreadcrumbsList
        }
      })
      const space = {
        link: PAGE.WORKSPACE.DASHBOARD(content.workspace_id),
        label: this.state.config.workspace.label,
        type: BREADCRUMBS_TYPE.CORE,
        isALink: true
      }
      this.setState({ breadcrumbsList: [space, ...contentBreadcrumbsList] })
    } catch (e) {
      console.error('Error in app thread, count not build breadcrumbs', e)
    }
  }

  handleClickBtnCloseApp = () => {
    const { state } = this
    const isPublication = state.content.content_namespace === CONTENT_NAMESPACE.PUBLICATION
    if (isPublication) state.config.history.push(PAGE.WORKSPACE.PUBLICATIONS(state.content.workspace_id))
    else {
      this.setState({ isVisible: false })
      GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
    }
  }

  handleLoadMoreTimelineItems = async () => {
    const { props } = this

    if (this.isLoadMoreTimelineInProgress) return

    this.isLoadMoreTimelineInProgress = true
    await props.loadMoreTimelineItems(getThreadRevision)
    this.isLoadMoreTimelineInProgress = false
  }

  handleSaveEditTitle = async newTitle => {
    const { props, state } = this
    props.appContentChangeTitle(state.content, newTitle, state.config.slug)
  }

  handleChangeNewComment = e => {
    const { props, state } = this
    props.appContentChangeComment(e, state.content, this.setState.bind(this), state.appName)
  }

  handleClickValidateNewComment = async (comment, commentAsFileList) => {
    const { props, state } = this
    await props.appContentSaveNewCommentText(
      state.content,
      comment
    )
    await props.appContentSaveNewCommentFileList(
      this.setState.bind(this),
      state.content,
      commentAsFileList
    )
    return true
  }

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

  handleClickCopyLink = () => {
    const { props, state } = this
    handleClickCopyLink(state.content.content_id)
    sendGlobalFlashMessage(props.t('The link has been copied to clipboard'), 'info')
  }

  handleClickEditComment = (comment, contentId, parentId) => {
    const { props, state } = this
    props.appContentEditComment(
      state.content.workspace_id,
      parentId,
      contentId,
      comment
    )
  }

  handleClickDeleteComment = async (comment) => {
    const { state } = this
    this.props.appContentDeleteComment(
      state.content.workspace_id,
      comment.parent_id,
      comment.content_id
    )
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

  handleChangeTranslationTargetLanguageCode = (translationTargetLanguageCode) => {
    this.setState({ translationTargetLanguageCode })
  }

  handleToggleContentChangeTypePopup = content => {
    this.setState(prev => ({
      showChangeTypeContentPopup: !prev.showChangeTypeContentPopup,
      contentToChange: prev.showChangeTypeContentPopup ? null : content
    }))
  }

  handleClickValidateChangeType = async () => {
    const { props, state } = this
    props.appContentChangeType(state.content, this.setState.bind(this))
    this.setState({
      showChangeTypeContentPopup: false,
      contentToChange: null
    })
  }

  handlePermanentlyDeleteComment = async (comment) => {
    const { state } = this
    this.props.appContentDeletePermanently(state.content.workspace_id, comment.content_id, () => {})
  }

  render () {
    const { props, state } = this
    const isPublication = state.content.content_namespace === CONTENT_NAMESPACE.PUBLICATION
    const color = isPublication ? COLORS.PUBLICATION : state.config.hexcolor

    if (!state.isVisible) return null

    return (
      <PopinFixed customClass={state.config.slug} customColor={color}>
        <PopinFixedHeader
          loading={state.loadingContent}
          customClass={`${state.config.slug}__contentpage`}
          customColor={color}
          faIcon={isPublication ? 'fas fa-stream' : state.config.faIcon}
          rawTitle={state.content.label}
          componentTitle={<span className='componentTitle'>{state.content.label}</span>}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
          disableChangeTitle={!state.content.is_editable}
          actionList={isPublication ? [
            {
              icon: 'fas fa-link',
              label: props.t('Copy news link'),
              onClick: this.handleClickCopyLink,
              showAction: true,
              dataCy: 'popinListItem__copyLink'
            }, {
              icon: 'far fa-comments',
              label: props.t('Turn into thread'),
              onClick: this.handleToggleContentChangeTypePopup,
              showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id,
              disabled: state.content.is_archived || state.content.is_deleted,
              dataCy: 'popinListItem__content_type'
            }, {
              icon: 'far fa-trash-alt',
              label: props.t('Delete'),
              onClick: this.handleClickDelete,
              showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id,
              disabled: state.content.is_archived || state.content.is_deleted,
              dataCy: 'popinListItem__delete'
            },
            {
              icon: 'fas fa-exclamation-triangle',
              label: props.t('Permanently delete'),
              onClick: this.handleClickPermanentlyDeleteButton,
              showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.workspaceManager.id,
              disabled: false,
              separatorLine: true,
              dataCy: 'popinListItem__permanentlyDelete'
            }
          ] : [
            {
              icon: 'fas fa-link',
              label: props.t('Copy content link'),
              onClick: this.handleClickCopyLink,
              showAction: true,
              dataCy: 'popinListItem__copyLink'
            }, {
              icon: 'far fa-trash-alt',
              label: props.t('Delete'),
              onClick: this.handleClickDelete,
              showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id,
              disabled: state.content.is_archived || state.content.is_deleted,
              dataCy: 'popinListItem__delete'
            }, {
              icon: 'fas fa-exclamation-triangle',
              label: props.t('Permanently delete'),
              onClick: this.handleClickPermanentlyDeleteButton,
              showAction: state.loggedUser.userRoleIdInWorkspace >= ROLE.workspaceManager.id,
              disabled: false,
              separatorLine: true,
              dataCy: 'popinListItem__permanentlyDelete'
            }
          ]}
          customActionList={buildAppCustomActionLinkList(
            state.config.appCustomActionList,
            APP_CUSTOM_ACTION_LOCATION_OBJECT.CONTENT_APP_DROPDOWN,
            state.content,
            state.loggedUser,
            CONTENT_TYPE.THREAD,
            state.translationTargetLanguageCode
          )}
          content={state.content}
          favoriteState={props.isContentInFavoriteList(state.content, state)
            ? FAVORITE_STATE.FAVORITE
            : FAVORITE_STATE.NOT_FAVORITE}
          onClickAddToFavoriteList={() => props.addContentToFavoriteList(
            state.content, state.loggedUser, this.setState.bind(this)
          )}
          onClickRemoveFromFavoriteList={() => props.removeContentFromFavoriteList(
            state.content, state.loggedUser, this.setState.bind(this)
          )}
          breadcrumbsList={state.breadcrumbsList}
        />

        {state.showChangeTypeContentPopup && (
          <ConfirmPopup
            customColor={props.customColor}
            confirmLabel={props.t('Turn into thread')}
            confirmIcon='far fa-comments'
            onConfirm={this.handleClickValidateChangeType}
            onCancel={this.handleToggleContentChangeTypePopup}
          />
        )}

        <PopinFixedContent customClass={`${state.config.slug}__contentpage`}>
          <div className='thread__contentpage'>
            {/* INFO - G.B. - 20210616 - Since the thread component behaves a bit differently than the others it was preferable to put
            Breadcrumbs and SelectStatus here directly than to adapt the PopinFixedContent component to cover thread as well. */}
            <div className='thread__contentpage__top'>
              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && state.config.availableStatuses && (
                <>
                  <EmojiReactions
                    apiUrl={state.config.apiUrl}
                    loggedUser={state.loggedUser}
                    contentId={state.content.content_id}
                    workspaceId={state.content.workspace_id}
                  />
                  <div className='wsContentGeneric__content__left__top__selectStatus'>
                    <SelectStatus
                      selectedStatus={state.config.availableStatuses.find(s => s.slug === state.content.status)}
                      availableStatus={state.config.availableStatuses}
                      onChangeStatus={this.handleChangeStatus}
                      disabled={state.content.is_archived || state.content.is_deleted}
                    />
                  </div>
                </>
              )}
            </div>
            {state.showRefreshWarning && (
              <RefreshWarningMessage
                tooltip={props.t('The content has been modified by {{author}}', { author: state.editionAuthor, interpolation: { escapeValue: false } })}
                onClickRefresh={this.handleClickRefresh}
              />
            )}
            {/* FIXME - GB - 2019-06-05 - we need to have a better way to check the state.config than using state.config.availableStatuses[3].slug
            https://github.com/tracim/tracim/issues/1840 */}
            {state.config.apiUrl ? (
              <Timeline
                apiUrl={state.config.apiUrl}
                contentId={state.content.content_id}
                contentType={state.content.content_type}
                loggedUser={state.loggedUser}
                onClickRestoreComment={props.handleRestoreComment}
                onClickSubmit={this.handleClickValidateNewComment}
                onClickTranslateComment={(comment, languageCode = null) => props.handleTranslateComment(
                  comment,
                  state.content.workspace_id,
                  languageCode || state.translationTargetLanguageCode
                )}
                timelineData={props.timeline}
                translationTargetLanguageCode={state.translationTargetLanguageCode}
                system={state.config.system}
                workspaceId={state.content.workspace_id}
                // End of required props ///////////////////////////////////////
                allowClickOnRevision={false}
                availableStatusList={state.config.availableStatuses}
                canLoadMoreTimelineItems={props.canLoadMoreTimelineItems}
                customClass={`${state.config.slug}__contentpage`}
                customColor={color}
                deprecatedStatus={state.config.availableStatuses[3]}
                disableComment={!state.content.is_editable}
                invalidMentionList={state.invalidMentionList}
                isArchived={state.content.is_archived}
                isDeleted={state.content.is_deleted}
                isDeprecated={state.content.status === state.config.availableStatuses[3].slug}
                isFileCommentLoading={state.isFileCommentLoading}
                isLastTimelineItemCurrentToken={props.isLastTimelineItemCurrentToken}
                loading={props.loadingTimeline}
                memberList={state.config.workspace && state.config.workspace.memberList}
                onChangeTranslationTargetLanguageCode={this.handleChangeTranslationTargetLanguageCode}
                onClickDeleteComment={this.handleClickDeleteComment}
                onClickPermanentlyDeleteComment={this.handlePermanentlyDeleteComment}
                shouldShowPermanentlyDeleteButton={state.loggedUser.userRoleIdInWorkspace >= ROLE.workspaceManager.id}
                onClickEditComment={this.handleClickEditComment}
                onClickRestoreArchived={this.handleClickRestoreArchive}
                onClickRestoreDeleted={this.handleClickRestoreDelete}
                onClickRevisionBtn={() => { }}
                onClickShowMoreTimelineItems={this.handleLoadMoreTimelineItems}
                shouldScrollToBottom
              />
            ) : null}
          </div>
        </PopinFixedContent>
        {state.showPermanentlyDeletePopup && (
          <ConfirmPopup
            customColor={props.customColor}
            confirmLabel={props.t('Yes, delete permanently')}
            confirmIcon='fas fa-exclamation-triangle'
            onConfirm={this.handleClickValidatePermanentlyDeleteButton}
            onCancel={this.handleClickPermanentlyDeleteButton}
            msg={props.t('Warning: this operation cannot be rolled back')}
            titleLabel={props.t('Permanently delete')}
          />
        )}
      </PopinFixed>
    )
  }
}

export default translate()(appContentFactory(TracimComponent(Thread)))
