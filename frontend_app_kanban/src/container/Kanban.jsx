import React from 'react'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import { uniqBy } from 'lodash'
import {
  APP_FEATURE_MODE,
  BREADCRUMBS_TYPE,
  CONTENT_TYPE,
  CUSTOM_EVENT,
  DEFAULT_ROLE_LIST,
  FAVORITE_STATE,
  PAGE,
  ROLE_LIST,
  ROLE,
  SORT_BY,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  FilenameWithBadges,
  PopinFixed,
  PopinFixedContent,
  PopinFixedRightPart,
  PopinFixedRightPartContent,
  TagList,
  Timeline,
  ToDoManagement,
  TracimComponent,
  addAllResourceI18n,
  appContentFactory,
  buildContentPathBreadcrumbs,
  buildHeadTitle,
  getFileContent,
  getFileRevision,
  getOrCreateSessionClientToken,
  getToDo,
  handleClickCopyLink,
  handleFetchResult,
  putMyselfFileRead,
  sendGlobalFlashMessage,
  sortListByMultipleCriteria
} from 'tracim_frontend_lib'

import KanbanComponent from '../component/Kanban.jsx'

// TODO - S.G. - 2021-11-24 - The kanban app uses file storage in backend
// This should be fixed when https://github.com/tracim/tracim/issues/5102 is implemented.
const FILE_APP_SLUG = CONTENT_TYPE.FILE

export class Kanban extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'kanban',
      breadcrumbsList: [],
      config: param.config,
      content: param.content,
      currentContentRevisionId: param.content.current_revision_id,
      editionAuthor: '',
      externalTranslationList: [
        props.t('Create a Kanban board')
      ],
      fullscreen: false,
      invalidMentionList: [],
      isFileCommentLoading: false,
      isTemplate: false,
      isVisible: true,
      lockedToDoList: [],
      loggedUser: param.loggedUser,
      loading: false,
      newContent: {},
      showInvalidMentionPopupInComment: false,
      showProgress: true,
      showRefreshWarning: false,
      translationTargetLanguageCode: param.loggedUser.lang,
      toDoList: []
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
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.KANBAN, handler: this.handleContentChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.KANBAN, handler: this.handleContentChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.KANBAN, handler: this.handleContentChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.TODO, handler: this.handleToDoCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.TODO, handler: this.handleToDoChanged },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.TODO, handler: this.handleToDoDeleted },
      { entityType: TLM_ET.SHAREDSPACE_MEMBER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleMemberModified }
    ])
  }

  handleShowApp = data => {
    const { props, state } = this
    console.log('%c<Kanban> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP(state.config.slug), data)
    props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), this.buildBreadcrumbs)
    if (data.content.content_id === state.content.content_id) this.setHeadTitle(state.content.label)
  }

  handleHideApp = data => {
    console.log('%c<Kanban> Custom event', 'color: #28a745', CUSTOM_EVENT.HIDE_APP(this.state.config.slug), data)
    this.props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
  }

  handleReloadContent = data => {
    console.log('%c<Kanban> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_CONTENT(this.state.config.slug), data)
    this.props.appContentCustomEventHandlerReloadContent(data, this.setState.bind(this), this.state.appName)
  }

  handleReloadAppFeatureData = () => {
    console.log('%c<Kanban> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(this.state.config.slug))
    this.props.appContentCustomEventHandlerReloadAppFeatureData(this.loadContent, () => { this.props.loadTimeline(getFileRevision, this.state.content) })
  }

  handleAllAppChangeLanguage = data => {
    const { props } = this
    console.log('%c<Kanban> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)
    props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n)
  }

  handleChangeMarkedTemplate = (isTemplate) => {
    const { props, state } = this
    props.appContentMarkAsTemplate(this.setState.bind(this), state.content, isTemplate)
  }

  handleClickShowRevision = async revision => {
    const { state, props } = this

    const revisionArray = props.timeline.filter(t => t.timelineType === 'revision')
    const isLastRevision = revision.revision_id === revisionArray[revisionArray.length - 1].revision_id

    if (state.mode === APP_FEATURE_MODE.REVISION && isLastRevision) {
      this.handleClickLastVersion()
      return
    }

    if (state.mode === APP_FEATURE_MODE.VIEW && isLastRevision) return

    this.setState(prev => ({
      content: {
        ...prev.content,
        ...revision,
        workspace_id: state.content.workspace_id,
        current_revision_id: revision.revision_id,
        is_archived: prev.is_archived,
        is_deleted: prev.is_deleted
      },
      mode: APP_FEATURE_MODE.REVISION
    }))
  }

  handleClickLastVersion = () => {
    this.setState({ mode: APP_FEATURE_MODE.VIEW })
    this.loadContent()
  }

  handleMemberModified = async data => {
    const { state } = this
    if (data.fields.user.user_id !== state.loggedUser.userId) return

    const newUserRoleId = ROLE_LIST.find(r => data.fields.member.role === r.slug).id

    this.setState(prev => ({ ...prev, loggedUser: { ...prev.loggedUser, userRoleIdInWorkspace: newUserRoleId } }))
  }

  handleToDoCreated = async data => {
    const { state } = this
    if (data.fields.content.parent.content_id !== state.content.content_id) return

    const fecthGetToDo = await handleFetchResult(await getToDo(
      state.config.apiUrl,
      data.fields.workspace.workspace_id,
      data.fields.content.parent.content_id,
      data.fields.content.content_id
    ))

    this.setState(prevState => ({
      toDoList: sortListByMultipleCriteria(
        uniqBy([fecthGetToDo.body, ...prevState.toDoList], 'content_id'),
        [SORT_BY.STATUS, SORT_BY.CREATION_DATE, SORT_BY.ID]
      )
    }))
  }

  handleToDoChanged = async data => {
    const { state } = this
    if (data.fields.content.parent.content_id !== state.content.content_id) return

    // INFO - MP - 2022-07-19 - We fetch the to do data because we don't trust Redux
    // therefore we only update the to do when we fetch a TLM. Gives the impression
    // of lags
    const fecthGetToDo = await handleFetchResult(await getToDo(
      state.config.apiUrl,
      data.fields.workspace.workspace_id,
      data.fields.content.parent.content_id,
      data.fields.content.content_id
    ))

    this.setState(prevState => ({
      toDoList: prevState.toDoList.map(toDo => toDo.content_id === data.fields.content.content_id ? fecthGetToDo.body : toDo),
      lockedToDoList: prevState.lockedToDoList.filter(toDoId => toDoId !== data.fields.content.content_id)
    }))
  }

  handleToDoDeleted = data => {
    const { state } = this
    if (data.fields.content.parent.content_id !== state.content.content_id) return

    this.setState(prevState => ({
      toDoList: prevState.toDoList.filter(toDo => toDo.content_id !== data.fields.content.content_id),
      lockedToDoList: prevState.lockedToDoList.filter(toDoId => toDoId !== data.fields.content.content_id)
    }))
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
    console.log('%c<Kanban> did Mount', `color: ${this.state.config.hexcolor}`)
    this.updateTimelineAndContent()
    this.props.loadFavoriteContentList(this.state.loggedUser, this.setState.bind(this))
  }

  updateTimelineAndContent () {
    const { props } = this
    this.loadContent()
    props.loadTimeline(getFileRevision, this.state.content)
  }

  getMenuItemList = () => {
    const { props, state } = this
    const timelineObject = {
      id: 'timeline',
      label: props.t('Timeline'),
      icon: 'fa-history',
      children: state.config.apiUrl ? (
        <PopinFixedRightPartContent
          label={props.t('Timeline')}
        >
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
            translationTargetLanguageList={state.config.system.config.translation_service__target_languages}
            translationTargetLanguageCode={state.translationTargetLanguageCode}
            workspaceId={state.content.workspace_id}
            // End of required props ///////////////////////////////////////////
            availableStatusList={state.config.availableStatuses}
            canLoadMoreTimelineItems={props.canLoadMoreTimelineItems}
            codeLanguageList={state.config.system.config.code_languages}
            customClass={`${state.config.slug}__contentpage`}
            customColor={state.config.hexcolor}
            disableComment={state.mode === APP_FEATURE_MODE.REVISION || state.mode === APP_FEATURE_MODE.EDIT || !state.content.is_editable}
            invalidMentionList={state.invalidMentionList}
            isFileCommentLoading={state.isFileCommentLoading}
            isLastTimelineItemCurrentToken={props.isLastTimelineItemCurrentToken}
            loading={props.loadingTimeline}
            memberList={state.config.workspace.memberList}
            onChangeTranslationTargetLanguageCode={this.handleChangeTranslationTargetLanguageCode}
            onClickDeleteComment={this.handleClickDeleteComment}
            onClickEditComment={this.handleClickEditComment}
            onClickOpenFileComment={this.handleClickOpenFileComment}
            onClickRevisionBtn={this.handleClickShowRevision}
            onClickShowMoreTimelineItems={this.handleLoadMoreTimelineItems}
            roleList={DEFAULT_ROLE_LIST}
            shouldScrollToBottom={state.mode !== APP_FEATURE_MODE.REVISION}
          />
        </PopinFixedRightPartContent>
      ) : null
    }

    const menuItemList = [timelineObject]

    if (state.config.toDoEnabled) {
      const toDoObject = {
        id: 'todo',
        label: props.t('Tasks'),
        icon: 'fas fa-check-square',
        children: (
          <PopinFixedRightPartContent
            label={props.t('Tasks')}
            toDoList={state.toDoList}
            showProgress={state.showProgress}
          >
            <ToDoManagement
              apiUrl={state.config.apiUrl}
              contentId={state.content.content_id}
              customColor={state.config.hexcolor}
              lockedToDoList={state.lockedToDoList}
              memberList={state.config.workspace.memberList}
              onClickChangeStatusToDo={this.handleChangeStatusToDo}
              onClickDeleteToDo={this.handleDeleteToDo}
              onClickSaveNewToDo={this.handleSaveNewToDo}
              displayProgressBarStatus={this.setShowProgressBarStatus}
              user={state.loggedUser}
              toDoList={state.toDoList}
              workspaceId={state.content.workspace_id}
            />
          </PopinFixedRightPartContent>
        )
      }
      menuItemList.push(toDoObject)
    }

    const tagObject = {
      id: 'tag',
      label: props.t('Tags'),
      icon: 'fas fa-tag',
      children: (
        <PopinFixedRightPartContent
          label={props.t('Tags')}
        >
          <TagList
            apiUrl={state.config.apiUrl}
            customColor={state.config.hexcolor}
            workspaceId={state.content.workspace_id}
            contentId={state.content.content_id}
            userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
            userProfile={state.loggedUser.profile}
          />
        </PopinFixedRightPartContent>
      )
    }
    menuItemList.push(tagObject)

    return menuItemList
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this
    console.log('%c<Kanban> did Update', `color: ${state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) {
      this.updateTimelineAndContent()
    }

    if (prevState.isVisible !== state.isVisible) {
      this.setState({
        currentContentRevisionId: (prevState.isVisible && !state.isVisible)
          ? undefined
          : state.content.current_revision_id
      })
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
      await getFileContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    )
    this.setState({
      content: response.body,
      isTemplate: response.body.is_template,
      currentContentRevisionId: response.body.current_revision_id,
      loadingContent: false
    })
    this.setHeadTitle(response.body.label)
    this.buildBreadcrumbs(response.body)

    await putMyselfFileRead(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    if (state.config.toDoEnabled) this.props.getToDoList(this.setState.bind(this), state.content.workspace_id, state.content.content_id)
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
      console.error('Error in app kanban, count not build breadcrumbs', e)
    }
  }

  handleSaveNewToDo = (assignedUserId, toDo) => {
    const { state, props } = this
    props.appContentSaveNewToDo(state.content.workspace_id, state.content.content_id, assignedUserId, toDo, this.setState.bind(this))
    this.setState({ showProgress: true })
  }

  handleDeleteToDo = (toDo) => {
    const { state, props } = this
    props.appContentDeleteToDo(
      state.content.workspace_id,
      state.content.content_id,
      toDo.content_id,
      this.setState.bind(this),
      state.lockedToDoList
    )
  }

  handleChangeStatusToDo = (toDo, status) => {
    const { state, props } = this
    props.appContentChangeStatusToDo(
      state.content.workspace_id,
      state.content.content_id,
      toDo.content_id,
      status,
      this.setState.bind(this),
      state.lockedToDoList
    )
  }

  setShowProgressBarStatus = (showProgressStatus) => {
    this.setState({ showProgress: showProgressStatus })
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
  }

  handleLoadMoreTimelineItems = async () => {
    const { props } = this
    await props.loadMoreTimelineItems(getFileRevision)
  }

  handleSaveEditTitle = async newTitle => {
    const { props, state } = this
    props.appContentChangeTitle(state.content, newTitle, FILE_APP_SLUG)
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

  handleClickCopyLink = () => {
    const { props, state } = this
    handleClickCopyLink(state.content.content_id)
    sendGlobalFlashMessage(props.t('The link has been copied to clipboard'), 'info')
  }

  handleCancelSave = () => this.setState({ showInvalidMentionPopupInComment: false })

  handleChangeStatus = async newStatus => {
    const { props, state } = this
    props.appContentChangeStatus(state.content, newStatus, FILE_APP_SLUG)
  }

  handleClickArchive = async () => {
    const { props, state } = this
    props.appContentArchive(state.content, this.setState.bind(this), FILE_APP_SLUG)
  }

  handleClickDelete = async () => {
    const { props, state } = this
    props.appContentDelete(state.content, this.setState.bind(this), FILE_APP_SLUG)
  }

  handleClickRestoreArchive = async () => {
    const { props, state } = this
    props.appContentRestoreArchive(state.content, this.setState.bind(this), FILE_APP_SLUG)
  }

  handleClickRestoreDelete = async () => {
    const { props, state } = this
    props.appContentRestoreDelete(state.content, this.setState.bind(this), FILE_APP_SLUG)
  }

  handleClickFullscreen = () => {
    if (!this.state.fullscreen) {
      GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.HIDE_SIDEBAR, data: {} })
    }
    this.setState(prevState => ({ fullscreen: !prevState.fullscreen }))
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

  handleClickOpenFileComment = (comment) => {
    const { state } = this
    state.config.history.push(PAGE.WORKSPACE.CONTENT(
      state.content.workspace_id,
      CONTENT_TYPE.FILE,
      comment.content_id
    ))
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
      currentContentRevisionId: newObjectContent.current_revision_id,
      showRefreshWarning: false
    }))
    this.setHeadTitle(newObjectContent.label)
    this.buildBreadcrumbs(newObjectContent)
  }

  handleChangeTranslationTargetLanguageCode = (translationTargetLanguageCode) => {
    this.setState({ translationTargetLanguageCode })
  }

  render () {
    const { props, state } = this

    if (!state.isVisible) return null

    const revisionList = props.timeline.filter(t => t.timelineType === 'revision')
    const contentVersionNumber = (revisionList.find(t => t.revision_id === state.content.current_revision_id) || { version_number: 1 }).version_number
    const lastVersionNumber = (revisionList[revisionList.length - 1] || { version_number: 1 }).version_number
    const readOnly = (
      state.loggedUser.userRoleIdInWorkspace < ROLE.contributor.id ||
      state.mode === APP_FEATURE_MODE.REVISION ||
      state.content.is_archived ||
      state.content.is_deleted ||
      !state.content.is_editable
    )

    return (
      <PopinFixed
        customClass={state.config.slug}
        customColor={state.config.hexcolor}
      >
        <PopinFixedContent
          actionList={[
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
              disabled: readOnly,
              dataCy: 'popinListItem__delete'
            }
          ]}
          headerButtons={[
            {
              icon: 'fas fa-expand-arrows-alt',
              label: props.t('Fullscreen'),
              onClick: this.handleClickFullscreen,
              showAction: true
            }
          ]}
          loading={state.loadingContent}
          appMode={state.mode}
          availableStatuses={state.config.availableStatuses}
          breadcrumbsList={state.breadcrumbsList}
          content={state.content}
          config={state.config}
          customClass={`${state.config.slug}__contentpage`}
          disableChangeTitle={!state.content.is_editable}
          isRefreshNeeded={state.showRefreshWarning}
          isTemplate={state.isTemplate}
          contentVersionNumber={contentVersionNumber}
          lastVersion={lastVersionNumber}
          loggedUser={state.loggedUser}
          onChangeStatus={this.handleChangeStatus}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onClickChangeMarkedTemplate={this.handleChangeMarkedTemplate}
          onValidateChangeTitle={this.handleSaveEditTitle}
          showReactions
          showMarkedAsTemplate
          componentTitle={<FilenameWithBadges file={state.content} isTemplate={state.isTemplate} />}
          favoriteState={props.isContentInFavoriteList(state.content, state)
            ? FAVORITE_STATE.FAVORITE
            : FAVORITE_STATE.NOT_FAVORITE}
          onClickAddToFavoriteList={() => props.addContentToFavoriteList(
            state.content, state.loggedUser, this.setState.bind(this)
          )}
          onClickRemoveFromFavoriteList={() => props.removeContentFromFavoriteList(
            state.content, state.loggedUser, this.setState.bind(this)
          )}
        >
          <KanbanComponent
            config={state.config}
            content={state.content}
            // End of required props ///////////////////////////////////////////
            editionAuthor={state.editionAuthor}
            fullscreen={state.fullscreen}
            isNewContentRevision={!!state.currentContentRevisionId}
            isRefreshNeeded={state.showRefreshWarning}
            language={state.loggedUser.lang}
            mode={state.mode}
            onClickFullscreen={this.handleClickFullscreen}
            onClickLastVersion={this.handleClickLastVersion}
            onClickRefresh={this.handleClickRefresh}
            onClickRestoreDeleted={this.handleClickRestoreDelete}
            readOnly={readOnly}
          />
          <PopinFixedRightPart
            customClass={`${state.config.slug}__contentpage`}
            customColor={state.config.hexcolor}
            menuItemList={this.getMenuItemList()}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(appContentFactory(TracimComponent(Kanban)))
