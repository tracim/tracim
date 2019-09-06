import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import {
  CUSTOM_EVENT,
  ProgressBar
} from 'tracim_frontend_lib'
import ImportConfirmation from '../component/GuestPage/ImportConfirmation.jsx'
import UploadForm from '../component/GuestPage/UploadForm.jsx'
import {
  FETCH_CONFIG,
  PAGE
} from '../helper.js'
import { getGuestUploadInfo } from '../action-creator.async'

class GuestUpload extends React.Component {
  constructor (props) {
    super(props)

    this.UPLOAD_STATUS = {
      BEFORE_LOAD: 'beforeLoad',
      LOADING: 'loading',
      AFTER_LOAD: 'afterLoad'
    }

    this.state = {
      hasPassword: false,
      guestName: '',
      guestComment: '',
      guestPassword: {
        value: '',
        isInvalid: false
      },
      appName: 'file',
      uploadFileList: [],
      uploadFilePreview: null,
      progressUpload: {
        display: this.UPLOAD_STATUS.BEFORE_LOAD,
        percent: 0
      }
    }
  }

  async componentDidMount () {
    const { props } = this

    const response = await props.dispatch(getGuestUploadInfo(props.match.params.token))

    switch (response.apiResponse.status) {
      case 200:
        this.setState({
          hasPassword: response.json.has_password
        })
        break
      case 400:
        this.sendGlobalFlashMessage(props.t('Error in the URL'))
        props.history.push(PAGE.LOGIN)
        break
      default:
        this.sendGlobalFlashMessage(props.t('Error while loading upload infos'))
        props.history.push(PAGE.LOGIN)
    }
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  handleChangeFullName = e => this.setState({ guestName: e.target.value })
  handleChangeComment = e => this.setState({ guestComment: e.target.value })
  handleChangePassword = e => this.setState({ guestPassword: { ...this.state.guestPassword, value: e.target.value } })

  handleAddFile = uploadFileList => {
    if (!uploadFileList || !uploadFileList[0]) return

    this.setState(previousState => ({
      uploadFileList: [
        ...previousState.uploadFileList,
        ...uploadFileList
      ]
    }))
  }

  handleDeleteFile = deletedFile => {
    this.setState(previousState => ({
      uploadFileList: previousState.uploadFileList.filter(file => file.name !== deletedFile.name)
    }))
  }

  handleClickSend = async () => {
    const { props, state } = this
    const formData = new FormData()

    state.uploadFileList.forEach((uploadFile, index) => {
      formData.append(`file_${index}`, uploadFile)
      formData.append('username', state.guestName)
      formData.append('message', state.guestComment)
      if (state.guestPassword.value !== '') formData.append('password', state.guestPassword.value)
    })
    // INFO - GB - 2019-07-09 - Fetch still doesn't handle event progress, so we need to use old school xhr object.
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('loadstart', () => this.setState({ progressUpload: { display: this.UPLOAD_STATUS.BEFORE_LOAD, percent: 0 } }), false)
    const uploadInProgress = e => e.lengthComputable && this.setState({ progressUpload: { display: this.UPLOAD_STATUS.LOADING, percent: Math.round(e.loaded / e.total * 100) } })
    xhr.upload.addEventListener('progress', uploadInProgress, false)
    xhr.upload.addEventListener('load', () => this.setState({ progressUpload: { display: this.UPLOAD_STATUS.AFTER_LOAD, percent: 0 } }), false)

    xhr.open('POST', `${FETCH_CONFIG.apiUrl}/public/guest-upload/${this.props.match.params.token}`, true)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.withCredentials = true

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        switch (xhr.status) {
          case 204:
            this.setState({ uploadFileList: [] })
            break
          case 400:
            const jsonResult400 = JSON.parse(xhr.responseText)
            switch (jsonResult400.code) {
              case 3002:
                this.sendGlobalFlashMessage(props.t('A content with the same name already exists'))
                this.setState({ progressUpload: { display: this.UPLOAD_STATUS.BEFORE_LOAD, percent: 0 } })
                break
              default:
                this.sendGlobalFlashMessage(props.t('Error while uploading file'))
                this.setState({ progressUpload: { display: this.UPLOAD_STATUS.BEFORE_LOAD, percent: 0 } })
            }
            break
          case 403:
            const jsonResult403 = JSON.parse(xhr.responseText)
            switch (jsonResult403.code) {
              case 2053:
                this.sendGlobalFlashMessage((props.t('Invalid password')))
                this.setState({ progressUpload: { display: this.UPLOAD_STATUS.BEFORE_LOAD, percent: 0 } })
                break
              default:
                this.sendGlobalFlashMessage((props.t('Error while uploading file')))
                this.setState({ progressUpload: { display: this.UPLOAD_STATUS.BEFORE_LOAD, percent: 0 } })
            }
            break
          default:
            this.sendGlobalFlashMessage(props.t('Error while uploading file'))
            this.setState({ progressUpload: { display: this.UPLOAD_STATUS.BEFORE_LOAD, percent: 0 } })
        }
      }
    }
    xhr.send(formData)
  }

  render () {
    const { props, state } = this

    return (
      <section className='guestupload'>
        <Card customClass='guestupload__card'>
          <CardHeader customClass='guestupload__card__header primaryColorBgLighten'>
            {props.t('Upload files')}
          </CardHeader>

          <CardBody formClass='guestupload__card__form'>
            {(() => {
              switch (state.progressUpload.display) {
                case this.UPLOAD_STATUS.BEFORE_LOAD:
                  return (
                    <UploadForm
                      guestName={state.guestName}
                      hasPassword={state.hasPassword}
                      onChangeFullName={this.handleChangeFullName}
                      guestPassword={state.guestPassword}
                      onChangePassword={this.handleChangePassword}
                      guestComment={state.guestComment}
                      onChangeComment={this.handleChangeComment}
                      onAddFile={this.handleAddFile}
                      onDeleteFile={this.handleDeleteFile}
                      onClickSend={this.handleClickSend}
                      uploadFileList={state.uploadFileList}
                      uploadFilePreview={state.uploadFilePreview}
                    />
                  )
                case this.UPLOAD_STATUS.LOADING:
                  return (
                    <ProgressBar
                      percent={state.progressUpload.percent}
                      color='inherit'
                    />
                  )
                default:
                  return <ImportConfirmation
                    title={props.t('Thank you, your import is finished!')}
                    text={props.t('Your interlocutor has been notified of your upload. You can close this window.')}
                  />
              }
            })()}
          </CardBody>
        </Card>

        <FooterLogin />
      </section>
    )
  }
}

export default connect(() => ({}))(translate()(GuestUpload))
