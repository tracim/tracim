import React from 'react'
import UploadFilesManagement from '../component/UploadFilesManagement.jsx'
import NewUpload from '../component/NewUpload.jsx'
import i18n from '../i18n'
import { translate } from 'react-i18next'
import {
  PopinFixed,
  PopinFixedHeader,
  PopinFixedContent,
  addAllResourceI18n,
  handleFetchResult,
  CUSTOM_EVENT,
  checkEmailValidity,
  parserStringToList,
  appFeatureCustomEventHandlerShowApp
} from 'tracim_frontend_lib'
import { debug } from '../debug'
import {
  getImportAuthorizationsList,
  deleteImportAuthorization,
  postImportAuthorizationsList,
  getContentTypeList
} from '../action.async.js'

class ShareFolderAdvanced extends React.Component {
  constructor (props) {
    super(props)

    this.UPLOAD_STATUS = {
      UPLOAD_MANAGEMENT: 'management',
      NEW_UPLOAD: 'newUpload'
    }

    this.state = {
      appName: 'share_folder',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      externalTranslationList: [
        props.t('Inbox')
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

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    const { state } = this
    switch (type) {
      case CUSTOM_EVENT.SHOW_APP(state.config.slug):
        console.log('%c<ShareFolderAdvanced> Custom event', 'color: #28a745', type, data)
        const isSameContentId = appFeatureCustomEventHandlerShowApp(data.content, state.content.content_id, state.content.content_type)
        if (isSameContentId) {
          this.setState(prev => ({ content: { ...prev.content, ...data.content }, isVisible: true }))
        }
        break
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<WorkspaceAdvanced> Custom event', 'color: #28a745', type, data)
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
    this.loadContent()
    this.loadImportAuthorizationsList()
  }

  componentDidUpdate (prevProps, prevState) {
    const { state } = this

    if (prevState.content.content_id !== state.content.content_id) {
      this.loadContent()
    }
  }

  componentWillUnmount () {
    console.log('%c<ShareFolderAdvanced> will Unmount', `color: ${this.state.config.hexcolor}`)
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  sendGlobalFlashMessage = (msg, type = 'info') => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: type,
      delay: undefined
    }
  })

  loadContent = async () => {
    const { props, state } = this

    const fetchContentTypeList = await handleFetchResult(await getContentTypeList(state.config.apiUrl))

    switch (fetchContentTypeList.apiResponse.status) {
      case 200: this.setState({ tracimContentTypeList: fetchContentTypeList.body.filter(ct => ct.slug !== 'comment') }); break
      default: this.sendGlobalFlashMessage(props.t("Error while loading tracim's content type list"), 'warning')
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
        this.sendGlobalFlashMessage(this.props.t('Error while loading share links list'))
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
        this.sendGlobalFlashMessage(props.t('Error in the URL'))
        break
      default: this.sendGlobalFlashMessage(props.t('Error while deleting share link'))
    }
  }

  handleClickNewUploadComponent = () => {
    this.setState({ currentPageStatus: this.UPLOAD_STATUS.NEW_UPLOAD })
  }

  handleClickNewUpload = async () => {
    const { state, props } = this

    let uploadEmailList = parserStringToList(state.uploadEmails)
    let invalidEmails = []

    uploadEmailList.forEach(uploadEmail => {
      if (!checkEmailValidity(uploadEmail)) invalidEmails.push(uploadEmail)
    })

    uploadEmailList = uploadEmailList.filter(uploadEmail => !invalidEmails.includes(uploadEmail))

    if (invalidEmails.length > 0 || uploadEmailList === 0) {
      this.sendGlobalFlashMessage(props.t(`Error: ${invalidEmails} are not valid`))
    } else {
      const fetchResultPostImportAuthorizations = await handleFetchResult(await postImportAuthorizationsList(
        state.config.apiUrl,
        state.content.workspace_id,
        uploadEmailList,
        state.uploadPassword !== '' ? state.uploadPassword : null
      ))

      switch (fetchResultPostImportAuthorizations.apiResponse.status) {
        case 200:
          this.setState(prev => ({
            uploadLinkList: [...prev.uploadLinkList, ...fetchResultPostImportAuthorizations.body],
            uploadEmails: '',
            uploadPassword: ''
          }))
          this.setState({ currentPageStatus: this.UPLOAD_STATUS.UPLOAD_MANAGEMENT })
          break
        case 400:
          switch (fetchResultPostImportAuthorizations.body.code) {
            case 2001:
              this.sendGlobalFlashMessage(props.t('The password length must be between 6 and 512 characters and the email(s) must be valid'))
              break
            default: this.sendGlobalFlashMessage(props.t('Error while creating new share link'))
          }
          break
        default: this.sendGlobalFlashMessage(props.t('Error while creating new share link'))
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
      let emailList = parserStringToList(this.state.uploadEmails)
      let invalidEmails = []

      emailList.forEach(email => {
        if (!checkEmailValidity(email)) invalidEmails.push(email)
      })

      if (invalidEmails.length > 0) {
        this.sendGlobalFlashMessage(this.props.t(`Error: ${invalidEmails} are not valid`))
      } else {
        this.setState({ uploadEmails: emailList.join('\n') })
      }
    }
  }

  render () {
    const { state } = this
    const customColor = (state.tracimContentTypeList.find(type => type.slug === 'file') || { hexcolor: state.config.hexcolor }).hexcolor
    const title = this.props.t('Inbox')

    if (!state.isVisible) return null

    return (
      <PopinFixed customClass='share_folder_advanced'>
        <PopinFixedHeader
          customClass={'folderAdvanced'}
          customColor={state.config.hexcolor}
          faIcon={state.config.faIcon}
          componentTitle={<div>{title}</div>}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
          showChangeTitleButton={false}
        />

        <PopinFixedContent customClass={`${state.config.slug}__contentpage`}>
          {state.currentPageStatus === this.UPLOAD_STATUS.UPLOAD_MANAGEMENT
            ? <UploadFilesManagement
              customColor={customColor}
              uploadLinkList={state.uploadLinkList}
              onClickDeleteImportAuthorization={this.handleClickDeleteImportAuthorization}
              onClickNewUploadComponent={this.handleClickNewUploadComponent}
              userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
            />
            : <NewUpload
              customColor={customColor}
              onClickNewUpload={this.handleClickNewUpload}
              onClickCancelNewUpload={this.handleClickCancelNewUpload}
              uploadEmails={state.uploadEmails}
              onChangeUploadEmails={this.handleChangeEmails}
              uploadPassword={state.uploadPassword}
              onChangeUploadPassword={this.handleChangePassword}
              onKeyDownEnter={this.handleKeyDownEnter}
            />
          }
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(ShareFolderAdvanced)
