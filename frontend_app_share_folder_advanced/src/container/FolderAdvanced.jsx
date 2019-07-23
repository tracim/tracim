import React from 'react'
import UploadFilesManagement from '../component/UploadFilesManagement.jsx'
import i18n from '../i18n.js'
import { translate } from 'react-i18next'
import {
  PopinFixed,
  PopinFixedHeader,
  PopinFixedContent,
  addAllResourceI18n,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import { debug } from '../debug.js'

class FolderAdvanced extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      appName: 'share_folder',
      isVisible: true,
      config: props.data ? props.data.config : debug.config,
      loggedUser: props.data ? props.data.loggedUser : debug.loggedUser,
      content: props.data ? props.data.content : debug.content,
      externalTranslationList: [
        props.t('Share Folder')
      ],
      tracimContentTypeList: []
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
        this.setState(prev => ({content: {...prev.content, ...data.content}, isVisible: true}))
        break
      case CUSTOM_EVENT.HIDE_APP(state.config.slug):
        console.log('%c<ShareFolderAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState({isVisible: false})
        break
      case CUSTOM_EVENT.RELOAD_CONTENT(state.config.slug):
        console.log('%c<ShareFolderAdvanced> Custom event', 'color: #28a745', type, data)
        this.setState(prev => ({content: {...prev.content, ...data}, isVisible: true}))
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

  loadContent = () => {
  }

  handleClickBtnCloseApp = () => {
    this.setState({ isVisible: false })
    GLOBAL_dispatchEvent({type: CUSTOM_EVENT.APP_CLOSED, data: {}})
  }

  handleClickDeleteShareLink = () => { // = async shareLinkId => {
    // const { config, content } = this.state

    // const fetchResultArchive = await putFileIsDeleted(config.apiUrl, content.workspace_id, content.content_id)
    // switch (fetchResultArchive.status) {
    //   case 204:
    //     this.setState(previousState => ({
    //       shareLinkList: previousState.shareLinkList.filter(shareLink => shareLink.id !== shareLinkId)
    //     }))
    //     break
    //   default: this.sendGlobalFlashMessage(this.props.t('Error while deleting share link'))
    // }
  }

  render () {
    const { state } = this

    if (!state.isVisible) return null

    return (
      <PopinFixed customClass='folder_advanced'>
        <PopinFixedHeader
          customClass={'folderAdvanced'}
          customColor={state.config.hexcolor}
          faIcon={state.config.faIcon}
          rawTitle={state.content.label}
          componentTitle={<div>{state.content.label}</div>}
          userRoleIdInWorkspace={state.loggedUser.userRoleIdInWorkspace}
          onClickCloseBtn={this.handleClickBtnCloseApp}
        />

        <PopinFixedContent customClass={`${state.config.slug}__contentpage`}>
          <UploadFilesManagement
            customColor={state.config.hexcolor}
            onClickDeleteShareLink={this.handleClickDeleteShareLink}
          />
        </PopinFixedContent>
      </PopinFixed>
    )
  }
}

export default translate()(FolderAdvanced)
