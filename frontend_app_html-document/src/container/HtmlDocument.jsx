import React from 'react'
import HtmlDocumentComponent from '../component/HtmlDocument.jsx'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  addAllResourceI18n,
  addRevisionFromTLM,
  APP_FEATURE_MODE,
  appContentFactory,
  ArchiveDeleteContent,
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CUSTOM_EVENT,
  displayDistanceDate,
  generateLocalStorageContentId,
  getOrCreateSessionClientToken,
  handleFetchResult,
  NewVersionBtn,
  PopinFixed,
  PopinFixedContent,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedRightPart,
  RefreshWarningMessage,
  ROLE,
  SelectStatus,
  sortTimelineByDate,
  Timeline,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_SUB_TYPE as TLM_ST,
  TracimComponent
} from 'tracim_frontend_lib'
import { initWysiwyg } from '../helper.js'
import { debug } from '../debug.js'
import {
  getHtmlDocContent,
  getHtmlDocComment,
  getHtmlDocRevision,
  putHtmlDocContent,
  putHtmlDocRead,
  getMyselfKnownMember
} from '../action.async.js'
import Radium from 'radium'

export class HtmlDocument extends React.Component {
  constructor (props) {
    super(props)

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'html-document',
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      externalTranslationList: [
        props.t('Text Document'),
        props.t('Text Documents'),
        props.t('Text document'),
        props.t('text document'),
        props.t('text documents'),
        props.t('Write a document')
      ],
      rawContentBeforeEdit: '',
      timeline: [],
      newComment: '',
      newContent: {},
      timelineWysiwyg: false,
      mode: APP_FEATURE_MODE.VIEW,
      showRefreshWarning: false,
      editionAuthor: '',
      isLastTimelineItemCurrentToken: false
    }
    this.sessionClientToken = getOrCreateSessionClientToken()

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.SHOW_APP(this.state.config.slug), handler: this.handleShowApp },
      { name: CUSTOM_EVENT.HIDE_APP(this.state.config.slug), handler: this.handleHideApp },
      { name: CUSTOM_EVENT.RELOAD_CONTENT(this.state.config.slug), handler: this.handleReloadContent },
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, optionalSubType: TLM_ST.COMMENT, handler: this.handleContentCreated },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentDeletedOrRestore },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.UNDELETED, optionalSubType: TLM_ST.HTML_DOCUMENT, handler: this.handleContentDeletedOrRestore },
      { entityType: TLM_ET.USER, coreEntityType: TLM_CET.MODIFIED, handler: this.handleUserModified }
    ])
  }

  // TLM Handlers
  handleContentModified = data => {
    const { state } = this
    if (data.content.content_id !== state.content.content_id) return

    const clientToken = state.config.apiHeader['X-Tracim-ClientToken']
    this.setState(prev => ({
      ...prev,
      content: clientToken === data.client_token ? { ...prev.content, ...data.content } : prev.content,
      newContent: { ...prev.content, ...data.content },
      editionAuthor: data.author.public_name,
      showRefreshWarning: clientToken !== data.client_token,
      rawContentBeforeEdit: data.content.raw_content,
      timeline: addRevisionFromTLM(data, prev.timeline, prev.loggedUser.lang),
      isLastTimelineItemCurrentToken: data.client_token === this.sessionClientToken
    }))
  }

  handleContentCreated = data => {
    const { state } = this
    if (data.content.parent_id !== state.content.content_id || data.content.content_type !== 'comment') return

    const sortedNewTimeline = sortTimelineByDate(
      [
        ...state.timeline,
        {
          ...data.content,
          created: displayDistanceDate(data.content.created, state.loggedUser.lang),
          created_raw: data.content.created,
          timelineType: 'comment'
        }
      ]
    )

    this.setState({
      timeline: sortedNewTimeline,
      isLastTimelineItemCurrentToken: data.client_token === this.sessionClientToken
    })
  }

  handleContentDeletedOrRestore = data => {
    const { state } = this
    if (data.content.content_id !== state.content.content_id) return

    const clientToken = state.config.apiHeader['X-Tracim-ClientToken']
    this.setState(prev => ({
      ...prev,
      content: clientToken === data.client_token ? { ...prev.content, ...data.content } : prev.content,
      newContent: { ...prev.content, ...data.content },
      editionAuthor: data.author.public_name,
      showRefreshWarning: clientToken !== data.client_token,
      timeline: addRevisionFromTLM(data, prev.timeline, state.loggedUser.lang),
      isLastTimelineItemCurrentToken: data.client_token === this.sessionClientToken
    }))
  }

  handleUserModified = data => {
    const newTimeline = this.state.timeline.map(timelineItem => timelineItem.author.user_id === data.user.user_id
      ? { ...timelineItem, author: data.user }
      : timelineItem
    )

    this.setState({ timeline: newTimeline })
  }

  // Custom Event Handlers
  handleShowApp = data => {
    const { props, state } = this
    console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP, data)

    props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), this.buildBreadcrumbs)
    if (data.content.content_id === state.content.content_id) this.setHeadTitle(state.content.label)
  }

  handleHideApp = data => {
    const { props } = this
    console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.HIDE_APP, data)

    props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
    globalThis.tinymce.remove('#wysiwygNewVersion')
  }

  handleReloadContent = data => {
    const { props, state } = this
    console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_CONTENT, data)

    props.appContentCustomEventHandlerReloadContent(data, this.setState.bind(this), state.appName)
    globalThis.tinymce.remove('#wysiwygNewVersion')
  }

  handleAllAppChangeLanguage = data => {
    const { state } = this
    console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)

    initWysiwyg(state, state.loggedUser.lang, this.handleChangeNewComment, this.handleChangeText)
    this.props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, false)
    this.loadContent()
  }

  async componentDidMount () {
    console.log('%c<HtmlDocument> did mount', `color: ${this.state.config.hexcolor}`)

    await this.loadContent()
    this.buildBreadcrumbs()
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    console.log('%c<HtmlDocument> did update', `color: ${state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) {
      await this.loadContent()
      this.buildBreadcrumbs()
      globalThis.tinymce.remove('#wysiwygNewVersion')
      globalThis.wysiwyg('#wysiwygNewVersion', state.loggedUser.lang, this.handleChangeText)
    }

    if (state.mode === APP_FEATURE_MODE.EDIT && prevState.mode !== APP_FEATURE_MODE.EDIT) {
      globalThis.tinymce.remove('#wysiwygNewVersion')
      globalThis.wysiwyg('#wysiwygNewVersion', state.loggedUser.lang, this.handleChangeText)
    }

    if (!prevState.timelineWysiwyg && state.timelineWysiwyg) globalThis.wysiwyg('#wysiwygTimelineComment', state.loggedUser.lang, this.handleChangeNewComment)
    else if (prevState.timelineWysiwyg && !state.timelineWysiwyg) globalThis.tinymce.remove('#wysiwygTimelineComment')

    // INFO - CH - 2019-05-06 - bellow is to properly init wysiwyg editor when reopening the same content
    if (!prevState.isVisible && state.isVisible) {
      initWysiwyg(state, state.loggedUser.lang, this.handleChangeNewComment, this.handleChangeText)
    }
  }

  componentWillUnmount () {
    console.log('%c<HtmlDocument> will Unmount', `color: ${this.state.config.hexcolor}`)
    globalThis.tinymce.remove('#wysiwygNewVersion')
    globalThis.tinymce.remove('#wysiwygTimelineComment')
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

    if (state.config && state.config.system && state.config.system.config && state.config.workspace && state.isVisible) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([contentName, state.config.workspace.label, state.config.system.config.instance_name]) }
      })
    }
  }

  isValidLocalStorageType = type => ['rawContent', 'comment'].includes(type)

  getLocalStorageItem = type => {
    if (!this.isValidLocalStorageType(type)) {
      console.log('error in app htmldoc, wrong getLocalStorage type')
      return
    }

    const { state } = this
    return localStorage.getItem(
      generateLocalStorageContentId(state.content.workspace_id, state.content.content_id, state.appName, type)
    )
  }

  setLocalStorageItem = (type, value) => {
    if (!this.isValidLocalStorageType(type)) {
      console.log('error in app htmldoc, wrong setLocalStorage type')
      return
    }

    const { state } = this
    localStorage.setItem(
      generateLocalStorageContentId(state.content.workspace_id, state.content.content_id, state.appName, type),
      value
    )
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

  loadContent = async () => {
    const { props, state } = this

    const fetchResultHtmlDocument = getHtmlDocContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    const fetchResultComment = getHtmlDocComment(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    const fetchResultRevision = getHtmlDocRevision(state.config.apiUrl, state.content.workspace_id, state.content.content_id)

    const [resHtmlDocument, resComment, resRevision] = await Promise.all([
      handleFetchResult(await fetchResultHtmlDocument),
      handleFetchResult(await fetchResultComment),
      handleFetchResult(await fetchResultRevision)
    ])

    const revisionWithComment = props.buildTimelineFromCommentAndRevision(resComment.body, resRevision.body, state.loggedUser.lang)

    const localStorageComment = localStorage.getItem(
      generateLocalStorageContentId(resHtmlDocument.body.workspace_id, resHtmlDocument.body.content_id, state.appName, 'comment')
    )

    // first time editing the doc, open in edit mode, unless it has been created with webdav or db imported from tracim v1
    // see https://github.com/tracim/tracim/issues/1206
    // @fixme Côme - 2018/12/04 - this might not be a great idea
    const modeToRender = (
      resRevision.body.length === 1 && // if content has only one revision
      state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && // if user has EDIT authorization
      resRevision.body[0].raw_content === '' // has content been created with raw_content (means it's from webdav or import db)
    )
      ? APP_FEATURE_MODE.EDIT
      : APP_FEATURE_MODE.VIEW

    // can't use this.getLocalStorageItem because it uses state that isn't yet initialized
    const localStorageRawContent = localStorage.getItem(
      generateLocalStorageContentId(resHtmlDocument.body.workspace_id, resHtmlDocument.body.content_id, state.appName, 'rawContent')
    )
    const hasLocalStorageRawContent = !!localStorageRawContent

    this.setState({
      mode: modeToRender,
      content: {
        ...resHtmlDocument.body,
        raw_content: modeToRender === APP_FEATURE_MODE.EDIT && hasLocalStorageRawContent
          ? localStorageRawContent
          : resHtmlDocument.body.raw_content
      },
      newComment: localStorageComment || '',
      rawContentBeforeEdit: resHtmlDocument.body.raw_content,
      timeline: revisionWithComment,
      isLastTimelineItemCurrentToken: false
    })

    this.setHeadTitle(resHtmlDocument.body.label)
    await putHtmlDocRead(state.loggedUser, state.config.apiUrl, state.content.workspace_id, state.content.content_id) // mark as read after all requests are finished
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} }) // await above makes sure that we will reload workspace content after the read status update
  }

  loadTimeline = () => {
    // INFO - CH - 2019-01-03 - this function must exists to match app content interface. Although it isn't used here because
    // we need some timeline data to initialize the app in loadContent(). So the timeline generation is handled by loadContent()
    // The data required to initialize is the number of revisions and whether the first revision has raw_content === '' or not
    // this is used to know whether we should open the app in EDIT or VIEW mode. See modeToRender in function loadContent()
    return true
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
  }

  handleClickNewVersion = () => {
    const previouslyUnsavedRawContent = this.getLocalStorageItem('rawContent')

    this.setState(prev => ({
      content: {
        ...prev.content,
        raw_content: previouslyUnsavedRawContent || prev.content.raw_content
      },
      rawContentBeforeEdit: prev.content.raw_content, // for cancel btn
      mode: APP_FEATURE_MODE.EDIT
    }))
  }

  handleCloseNewVersion = () => {
    globalThis.tinymce.remove('#wysiwygNewVersion')

    this.setState(prev => ({
      content: {
        ...prev.content,
        raw_content: prev.rawContentBeforeEdit
      },
      mode: APP_FEATURE_MODE.VIEW
    }))

    const { state } = this
    localStorage.removeItem(
      generateLocalStorageContentId(state.content.workspace_id, state.content.content_id, state.appName, 'rawContent')
    )
  }

  handleSaveHtmlDocument = async () => {
    const { state, props } = this

    const backupLocalStorage = this.getLocalStorageItem('rawContent')

    localStorage.removeItem(
      generateLocalStorageContentId(state.content.workspace_id, state.content.content_id, state.appName, 'rawContent')
    )

    const fetchResultSaveHtmlDoc = await handleFetchResult(
      await putHtmlDocContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id, state.content.label, state.content.raw_content)
    )

    switch (fetchResultSaveHtmlDoc.apiResponse.status) {
      case 200:
        globalThis.tinymce.remove('#wysiwygNewVersion')
        this.setState({ mode: APP_FEATURE_MODE.VIEW })
        break
      case 400:
        this.setLocalStorageItem('rawContent', backupLocalStorage)
        switch (fetchResultSaveHtmlDoc.body.code) {
          case 2044:
            this.sendGlobalFlashMessage(props.t('You must change the status or restore this document before any change'))
            break
          default:
            this.sendGlobalFlashMessage(props.t('Error while saving new version'))
            break
        }
        break
      default:
        this.setLocalStorageItem('rawContent', backupLocalStorage)
        this.sendGlobalFlashMessage(props.t('Error while saving new version'))
        break
    }
  }

  handleChangeText = e => {
    const newText = e.target.value // because SyntheticEvent is pooled (react specificity)
    this.setState(prev => ({ content: { ...prev.content, raw_content: newText } }))

    this.setLocalStorageItem('rawContent', newText)
  }

  handleChangeNewComment = e => {
    const { props, state } = this
    props.appContentChangeComment(e, state.content, this.setState.bind(this), state.appName)
  }

  searchMentionList = async (query) => {
    const { props, state } = this

    if (query.length < 2) return

    const fetchUserKnownMemberList = await handleFetchResult(await getMyselfKnownMember(state.config.apiUrl, query, []))

    switch (fetchUserKnownMemberList.apiResponse.status) {
      case 200: return fetchUserKnownMemberList.body.map(m => ({ mention: m.username, detail: m.public_name, ...m }))
      default: this.sendGlobalFlashMessage(`${props.t('An error has happened while getting')} ${props.t('known members list')}`, 'warning'); break
    }
    return []
  }

  handleClickValidateNewCommentBtn = async () => {
    const { props, state } = this
    props.appContentSaveNewComment(state.content, state.timelineWysiwyg, state.newComment, this.setState.bind(this), state.config.slug)
  }

  handleToggleWysiwyg = () => this.setState(prev => ({ timelineWysiwyg: !prev.timelineWysiwyg }))

  handleSaveEditTitle = async newTitle => {
    const { props, state } = this
    props.appContentChangeTitle(state.content, newTitle, state.config.slug)
  }

  handleChangeStatus = async newStatus => {
    const { props, state } = this
    props.appContentChangeStatus(state.content, newStatus, state.config.slug)
  }

  handleClickDelete = async () => {
    const { props, state } = this
    props.appContentDelete(state.content, this.setState.bind(this), state.config.slug)
  }

  handleClickRestoreDelete = async () => {
    const { props, state } = this
    props.appContentRestoreDelete(state.content, this.setState.bind(this), state.config.slug)
  }

  // INFO - G.B. - 2020-05-20 - For now, we decide to hide the archive function - https://github.com/tracim/tracim/issues/2347
  // handleClickArchive = async () => {
  //   const { props, state } = this
  //   props.appContentArchive(state.content, this.setState.bind(this), state.config.slug)
  // }
  // handleClickRestoreArchive = async () => {
  //   const { props, state } = this
  //   props.appContentRestoreArchive(state.content, this.setState.bind(this), state.config.slug)
  // }

  handleClickShowRevision = revision => {
    const { state } = this

    const revisionArray = state.timeline.filter(t => t.timelineType === 'revision')
    const isLastRevision = revision.revision_id === revisionArray[revisionArray.length - 1].revision_id

    if (state.mode === APP_FEATURE_MODE.REVISION && isLastRevision) {
      this.handleClickLastVersion()
      return
    }

    if (state.mode === APP_FEATURE_MODE.VIEW && isLastRevision) return

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
      mode: APP_FEATURE_MODE.REVISION
    }))
  }

  handleClickLastVersion = () => {
    this.loadContent()
    this.setState({ mode: APP_FEATURE_MODE.VIEW })
  }

  handleClickRefresh = () => {
    globalThis.tinymce.remove('#wysiwygNewVersion')

    this.setState(prev => ({
      content: {
        ...prev.content,
        ...prev.newContent,
        raw_content: prev.rawContentBeforeEdit
      },
      mode: APP_FEATURE_MODE.VIEW,
      showRefreshWarning: false
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
          rawTitle={state.content.label}
          componentTitle={<div>{state.content.label}</div>}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
          disableChangeTitle={!state.content.is_editable}
        />

        <PopinFixedOption
          customColor={state.config.hexcolor}
          customClass={`${state.config.slug}`}
          i18n={i18n}
        >
          <div> {/* this div in display flex, justify-content space-between */}
            <div className='d-flex'>
              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && (
                <NewVersionBtn
                  customColor={state.config.hexcolor}
                  onClickNewVersionBtn={this.handleClickNewVersion}
                  disabled={state.mode !== APP_FEATURE_MODE.VIEW || !state.content.is_editable}
                  label={props.t('Edit')}
                  icon='plus-circle'
                />
              )}

              {state.mode === APP_FEATURE_MODE.REVISION && (
                <button
                  className='wsContentGeneric__option__menu__lastversion html-document__lastversionbtn btn highlightBtn'
                  onClick={this.handleClickLastVersion}
                  style={{ backgroundColor: state.config.hexcolor, color: '#fdfdfd' }}
                >
                  <i className='fa fa-history' />
                  {props.t('Last version')}
                </button>
              )}
            </div>

            <div className='d-flex'>
              {state.showRefreshWarning && (
                <RefreshWarningMessage
                  tooltip={props.t('The content has been modified by {{author}}', { author: state.editionAuthor, interpolation: { escapeValue: false } })}
                  onClickRefresh={this.handleClickRefresh}
                />
              )}

              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && (
                <SelectStatus
                  selectedStatus={state.config.availableStatuses.find(s => s.slug === state.content.status)}
                  availableStatus={state.config.availableStatuses}
                  onChangeStatus={this.handleChangeStatus}
                  disabled={state.mode === APP_FEATURE_MODE.REVISION || state.content.is_archived || state.content.is_deleted}
                />
              )}

              {state.loggedUser.userRoleIdInWorkspace >= ROLE.contentManager.id && (
                <ArchiveDeleteContent
                  customColor={state.config.hexcolor}
                  onClickArchiveBtn={this.handleClickArchive}
                  onClickDeleteBtn={this.handleClickDelete}
                  disabled={state.mode === APP_FEATURE_MODE.REVISION || state.content.is_archived || state.content.is_deleted}
                />
              )}
            </div>
          </div>
        </PopinFixedOption>

        <PopinFixedContent
          customClass={state.mode === APP_FEATURE_MODE.EDIT ? `${state.config.slug}__contentpage__edition` : `${state.config.slug}__contentpage`}
        >
          {/*
            FIXME - GB - 2019-06-05 - we need to have a better way to check the state.config than using state.config.availableStatuses[3].slug
            https://github.com/tracim/tracim/issues/1840
          */}
          <HtmlDocumentComponent
            mode={state.mode}
            customColor={state.config.hexcolor}
            wysiwygNewVersion='wysiwygNewVersion'
            onClickCloseEditMode={this.handleCloseNewVersion}
            disableValidateBtn={state.rawContentBeforeEdit === state.content.raw_content}
            onClickValidateBtn={this.handleSaveHtmlDocument}
            version={state.content.number}
            lastVersion={state.timeline.filter(t => t.timelineType === 'revision').length}
            text={state.content.raw_content}
            onChangeText={this.handleChangeText}
            isArchived={state.content.is_archived}
            isDeleted={state.content.is_deleted}
            isDeprecated={state.content.status === state.config.availableStatuses[3].slug}
            deprecatedStatus={state.config.availableStatuses[3]}
            isDraftAvailable={state.mode === APP_FEATURE_MODE.VIEW && state.loggedUser.userRoleIdInWorkspace >= ROLE.contributor.id && this.getLocalStorageItem('rawContent')}
            onClickRestoreArchived={this.handleClickRestoreArchive}
            onClickRestoreDeleted={this.handleClickRestoreDelete}
            onClickShowDraft={this.handleClickNewVersion}
            searchMentionList={this.searchMentionList}
            key='html-document'
          />

          <PopinFixedRightPart
            customClass={`${state.config.slug}__contentpage`}
            customColor={state.config.hexcolor}
            menuItemList={[{
              id: 'timeline',
              label: props.t('Timeline'),
              icon: 'fa-history',
              children: (
                <Timeline
                  customClass={`${state.config.slug}__contentpage`}
                  customColor={state.config.hexcolor}
                  loggedUser={state.loggedUser}
                  timelineData={state.timeline}
                  newComment={state.newComment}
                  disableComment={state.mode === APP_FEATURE_MODE.REVISION || state.mode === APP_FEATURE_MODE.EDIT || !state.content.is_editable}
                  availableStatusList={state.config.availableStatuses}
                  wysiwyg={state.timelineWysiwyg}
                  onChangeNewComment={this.handleChangeNewComment}
                  onClickValidateNewCommentBtn={this.handleClickValidateNewCommentBtn}
                  onClickWysiwygBtn={this.handleToggleWysiwyg}
                  onClickRevisionBtn={this.handleClickShowRevision}
                  shouldScrollToBottom={state.mode !== APP_FEATURE_MODE.REVISION}
                  isLastTimelineItemCurrentToken={state.isLastTimelineItemCurrentToken}
                  searchMentionList={this.searchMentionList}
                />
              )
            }]}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(Radium(appContentFactory(TracimComponent(HtmlDocument))))
