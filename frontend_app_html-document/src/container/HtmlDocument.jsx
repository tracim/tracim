import React from 'react'
import HtmlDocumentComponent from '../component/HtmlDocument.jsx'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  appContentFactory,
  addAllResourceI18n,
  handleFetchResult,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  PopinFixedRightPart,
  Timeline,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  TLM_ENTITY_TYPE as TLM_ET,
  TracimComponent,
  NewVersionBtn,
  ArchiveDeleteContent,
  SelectStatus,
  generateLocalStorageContentId,
  BREADCRUMBS_TYPE,
  ROLE,
  CUSTOM_EVENT,
  APP_FEATURE_MODE,
  buildHeadTitle
} from 'tracim_frontend_lib'
import { initWysiwyg } from '../helper.js'
import { debug } from '../debug.js'
import {
  getHtmlDocContent,
  getHtmlDocComment,
  getHtmlDocRevision,
  putHtmlDocContent,
  putHtmlDocRead
} from '../action.async.js'
import Radium from 'radium'

class HtmlDocument extends React.Component {
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
      timelineWysiwyg: false,
      mode: APP_FEATURE_MODE.VIEW
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)

    // props.registerCustomEventHandlerList([
    //   { name: CUSTOM_EVENT.SHOW_APP, handler: this.handleShowApp },
    //   { name: CUSTOM_EVENT.HIDE_APP, handler: this.handleHideApp },
    //   { name: CUSTOM_EVENT.RELOAD_CONTENT, handler: this.handleReloadContent },
    //   { name: CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA, handler: this.handleReloadAppFeatureData },
    //   { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    // ])

    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.MODIFIED, handler: this.handleHtmlDocumentModified },
      { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.CREATED, handler: this.handleHtmlDocumentCreated }
      // { entityType: TLM_ET.CONTENT, coreEntityType: TLM_CET.DELETED, handler: this.handleHtmlDocumentDeleted }
    ])
  }

  // TLM Handlers
  handleHtmlDocumentModified = data => {
    const { state } = this
    if (data.content.content_id !== state.content.content_id) return

    globalThis.tinymce.remove('#wysiwygNewVersion')

    localStorage.removeItem(
      generateLocalStorageContentId(state.content.workspace_id, state.content.content_id, state.appName, 'rawContent')
    )

    const localStorageComment = localStorage.getItem(
      generateLocalStorageContentId(data.workspace_id, data.content_id, state.appName, 'comment')
    )

    this.setState(prev => ({
      ...prev,
      mode: APP_FEATURE_MODE.VIEW,
      content: {
        ...prev.content,
        ...data.content,
        raw_content: prev.content.raw_content
        // raw_content: data.raw_content // TODO
      },
      newComment: localStorageComment || '',
      rawContentBeforeEdit: prev.content.raw_content
    }))

    this.loadTimeline()
  }

  handleHtmlDocumentCreated = data => {
    const { state } = this
    if (data.content.content_id !== state.content.content_id) return

    if (data.content.content_type === 'comment') {
      this.setState(prev => ({
        timeline: [...prev.timeline, data.content]
      }))
    }
  }

  // Custom Event Handlers
  // handleShowApp = data => {
  //   const { props, state } = this
  //   console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP, data)

  //   props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), this.buildBreadcrumbs)
  //   if (data.content.content_id === state.content.content_id) this.setHeadTitle(state.content.label)
  // }

  // handleHideApp = data => {
  //   const { props } = this
  //   console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.HIDE_APP, data)

  //   props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
  //   globalThis.tinymce.remove('#wysiwygNewVersion')
  // }

  // handleReloadContent = data => {
  //   const { props, state } = this
  //   console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_CONTENT, data)

  //   props.appContentCustomEventHandlerReloadContent(data, this.setState.bind(this), state.appName)
  //   globalThis.tinymce.remove('#wysiwygNewVersion')
  // }

  // handleReloadAppFeatureData = data => {
  //   const { props } = this
  //   console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA, data)

  //   props.appContentCustomEventHandlerReloadAppFeatureData(this.loadContent, this.loadTimeline, this.buildBreadcrumbs)
  // }

  // handleAllAppChangeLanguage = data => {
  //   const { state } = this
  //   console.log('%c<HtmlDocument> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)

  //   initWysiwyg(state, state.loggedUser.lang, this.handleChangeNewComment, this.handleChangeText)

  //   this.setState(prev => ({
  //     loggedUser: {
  //       ...prev.loggedUser,
  //       lang: data
  //     }
  //   }))
  //   i18n.changeLanguage(data)
  //   this.loadContent()
  // }

  customEventReducer = ({ detail: { type, data } }) => {
    const { props, state } = this
    switch (type) {
      case CUSTOM_EVENT.SHOW_APP(state.config.slug):
        console.log('%c<HtmlDocument> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), this.buildBreadcrumbs)
        if (data.content.content_id === state.content.content_id) this.setHeadTitle(state.content.label)
        break

      case CUSTOM_EVENT.HIDE_APP(state.config.slug):
        console.log('%c<HtmlDocument> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
        globalThis.tinymce.remove('#wysiwygNewVersion')
        break

      case CUSTOM_EVENT.RELOAD_CONTENT(state.config.slug):
        console.log('%c<HtmlDocument> Custom event', 'color: #28a745', type, data)
        props.appContentCustomEventHandlerReloadContent(data, this.setState.bind(this), state.appName)
        globalThis.tinymce.remove('#wysiwygNewVersion')
        break

      case CUSTOM_EVENT.RELOAD_APP_FEATURE_DATA(state.config.slug):
        props.appContentCustomEventHandlerReloadAppFeatureData(this.loadContent, this.loadTimeline, this.buildBreadcrumbs)
        break

      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<HtmlDocument> Custom event', 'color: #28a745', type, data)

        initWysiwyg(state, state.loggedUser.lang, this.handleChangeNewComment, this.handleChangeText)

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
      timeline: revisionWithComment
    })

    this.setHeadTitle(resHtmlDocument.body.label)
    await putHtmlDocRead(state.loggedUser, state.config.apiUrl, state.content.workspace_id, state.content.content_id) // mark as read after all requests are finished
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} }) // await above makes sure that we will reload workspace content after the read status update
  }

  loadTimeline = async () => {
    const { props, state } = this

    const fetchResultComment = getHtmlDocComment(state.config.apiUrl, state.content.workspace_id, state.content.content_id)
    const fetchResultRevision = getHtmlDocRevision(state.config.apiUrl, state.content.workspace_id, state.content.content_id)

    const [resComment, resRevision] = await Promise.all([
      handleFetchResult(await fetchResultComment),
      handleFetchResult(await fetchResultRevision)
    ])
    if (resComment.apiResponse.status !== 200 && resRevision.apiResponse.status !== 200) {
      this.sendGlobalFlashMessage(props.t('Error while loading timeline'))
      console.log('Error loading timeline', 'comments', resComment, 'revisions', resRevision)
      return
    }
    const revisionWithComment = props.buildTimelineFromCommentAndRevision(resComment.body, resRevision.body, state.loggedUser.lang)
    this.setState({ timeline: revisionWithComment })
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

    if (fetchResultSaveHtmlDoc.apiResponse.status !== 200) {
      this.setLocalStorageItem('rawContent', backupLocalStorage)
      this.sendGlobalFlashMessage(props.t('Error while saving new version'))
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
