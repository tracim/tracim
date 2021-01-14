import React from 'react'
import CustomFormComponent from '../component/CustomFormComponent.jsx'
import { translate } from 'react-i18next'
import i18n from '../i18n.js'
import {
  buildContentPathBreadcrumbs,
  handleFetchResult,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedOption,
  PopinFixedContent,
  Timeline,
  NewVersionBtn,
  ArchiveDeleteContent,
  SelectStatus,
  displayDistanceDate,
  convertBackslashNToBr,
  LOCAL_STORAGE_FIELD,
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
  BREADCRUMBS_TYPE,
  appFeatureCustomEventHandlerShowApp,
  getContentComment,
  PAGE
} from 'tracim_frontend_lib'
import {
  MODE,
  debug,
  initWysiwyg
} from '../helper.js'
import {
  getCustomFormContent,
  getCustomFormRevision,
  postCustomFormNewComment,
  putCustomFormContent,
  putCustomFormStatus,
  putCustomFormIsArchived,
  putCustomFormIsDeleted,
  putCustomFormRestoreArchived,
  putCustomFormRestoreDeleted,
  putCustomFormRead
} from '../action.async.js'
import Radium from 'radium'

class CustomForm extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'custom-form',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      // config: debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      // content: debug.content,
      externalTranslationList: [
        props.t('Form generator'),
        props.t('Form generator'),
        props.t('Form generator'),
        props.t('Form generator'),
        props.t('Form generator'),
        props.t('Generate a Form')
      ],
      rawContentBeforeEdit: '',
      timeline: props.data ? [] : [], // debug.timeline,
      newComment: '',
      timelineWysiwyg: false,
      mode: MODE.VIEW,
      key: props.data ? props.data.content ? props.data.content.content_id : undefined : undefined,
      // schema: this.props.data ? this.props.data.config ? this.props.data.config.schema : {} : {},
      // uiSchema: this.props.data ? this.props.data.config ? this.props.data.config.uischema : {} : {},
      schema: {},
      uiSchema: {},
      hexcolor: '#ffffff',
      faIcon: 'comments-o'
    }
    // i18n has been init, add resources from frontend
    // Error here
    console.log('996', i18n, this.state.config.translation, this.state.loggedUser.lang)
    // addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang) // HACK
    i18n.changeLanguage(this.state.loggedUser.lang)
    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => { // action: { type: '', data: {} }
    const { state, props } = this
    switch (type) {
      case 'custom-form_showApp':
        console.log('%c<CustomForm> Custom event', 'color: #28a745', type, data)
        if (appFeatureCustomEventHandlerShowApp(data.content, state.content.content_id, 'custom-form')) { // HACK HARCODING 'CUSTOM-FORM'
          this.setState({ isVisible: true })
          buildContentPathBreadcrumbs(state.config.apiUrl, state.content, props)
        }
        break

      case 'custom-form_hideApp':
        console.log('%c<CustomForm> Custom event', 'color: #28a745', type, data)
        tinymce.remove('#wysiwygTimelineComment')
        // tinymce.remove('#wysiwygNewVersion')
        this.setState({
          isVisible: false,
          timelineWysiwyg: false
        })
        break

      case 'custom-form_reloadContent':
        console.log('%c<CustomForm> Custom event', 'color: #28a745', type, data)
        tinymce.remove('#wysiwygTimelineComment')
        // tinymce.remove('#wysiwygNewVersion')

        this.setState(prev => ({
          // content: {...prev.content, ...data}, // GM
          content: { ...data },
          isVisible: true,
          timelineWysiwyg: false
        }))
        break

      case 'allApp_changeLang':
        console.log('%c<CustomForm> Custom event', 'color: #28a745', type, data)

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
    // console.log('%c<CustomForm> did mount', `color: ${this.state.config.hexcolor}`)
    await this.loadContent()
    buildContentPathBreadcrumbs(this.state.config.apiUrl, this.state.content, this.props)
  }

  async componentDidUpdate (prevProps, prevState) {
    const { state } = this

    // console.log('%c<CustomForm> did update', `color: ${state.config.hexcolor}`, prevState, state)

    if (!prevState.content || !state.content) return

    if (prevState.content.content_id !== state.content.content_id) {
      await this.loadContent()
      buildContentPathBreadcrumbs(state.config.apiUrl, state.content, props)
      // tinymce.remove('#wysiwygNewVersion')
      wysiwyg('#wysiwygNewVersion', state.loggedUser.lang, this.handleChangeText)
    }

    if (state.mode === MODE.EDIT && prevState.mode !== MODE.EDIT) {
      // tinymce.remove('#wysiwygNewVersion')
      wysiwyg('#wysiwygNewVersion', state.loggedUser.lang, this.handleChangeText)
    }

    if (!prevState.timelineWysiwyg && state.timelineWysiwyg) wysiwyg('#wysiwygTimelineComment', state.loggedUser.lang, this.handleChangeNewComment)
    else if (prevState.timelineWysiwyg && !state.timelineWysiwyg) tinymce.remove('#wysiwygTimelineComment')

    // INFO - CH - 2019-05-06 - bellow is to properly init wysiwyg editor when reopening the same content
    if (!prevState.isVisible && state.isVisible) {
      initWysiwyg(state, state.loggedUser.lang, this.handleChangeNewComment, this.handleChangeText)
    }
  }

  componentWillUnmount () {
    console.log('%c<CustomForm> will Unmount', `color: ${this.state.config.hexcolor}`)
    // tinymce.remove('#wysiwygNewVersion')
    tinymce.remove('#wysiwygTimelineComment')
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

  buildBreadcrumbs = () => {
    const { state } = this

    GLOBAL_dispatchEvent({
      type: 'appendBreadcrumbs',
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
    const { loggedUser, content, config, appName } = this.state

    const fetchResultCustomForm = getCustomFormContent(config.apiUrl, content.workspace_id, content.content_id)
    const fetchResultComment = getContentComment(config.apiUrl, content.workspace_id, content.content_id)
    const fetchResultRevision = getCustomFormRevision(config.apiUrl, content.workspace_id, content.content_id)

    const [resCustomForm, resComment, resRevision] = await Promise.all([
      handleFetchResult(await fetchResultCustomForm),
      handleFetchResult(await fetchResultComment),
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

    const localStorageComment = getLocalStorageItem(appName, resCustomForm.body, LOCAL_STORAGE_FIELD.COMMENT)

    // first time editing the doc, open in edit mode, unless it has been created with webdav or db imported from tracim v1
    // see https://github.com/tracim/tracim/issues/1206
    // @fixme Côme - 2018/12/04 - this might not be a great idea

    const modeToRender = (
      resRevision.body.length === 2 && // if content has only one revision HACK
      // resRevision.body.length === 1 && // if content has only one revision
      loggedUser.idRoleUserWorkspace >= 2 // && // if user has EDIT authorization
      // resRevision.body[0].raw_content === '' // has content been created with raw_content (means it's from webdav or import db)
    )
      ? MODE.EDIT
      : MODE.VIEW

    const localStorageRawContent = getLocalStorageItem(
      appName,
      resCustomForm.body,
      LOCAL_STORAGE_FIELD.RAW_CONTENT
    )

    // HACK
    // const hasLocalStorageRawContent = !!localStorageRawContent
    const hasLocalStorageRawContent = false
    const rawContent = JSON.parse(resCustomForm.body.raw_content)

    this.setState({
      mode: modeToRender,
      content: {
        ...resCustomForm.body,
        raw_content: modeToRender === MODE.EDIT && hasLocalStorageRawContent
          ? localStorageRawContent
          : rawContent.formData
      },
      schema: rawContent.schema,
      uiSchema: rawContent.uischema,
      newComment: localStorageComment || '',
      rawContentBeforeEdit: rawContent.formData,
      timeline: revisionWithComment,
      hexcolor: rawContent.hexcolor,
      faIcon: rawContent.faIcon
    })
    await putCustomFormRead(loggedUser, config.apiUrl, content.workspace_id, content.content_id) // mark as read after all requests are finished
    GLOBAL_dispatchEvent({ type: 'refreshContentList', data: {} }) // await above makes sure that we will reload workspace content after the read status update
  }

  handleClickBtnCloseApp = () => {
    this.setState(prev => ({
      isVisible: false,
      mode: MODE.VIEW,
      content: {
        ...prev.content,
        raw_content: prev.rawContentBeforeEdit
      }
    }))
    GLOBAL_dispatchEvent({ type: 'appClosed', data: {} })
  }

  handleSaveEditTitle = async newTitle => {
    const { props, state } = this
    const rawContent = {
      hexcolor: state.hexcolor,
      faIcon: state.faIcon,
      schema: state.schema,
      uischema: state.uiSchema,
      // formData: data.formData
      formData: state.content.raw_content
    }
    const fetchResultSaveCustomForm = await handleFetchResult(
      await putCustomFormContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id, newTitle, JSON.stringify(rawContent))
    )

    switch (fetchResultSaveCustomForm.apiResponse.status) {
      case 200:
        this.loadContent()
        GLOBAL_dispatchEvent({ type: 'refreshContentList', data: {} })
        break
      case 400:
        switch (fetchResultSaveCustomForm.body.code) {
          case 2041: break // INFO - CH - 2019-04-04 - this means the same title has been sent. Therefore, no modification
          case 3002: this.sendGlobalFlashMessage(props.t('A content with same name already exists')); break
          default: this.sendGlobalFlashMessage(props.t('Error while saving new title')); break
        }
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new title')); break
    }
  }

  handleClickNewVersion = () => {
    const previouslyUnsavedRawContent = getLocalStorageItem(this.state.appName, this.state.content, LOCAL_STORAGE_FIELD.RAW_CONTENT)
    this.setState(prev => ({
      content: {
        ...prev.content,
        raw_content: previouslyUnsavedRawContent || prev.content.raw_content
      },
      rawContentBeforeEdit: prev.content.raw_content, // for cancel btn
      mode: MODE.EDIT
    }))
  }

  handleCloseNewVersion = () => {
    // tinymce.remove('#wysiwygNewVersion')
    this.setState(prev => ({
      content: {
        ...prev.content,
        raw_content: prev.rawContentBeforeEdit
      },
      mode: MODE.VIEW
    }))

    const { appName, content } = this.state
    removeLocalStorageItem(appName, content, LOCAL_STORAGE_FIELD.RAW_CONTENT)
  }

  handleSubmit = (data) => {
    const rawContent = {
      hexcolor: this.state.hexcolor,
      faIcon: this.state.faIcon,
      schema: this.state.schema,
      uischema: this.state.uiSchema,
      // formData: data.formData
      formData: data.formData
    }
    this.handleSaveCustomForm(JSON.stringify(rawContent))
  };

  handleSaveCustomForm = async (data) => {
    const { state, props } = this
    const fetchResultSaveCustomForm = await handleFetchResult(
      // HACK
      await putCustomFormContent(state.config.apiUrl, state.content.workspace_id, state.content.content_id, state.content.label, data)
    )

    switch (fetchResultSaveCustomForm.apiResponse.status) {
      case 200:
        // HACK
        removeLocalStorageItem('html-document', state.content, LOCAL_STORAGE_FIELD.RAW_CONTENT)

        // this.handleCloseNewVersion() // HACK
        this.loadContent()
        break
      default:
        this.sendGlobalFlashMessage(props.t('Error while saving new version')); break
    }
  }

  handleChangeForm = e => {
    // const newText = JSON.stringify(e.formData) // because SyntheticEvent is pooled (react specificity)
    this.setState(prev => ({ content: { ...prev.content, raw_content: e.formData } }))
    // setLocalStorageItem(this.state.appName, this.state.content, LOCAL_STORAGE_FIELD.RAW_CONTENT, e.formData)
  }

  handleChangeNewComment = e => {
    const newComment = e.target.value
    this.setState({ newComment })

    setLocalStorageItem(this.state.appName, this.state.content, LOCAL_STORAGE_FIELD.COMMENT, newComment)
  }

  handleClickValidateNewCommentBtn = async () => {
    const { props, state } = this

    // @FIXME - Côme - 2018/10/31 - line bellow is a hack to force send html to api
    // see https://github.com/tracim/tracim/issues/1101
    const newCommentForApi = state.timelineWysiwyg
      ? state.newComment
      : `<p>${convertBackslashNToBr(state.newComment)}</p>`

    const fetchResultSaveNewComment = await handleFetchResult(await postCustomFormNewComment(state.config.apiUrl, state.content.workspace_id, state.content.content_id, newCommentForApi))
    switch (fetchResultSaveNewComment.apiResponse.status) {
      case 200:
        this.setState({ newComment: '' })
        removeLocalStorageItem(state.appName, state.content, LOCAL_STORAGE_FIELD.COMMENT)
        if (state.timelineWysiwyg) tinymce.get('wysiwygTimelineComment').setContent('')
        this.loadContent()
        break
      default: this.sendGlobalFlashMessage(props.t('Error while saving new comment')); break
    }
  }

  handleToggleWysiwyg = () => this.setState(prev => ({ timelineWysiwyg: !prev.timelineWysiwyg }))

  handleChangeStatus = async newStatus => {
    const { state, props } = this

    if (newStatus === state.content.status) return

    const fetchResultSaveEditStatus = await handleFetchResult(
      await putCustomFormStatus(state.config.apiUrl, state.content.workspace_id, state.content.content_id, newStatus)
    )

    switch (fetchResultSaveEditStatus.status) {
      case 204: this.loadContent(); break
      default: this.sendGlobalFlashMessage(props.t('Error while changing status'))
    }
  }

  handleClickArchive = async () => {
    const { config, content } = this.state

    const fetchResultArchive = await putCustomFormIsArchived(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204:
        this.setState(prev => ({ content: { ...prev.content, is_archived: true }, mode: MODE.VIEW }))
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

    const fetchResultArchive = await putCustomFormIsDeleted(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultArchive.status) {
      case 204:
        this.setState(prev => ({ content: { ...prev.content, is_deleted: true }, mode: MODE.VIEW }))
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

    const fetchResultRestore = await putCustomFormRestoreArchived(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultRestore.status) {
      case 204:
        this.setState(prev => ({ content: { ...prev.content, is_archived: false } }))
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

    const fetchResultRestore = await putCustomFormRestoreDeleted(config.apiUrl, content.workspace_id, content.content_id)
    switch (fetchResultRestore.status) {
      case 204:
        this.setState(prev => ({ content: { ...prev.content, is_deleted: false } }))
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
    const rawContent = revision.raw_content ? JSON.parse(revision.raw_content) : {}
    this.setState(prev => ({
      content: {
        ...prev.content,
        label: revision.label,
        raw_content: rawContent.formData,
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
    this.setState({ mode: MODE.VIEW })
  }

  render () {
    const { isVisible, loggedUser, content, timeline, newComment, timelineWysiwyg, config, mode, schema, uiSchema, rawContentBeforeEdit } = this.state
    const { t } = this.props
    const contextForm = {
      apiUrl: config.apiUrl,
      workspaceId: content.workspace_id
    }
    if (!isVisible) return null
    // console.log('COMPARE0', rawContentBeforeEdit, content.raw_content, rawContentBeforeEdit === content.raw_content)
    return (
      <PopinFixed
        customClass={`${config.slug}`}
        customColor={this.state.hexcolor}
      >
        <PopinFixedHeader
          customClass={`${config.slug}`}
          customColor={this.state.hexcolor}
          faIcon={this.state.faIcon}
          rawTitle={content.label}
          componentTitle={<div>{content.label}</div>}
          userRoleIdInWorkspace={loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          onValidateChangeTitle={this.handleSaveEditTitle}
          disableChangeTitle={!content.is_editable}
        />

        <PopinFixedOption
          customColor={this.state.hexcolor}
          customClass={`${config.slug}`}
          i18n={i18n}
        >
          <div/* this div in display flex, justify-content space-between */>
            <div className='d-flex'>
              {loggedUser.userRoleIdInWorkspace >= 2 && (
                <NewVersionBtn
                  customColor={this.state.hexcolor}
                  onClickNewVersionBtn={this.handleClickNewVersion}
                  disabled={mode !== MODE.VIEW || !content.is_editable}
                  label={t('Edit')}
                />
              )}

              {mode === MODE.REVISION && (
                <button
                  className='wsContentGeneric__option__menu__lastversion custom-form__lastversionbtn btn highlightBtn'
                  onClick={this.handleClickLastVersion}
                  style={{ backgroundColor: this.state.hexcolor, color: '#fdfdfd' }}
                >
                  <i className='fa fa-history' />
                  {t('Last version')}
                </button>
              )}
            </div>

            <div className='d-flex'>
              {loggedUser.userRoleIdInWorkspace >= 2 && (
                <SelectStatus
                  selectedStatus={config.availableStatuses.find(s => s.slug === content.status)}
                  availableStatus={config.availableStatuses}
                  onChangeStatus={this.handleChangeStatus}
                  disabled={mode === MODE.REVISION || content.is_archived || content.is_deleted}
                />
              )}

              {loggedUser.userRoleIdInWorkspace >= 4 && (
                <ArchiveDeleteContent
                  customColor={this.state.hexcolor}
                  onClickArchiveBtn={this.handleClickArchive}
                  onClickDeleteBtn={this.handleClickDelete}
                  disabled={mode === MODE.REVISION || content.is_archived || content.is_deleted}
                />
              )}
            </div>
          </div>
        </PopinFixedOption>

        <PopinFixedContent
          customClass={`${config.slug}__contentpage`}
        >
          {schema && (
            <CustomFormComponent
              mode={mode}
              customColor={this.state.hexcolor}
              onClickCloseEditMode={this.handleCloseNewVersion}
              disableValidateBtn={JSON.stringify(rawContentBeforeEdit) === JSON.stringify(content.raw_content)}
              onClickValidateBtn={this.handleSubmit}
              version={content.number}
              lastVersion={timeline.filter(t => t.timelineType === 'revision').length}
              text={content.raw_content}
              isArchived={content.is_archived}
              isDeleted={content.is_deleted}
              isDeprecated={content.status === config.availableStatuses[3].slug}
              deprecatedStatus={config.availableStatuses[3]}
              isDraftAvailable={mode === MODE.VIEW && loggedUser.idRoleUserWorkspace >= 2 && getLocalStorageItem(this.state.appName, content, LOCAL_STORAGE_FIELD.RAW_CONTENT)}
              onClickRestoreArchived={this.handleClickRestoreArchived}
              onClickRestoreDeleted={this.handleClickRestoreDeleted}
              onClickShowDraft={this.handleClickNewVersion}
              key={this.state.key}
              schema={schema}
              uischema={uiSchema}
              formdata={content.raw_content}
              onChangeForm={this.handleChangeForm}
              contextForm={contextForm}
            />
          )}

          <Timeline
            customClass={`${config.slug}__contentpage`}
            customColor={this.state.hexcolor}
            loggedUser={loggedUser}
            timelineData={timeline}
            showHeader
            newComment={newComment}
            disableComment={mode === MODE.REVISION || mode === MODE.EDIT || !content.is_editable}
            availableStatusList={config.availableStatuses}
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

export default translate()(Radium(CustomForm))
