import React from 'react'
import UploadFilesManagement from '../component/UploadFilesManagement.jsx'
import NewUpload from '../component/NewUpload.jsx'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  appContentFactory,
  PopinFixed,
  PopinFixedHeader,
  PopinFixedContent,
  addAllResourceI18n,
  handleFetchResult,
  getContentTypeList,
  sendGlobalFlashMessage,
  CUSTOM_EVENT,
  checkEmailValidity,
  parserStringToList,
  buildHeadTitle,
  TracimComponent
} from 'tracim_frontend_lib'
import { debug } from '../debug.js'
import {
  getImportAuthorizationsList,
  deleteImportAuthorization,
  postImportAuthorizationsList
} from '../action.async.js'

export class ShareFolderAdvanced extends React.Component {
  constructor (props) {
    super(props)

    this.UPLOAD_STATUS = {
      UPLOAD_MANAGEMENT: 'management',
      NEW_UPLOAD: 'newUpload'
    }

    const param = props.data || debug
    props.setApiUrl(param.config.apiUrl)

    this.state = {
      appName: 'share_folder',
      isVisible: true,
      config: param.config,
      loggedUser: param.loggedUser,
      content: param.content,
      externalTranslationList: [
        props.t('Received files')
      ],
      tracimContentTypeList: [],
      currentPageStatus: this.UPLOAD_STATUS.UPLOAD_MANAGEMENT,
      uploadLinkList: [],
      uploadEmails: '',
      uploadPassword: ''
    }

    // i18n has been init, add resources from frontend
    addAllResourceI18n(i18n, this.state.config.translation, this.state.loggedUser.lang)
    i18n.changeLanguage(this.state.loggedUser.lang)

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.SHOW_APP(this.state.config.slug), handler: this.handleShowApp },
      { name: CUSTOM_EVENT.HIDE_APP(this.state.config.slug), handler: this.handleHideApp },
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  // Custom Event Handlers
  handleShowApp = data => {
    const { props, state } = this
    console.log('%c<ShareFolderAdvanced> Custom event', 'color: #28a745', CUSTOM_EVENT.SHOW_APP(state.config.slug), data)

    props.appContentCustomEventHandlerShowApp(data.content, state.content, this.setState.bind(this), () => {})
    this.setHeadTitle()
  }

  handleHideApp = data => {
    const { props, state } = this
    console.log('%c<ShareFolderAdvanced> Custom event', 'color: #28a745', CUSTOM_EVENT.HIDE_APP(state.config.slug), data)

    props.appContentCustomEventHandlerHideApp(this.setState.bind(this))
  }

  handleAllAppChangeLanguage = data => {
    const { props } = this
    console.log('%c<ShareFolderAdvanced> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)

    props.appContentCustomEventHandlerAllAppChangeLanguage(data, this.setState.bind(this), i18n, false)
    this.loadContentTypeList()
    this.setHeadTitle()
  }

  componentDidMount () {
    this.loadContentTypeList()
    this.loadImportAuthorizationsList()
    this.setHeadTitle()
  }

  componentWillUnmount () {
    console.log('%c<ShareFolderAdvanced> will Unmount', `color: ${this.state.config.hexcolor}`)
  }

  setHeadTitle = () => {
    const { state, props } = this

    if (state.config && state.config.workspace && state.isVisible) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.SET_HEAD_TITLE,
        data: { title: buildHeadTitle([props.t('Received files'), state.config.workspace.label]) }
      })
    }
  }

  loadContentTypeList = async () => {
    const { props, state } = this

    const fetchContentTypeList = await handleFetchResult(await getContentTypeList(state.config.apiUrl))

    switch (fetchContentTypeList.apiResponse.status) {
      case 200: this.setState({ tracimContentTypeList: fetchContentTypeList.body.filter(ct => ct.slug !== 'comment') }); break
      default: sendGlobalFlashMessage(props.t("Error while loading Tracim's content type list"))
    }
  }

  loadImportAuthorizationsList = async () => {
    const { content, config } = this.state

    const fetchResultImportAuthorizationsList = await handleFetchResult(await getImportAuthorizationsList(config.apiUrl, content.workspace_id))

    switch (fetchResultImportAuthorizationsList.apiResponse.status) {
      case 200:
        this.setState({
          uploadLinkList: fetchResultImportAuthorizationsList.body
        })
        GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {} })
        break
      default:
        sendGlobalFlashMessage(this.props.t('Error while loading list of public upload links'), 'info')
    }
  }

  handleChangeEmails = e => this.setState({ uploadEmails: e.target.value })
  handleChangePassword = e => this.setState({ uploadPassword: e.target.value })

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
  }

  handleClickDeleteImportAuthorization = async importAuthorizationId => {
    const { config, content } = this.state
    const { props } = this

    const fetchResultDeleteImportAuthorization = await handleFetchResult(
      await deleteImportAuthorization(config.apiUrl, content.workspace_id, importAuthorizationId)
    )

    switch (fetchResultDeleteImportAuthorization.status) {
      case 204:
        this.loadImportAuthorizationsList()
        break
      case 400:
        sendGlobalFlashMessage(props.t('Error in the URL'), 'info')
        break
      default: sendGlobalFlashMessage(props.t('Error while deleting public upload link'), 'info')
    }
  }

  handleClickNewUploadComponent = () => {
    this.setState({ currentPageStatus: this.UPLOAD_STATUS.NEW_UPLOAD })
  }

  handleClickNewUpload = async isPasswordActive => {
    const { state, props } = this

    let uploadEmailList = parserStringToList(state.uploadEmails)
    const invalidEmails = []

    uploadEmailList.forEach(uploadEmail => {
      if (!checkEmailValidity(uploadEmail)) invalidEmails.push(uploadEmail)
    })

    uploadEmailList = uploadEmailList.filter(uploadEmail => !invalidEmails.includes(uploadEmail))

    if (invalidEmails.length > 0) {
      sendGlobalFlashMessage(`${props.t('Error, these emails are invalid: ')} ${invalidEmails.join(', ')}`, 'info')
    } else {
      const fetchResultPostImportAuthorizations = await handleFetchResult(await postImportAuthorizationsList(
        state.config.apiUrl,
        state.content.workspace_id,
        uploadEmailList,
        isPasswordActive ? state.uploadPassword : null
      ))

      switch (fetchResultPostImportAuthorizations.apiResponse.status) {
        case 200:
          if (isPasswordActive) sendGlobalFlashMessage(props.t("Public upload link has been created. Don't forget to share the password to the recipients."), 'info')
          else sendGlobalFlashMessage(props.t('Public upload link has been created.'), 'info')

          this.setState(prev => ({
            currentPageStatus: this.UPLOAD_STATUS.UPLOAD_MANAGEMENT,
            uploadLinkList: [...prev.uploadLinkList, ...fetchResultPostImportAuthorizations.body],
            uploadEmails: '',
            uploadPassword: ''
          }))
          break
        case 400:
          switch (fetchResultPostImportAuthorizations.body.code) {
            case 2001:
              sendGlobalFlashMessage(props.t('The password length must be between 6 and 512 characters and the email(s) must be valid'), 'info')
              break
            default: sendGlobalFlashMessage(props.t('Error while creating new public upload link'), 'info')
          }
          break
        default: sendGlobalFlashMessage(props.t('Error while creating new public upload link'), 'info')
      }
    }
  }

  handleClickCancelNewUpload = () => {
    this.setState({
      uploadEmails: '',
      uploadPassword: '',
      currentPageStatus: this.UPLOAD_STATUS.UPLOAD_MANAGEMENT
    })
  }

  handleKeyDownEnter = e => {
    if (e.key === 'Enter') {
      const emailList = parserStringToList(this.state.uploadEmails)
      const invalidEmails = []

      emailList.forEach(email => {
        if (!checkEmailValidity(email)) invalidEmails.push(email)
      })

      if (invalidEmails.length > 0) {
        sendGlobalFlashMessage(this.props.t(`Error: ${invalidEmails} are not valid`), 'info')
      } else {
        this.setState({ uploadEmails: emailList.join('\n') })
      }
    }
  }

  render () {
    const { props, state } = this
    const customColor = (state.tracimContentTypeList.find(type => type.slug === 'file') || { hexcolor: state.config.hexcolor }).hexcolor

    if (!state.isVisible) return null

    return (
      <PopinFixed customClass='share_folder_advanced'>
        <PopinFixedHeader
          customClass='folderAdvanced'
          customColor={state.config.hexcolor}
          faIcon={state.config.faIcon}
          componentTitle={<div>{props.t('Received files')}</div>}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          showChangeTitleButton={false}
        />

        <PopinFixedContent customClass={`${state.config.slug}__contentpage`}>
          {(state.currentPageStatus === this.UPLOAD_STATUS.UPLOAD_MANAGEMENT
            ? (
              <UploadFilesManagement
                customColor={customColor}
                uploadLinkList={state.uploadLinkList}
                onClickDeleteImportAuthorization={this.handleClickDeleteImportAuthorization}
                onClickNewUploadComponent={this.handleClickNewUploadComponent}
                userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
              />
            )
            : (
              <NewUpload
                customColor={customColor}
                onClickNewUpload={this.handleClickNewUpload}
                onClickCancelNewUpload={this.handleClickCancelNewUpload}
                uploadEmails={state.uploadEmails}
                onChangeUploadEmails={this.handleChangeEmails}
                uploadPassword={state.uploadPassword}
                onChangeUploadPassword={this.handleChangePassword}
                onKeyDownEnter={this.handleKeyDownEnter}
                emailNotifActivated={state.config.system.config.email_notification_activated}
              />
            )
          )}
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(appContentFactory(TracimComponent(ShareFolderAdvanced)))
