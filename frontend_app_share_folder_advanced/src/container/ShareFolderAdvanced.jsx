import React from 'react'
import UploadFilesManagement from '../component/UploadFilesManagement.jsx'
import NewUpload from '../component/NewUpload.jsx'
import i18n from '../i18n'
import { withTranslation } from 'react-i18next'
import {
  PopinFixed,
  PopinFixedHeader,
  PopinFixedContent,
  addAllResourceI18n,
  handleFetchResult,
  CUSTOM_EVENT,
  checkEmailValid,
  parserStringtoList
} from 'tracim_frontend_lib'
import { debug } from '../debug'
import {
  // getShareFolder,
  // putShareLinkList,
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
        props.t('Share Folder')
      ],
      tracimContentTypeList: [],
      currentPage: this.UPLOAD_STATUS.UPLOAD_MANAGEMENT,
      shareLinkList: [],
      shareEmails: '',
      sharePassword: ''
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
        console.log('%c<ShareFolderAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({ content: { ...prev.content, ...data.content }, isVisible: true }))
        break
      case CUSTOM_EVENT.HIDE_APP(state.config.slug):
        console.log('%c<ShareFolderAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState({ isVisible: false })
        break
      // case CUSTOM_EVENT.RELOAD_CONTENT(state.config.slug):
      //   console.log('%c<ShareFolderAdvanced> Custom event', 'color: #28a745', type, data)
      //   this.setState(prev => ({content: {...prev.content, ...data}, isVisible: true}))
      //   break
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
    // this.loadShareLinkList()
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

    // const fetchSharedFolder = await handleFetchResult(await getShareFolder(state.config.apiUrl, state.content.workspace_id, state.content.content_id))
    const fetchContentTypeList = await handleFetchResult(await getContentTypeList(state.config.apiUrl))

    // switch (fetchSharedFolder.apiResponse.status) {
    //   case 200: this.setState({content: fetchSharedFolder.body}); break
    //   default: this.sendGlobalFlashMessage(props.t('Error while loading shared folder details'), 'warning')
    // }

    switch (fetchContentTypeList.apiResponse.status) {
      case 200: this.setState({ tracimContentTypeList: fetchContentTypeList.body.filter(ct => ct.slug !== 'comment') }); break
      default: this.sendGlobalFlashMessage(props.t("Error while loading tracim's content type list"), 'warning')
    }
  }

  // loadShareLinkList = async () => {
  //   const { content, config } = this.state

  //   const fetchResultShareLinkList = await handleFetchResult(await getShareLinkList(config.apiUrl, content.workspace_id, content.content_id))

  //   switch (fetchResultShareLinkList.apiResponse.status) {
  //     case 200:
  //       this.setState({
  //         shareLinkList: fetchResultShareLinkList.links
  //       })
  //       break
  //     default:
  //       this.sendGlobalFlashMessage(this.props.t('Error while loading share links list'))
  //       return
  //   }

  //   GLOBAL_dispatchEvent({type: CUSTOM_EVENT.REFRESH_CONTENT_LIST, data: {}}) // Needed?
  // }

  handleChangeEmails = e => this.setState({ shareEmails: e.target.value })
  handleChangePassword = e => this.setState({ sharePassword: e.target.value })

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({ type: CUSTOM_EVENT.APP_CLOSED, data: {} })
  }

  handleClickDeleteShareLink = shareLinkId => { // = async shareLinkId => {
    // const { config, content } = this.state

    this.setState(previousState => ({
      shareLinkList: previousState.shareLinkList.filter(shareLink => shareLink.id !== shareLinkId)
    }))

    // const fetchResultSaveNewShareLinkList = await handleFetchResult(
    //   await putShareLinkList(state.config.apiUrl, state.content.workspace_id, state.shareLinkList)
    // )

    // switch (fetchResultSaveNewShareLinkList.status) {
    //   case 204:
    //     ??
    //     break
    //   default: this.sendGlobalFlashMessage(this.props.t('Error while deleting share link'))
    // }
  }

  handleClickNewUploadComponent = () => {
    this.setState({ currentPage: this.UPLOAD_STATUS.NEW_UPLOAD })
  }

  handleClickNewUpload = () => { // = async () => {
    const { state } = this

    const shareEmailList = parserStringtoList(state.shareEmails).filter(shareEmail => shareEmail !== '')

    shareEmailList.forEach(shareEmail => {
      if (!checkEmailValid(shareEmail)) {
        this.sendGlobalFlashMessage(this.props.t(`Error: ${shareEmail} are not valid`))
      } else {
        this.setState(previousState => ({
          shareLinkList: [...previousState.shareLinkList,
            {
              email: shareEmail,
              link: '?',
              id: new Date(),
              isProtected: state.sharePassword !== ''
            }
          ]
        }))
      }
    })
    // console.log(shareEmailList)
    // this.setState({shareLinkList: newShareLinkList})

    // const fetchResultSaveNewShareLinkList = await handleFetchResult(
    //   await putShareLinkList(state.config.apiUrl, state.content.workspace_id, state.shareLinkList)
    // )

    // switch (fetchResultSaveNewShareLinkList.status) {
    //   case 204:
         this.setState({ shareEmails: '', sharePassword: '' })
    //     break
    //   default: this.sendGlobalFlashMessage(this.props.t('Error while deleting share link'))
    // }

    this.setState({ currentPage: this.UPLOAD_STATUS.UPLOAD_MANAGEMENT })
  }

  handleReturnToManagement = () => {
    this.setState({ shareEmails: '', sharePassword: '' })
    this.setState({ currentPage: this.UPLOAD_STATUS.UPLOAD_MANAGEMENT })
  }

  handleKeyDownEnter = e => {
    if (e.key === 'Enter') {
      let emailList = parserStringtoList(this.state.shareEmails)

      emailList = emailList.filter(email => email !== '')
      emailList.forEach(email => !checkEmailValid(email) &&
          this.sendGlobalFlashMessage(this.props.t(`Error: ${email} are not valid`)))

      this.setState({ shareEmails: emailList.join('\n') })
    }
  }

  render () {
    const { state } = this
    const customColor = (state.tracimContentTypeList.find(type => type.slug === 'file') || { hexcolor: state.config.hexcolor }).hexcolor

    if (!state.isVisible) return null

    return (
      <PopinFixed customClass='share_folder_advanced'>
        <PopinFixedHeader
          customClass={'folderAdvanced'}
          customColor={state.config.hexcolor}
          faIcon={state.config.faIcon}
          // rawTitle={state.content.label}
          componentTitle={<div>Share folder</div>}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
        />

        <PopinFixedContent customClass={`${state.config.slug}__contentpage`}>
          {state.currentPage === this.UPLOAD_STATUS.UPLOAD_MANAGEMENT
            ? <UploadFilesManagement
              customColor={customColor}
              shareLinkList={state.shareLinkList}
              onClickDeleteShareLink={this.handleClickDeleteShareLink}
              onClickNewUploadComponent={this.handleClickNewUploadComponent}
            />
            : <NewUpload
              customColor={customColor}
              onClickDeleteShareLink={this.handleClickDeleteShareLink}
              onClickNewUpload={this.handleClickNewUpload}
              onClickReturnToManagement={this.handleReturnToManagement}
              shareEmails={state.shareEmails}
              onChangeShareEmails={this.handleChangeEmails}
              sharePassword={state.sharePassword}
              onChangeSharePassword={this.handleChangePassword}
              onKeyDownEnter={this.handleKeyDownEnter}
            />
          }
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default withTranslation()(ShareFolderAdvanced)
