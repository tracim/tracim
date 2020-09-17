import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import {
  CUSTOM_EVENT,
  ProgressBar,
  computeProgressionPercentage,
  FILE_PREVIEW_STATE,
  setupCommonRequestHeaders
} from 'tracim_frontend_lib'
import ImportConfirmation from '../component/GuestPage/ImportConfirmation.jsx'
import UploadForm from '../component/GuestPage/UploadForm.jsx'
import {
  FETCH_CONFIG,
  PAGE
} from '../util/helper.js'
import { setHeadTitle } from '../action-creator.sync.js'
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
      guestFullname: {
        value: '',
        isInvalid: false
      },
      guestComment: '',
      guestPassword: {
        value: '',
        isInvalid: false
      },
      appName: 'file',
      fileToUploadList: [],
      uploadFilePreview: FILE_PREVIEW_STATE.NO_FILE,
      progressUpload: {
        display: this.UPLOAD_STATUS.BEFORE_LOAD,
        percent: 0
      }
    }

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  customEventReducer = ({ detail: { type } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        this.setHeadTitle()
        break
    }
  }

  async componentDidMount () {
    const { props } = this

    this.setHeadTitle()

    const response = await props.dispatch(getGuestUploadInfo(props.match.params.token))
    switch (response.status) {
      case 200:
        this.setState({ hasPassword: response.json.has_password })
        break
      case 400:
        switch (response.json.code) {
          case 1008: this.sendGlobalFlashMessage(props.t('Error, this link is invalid or has expired')); break
          default: this.sendGlobalFlashMessage(props.t('Error in the URL')); break
        }
        props.history.push(PAGE.LOGIN)
        break
      default:
        this.sendGlobalFlashMessage(props.t('Error while loading upload information'))
        props.history.push(PAGE.LOGIN)
    }
  }

  componentDidUpdate (prevProps) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
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

  setHeadTitle = () => {
    const { props } = this
    props.dispatch(setHeadTitle(props.t('Public upload')))
  }

  handleChangeFullName = e => this.setState({ guestFullname: { value: e.target.value, isInvalid: false } })
  handleChangeComment = e => this.setState({ guestComment: e.target.value, isInvalid: false })
  handleChangePassword = e => this.setState({ guestPassword: { ...this.state.guestPassword, value: e.target.value } })

  handleAddFile = newFileList => {
    const { props, state } = this

    if (!Array.isArray(newFileList) || (newFileList.length === 0)) return

    const alreadyUploadedList = newFileList.filter(newFile => state.fileToUploadList.some(stateFile => stateFile.name === newFile.name))
    if (alreadyUploadedList.length) {
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: (
            <div>
              {props.t('Files already uploaded:')}
              <br />
              <ul>
                {alreadyUploadedList.map(file =>
                  <li key={file.name}>{file.name}</li>
                )}
              </ul>
            </div>
          ),
          type: 'warning',
          delay: undefined
        }
      })
    }

    this.setState(previousState => ({
      fileToUploadList: [
        ...previousState.fileToUploadList,
        ...newFileList.filter(newFile => !state.fileToUploadList.some(stateFile => stateFile.name === newFile.name))
      ]
    }))
  }

  handleDeleteFile = deletedFile => {
    this.setState(previousState => ({
      fileToUploadList: previousState.fileToUploadList.filter(file => file.name !== deletedFile.name)
    }))
  }

  validateForm = () => {
    const { props, state } = this
    const errors = []
    if (state.guestFullname.value.length < 1) errors.push({ field: 'guestFullname', msg: props.t('Full name must be at least 1 character') })
    if (state.guestFullname.value.length > 255) errors.push({ field: 'guestFullname', msg: props.t('Full name must be less than 255 characters') })
    if (state.hasPassword && (state.guestPassword.value.length < 6)) errors.push({ field: 'guestPassword', msg: props.t('Password must be at least 6 characters') })
    if (state.hasPassword && (state.guestPassword.value.length > 255)) errors.push({ field: 'guestPassword', msg: props.t('Password must be less than 255 characters') })
    if (state.fileToUploadList.length === 0) errors.push({ field: 'fileToUploadList', msg: props.t('You must select at least 1 file to upload') })
    if (errors.length) {
      // INFO - B.L - Not used now because form's css isn't ready for it use flash message instead
      // this.setState({
      //   guestPassword: { value: state.guestPassword.value, isInvalid: errors.some(error => error.key === 'guestPassword') },
      //   guestFullname: { value: state.guestFullname.value, isInvalid: errors.some(error => error.key === 'guestFullname') }
      // })
      GLOBAL_dispatchEvent({
        type: CUSTOM_EVENT.ADD_FLASH_MSG,
        data: {
          msg: <div>{props.t('Errors in form:')}<br /><ul>{errors.map(error => <li key={error.field}>{error.msg}</li>)}</ul></div>,
          type: 'warning',
          delay: undefined
        }
      })
    }
    return (errors.length === 0)
  }

  handleClickSend = async () => {
    const { props, state } = this
    if (!this.validateForm()) return false

    const formData = new FormData()

    state.fileToUploadList.forEach((uploadFile, index) => {
      formData.append(`file_${index}`, uploadFile)
      formData.append('username', state.guestFullname.value)
      formData.append('message', state.guestComment)
      if (state.guestPassword.value !== '') formData.append('password', state.guestPassword.value)
    })
    // INFO - GB - 2019-07-09 - Fetch still doesn't handle event progress, so we need to use old school xhr object.
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('loadstart', () => this.setState({ progressUpload: { display: this.UPLOAD_STATUS.BEFORE_LOAD, percent: 0 } }), false)
    const uploadInProgress = e => e.lengthComputable && this.setState({ progressUpload: { display: this.UPLOAD_STATUS.LOADING, percent: Math.round(computeProgressionPercentage(e.loaded, e.total)) } })
    xhr.upload.addEventListener('progress', uploadInProgress, false)
    xhr.upload.addEventListener('load', () => this.setState({ progressUpload: { display: this.UPLOAD_STATUS.AFTER_LOAD, percent: 0 } }), false)

    xhr.open('POST', `${FETCH_CONFIG.apiUrl}/public/guest-upload/${this.props.match.params.token}`, true)
    setupCommonRequestHeaders(xhr)
    xhr.withCredentials = true

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        switch (xhr.status) {
          case 204:
            this.setState({ fileToUploadList: [] })
            break
          case 400: {
            const jsonResult400 = JSON.parse(xhr.responseText)
            switch (jsonResult400.code) {
              case 3002: this.sendGlobalFlashMessage(props.t('A content with the same name already exists')); break
              case 6002: this.sendGlobalFlashMessage(props.t('The file is larger than the maximum file size allowed')); break
              case 6003: this.sendGlobalFlashMessage(props.t('Error, the space exceed its maximum size')); break
              case 6004: this.sendGlobalFlashMessage(props.t('Upload impossible, the destination storage capacity has been reached')); break
              default: this.sendGlobalFlashMessage(props.t('Error while uploading file')); break
            }
            this.setState({ progressUpload: { display: this.UPLOAD_STATUS.BEFORE_LOAD, percent: 0 } })
            break
          }
          case 403: {
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
          }
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
                      hasPassword={state.hasPassword}
                      guestFullname={state.guestFullname}
                      onChangeFullName={this.handleChangeFullName}
                      guestPassword={state.guestPassword}
                      onChangePassword={this.handleChangePassword}
                      guestComment={state.guestComment}
                      onChangeComment={this.handleChangeComment}
                      onAddFile={this.handleAddFile}
                      onDeleteFile={this.handleDeleteFile}
                      onClickSend={this.handleClickSend}
                      fileToUploadList={state.fileToUploadList}
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
                  return (
                    <ImportConfirmation
                      title={props.t('Thank you, your upload is finished!')}
                      text={props.t('Your interlocutor has been notified of your upload. You can close this window.')}
                    />
                  )
              }
            })()}
          </CardBody>
        </Card>

        <FooterLogin />
      </section>
    )
  }
}

const mapStateToProps = ({ system }) => ({ system })

export default connect(mapStateToProps)(translate()(GuestUpload))
