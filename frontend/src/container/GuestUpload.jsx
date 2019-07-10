import React from 'react'
import { translate } from 'react-i18next'
import { Popover, PopoverBody } from 'reactstrap'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import InputTextArea from '../component/common/Input/InputTextArea.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import { FileDropzone, CUSTOM_EVENT } from 'tracim_frontend_lib'

class GuestUpload extends React.Component {
  constructor (props) {
    super(props)
    this.toggle = this.toggle.bind(this)
    this.state = {
      popoverOpen: false,
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
        display: false,
        percent: 0
      }
    }
  }

  toggle () {
    this.setState({
      popoverOpen: !this.state.popoverOpen
    })
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  handleChangeFullName = e => this.setState({guestName: e.target.value})
  handleChangeComment = e => this.setState({guestComment: e.target.value})
  handleChangePassword = e => this.setState({guestPassword: {...this.state.guestPassword, value: e.target.value}})

  handleChangeFile = uploadFileList => {
    if (!uploadFileList || !uploadFileList[0]) return

    uploadFileList.forEach(uploadFile => {
      this.setState(previousState => ({
        uploadFileList: [...previousState.uploadFileList, uploadFile]
      }))
    })
  }

  handleDeleteFile = deletedFile => {
    this.setState(previousState => ({
      uploadFileList: previousState.uploadFileList.filter(file => file.name !== deletedFile.name)
    }))
  }

  handleClickSend = async () => {
    const { props, state } = this

    state.uploadFileList.forEach((uploadFile, index) => {
      const formData = new FormData()
      formData.append('files', uploadFile)

      // INFO - GB - 2019-07-09 - Fetch still doesn't handle event progress, so we need to use old school xhr object.
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('loadstart', () => this.setState({progressUpload: {display: false, percent: 0}}), false)
      const uploadInProgress = e => e.lengthComputable && this.setState({progressUpload: {display: true, percent: Math.round(e.loaded / e.total * 100)}})
      xhr.upload.addEventListener('progress', uploadInProgress, false)
      xhr.upload.addEventListener('load', () => this.setState({progressUpload: {display: false, percent: 0}}), false)

      // TODO xhr.open('PUT', `${state.config.apiUrl}/workspaces/${state.content.workspace_id}/files/${state.content.content_id}/raw/${state.content.filename}`, true)
      xhr.setRequestHeader('Accept', 'application/json')
      xhr.withCredentials = true

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          switch (xhr.status) {
            case 204:
              this.setState(previousState => ({
                uploadFileList: previousState.uploadFileList.filter((file, j) => index !== j)
              }))
              break
            case 400:
              const jsonResult400 = JSON.parse(xhr.responseText)
              switch (jsonResult400.code) {
                case 3002: this.sendGlobalFlashMessage(props.t('A content with the same name already exists')); break
                default: this.sendGlobalFlashMessage(props.t('Error while uploading file'))
              }
              break
            default: this.sendGlobalFlashMessage(props.t('Error while uploading file'))
          }
        }
      }
      xhr.send(formData)
    })
  }

  showFiles = () => {

  }

  render () {
    const { props, state } = this

    return (
      <section className='guestupload primaryColorBg'>
        <Card customClass='guestupload__card'>
          <CardHeader customClass='guestupload__card__header primaryColorBgLighten'>
            {props.t('Upload files')}
          </CardHeader>

          <CardBody formClass='guestupload__card__form'>
            <form>
              <div className='guestupload__card__form__left'>
                <InputGroupText
                  parentClassName='guestupload__card__form__fullname'
                  customClass='mb-3'
                  type='text'
                  placeHolder={props.t('Full name')}
                  value={state.guestName}
                  onChange={this.handleChangeFullName}
                />

                <div className='d-flex'>
                  <InputGroupText
                    parentClassName='guestupload__card__form__groupepw'
                    customClass=''
                    icon='fa-lock'
                    type='password'
                    placeHolder={props.t('Password')}
                    invalidMsg={props.t('Invalid password')}
                    isInvalid={state.guestPassword.isInvalid}
                    value={state.guestPassword.value}
                    onChange={this.handleChangePassword}
                    onKeyDown={() => {}}
                  />

                  <button
                    type='button'
                    className='guestupload__card__form__groupepw__question mb-3'
                    id='popoverQuestion'
                  >
                    <i className='fa fa-fw fa-question-circle' />
                  </button>
                  <Popover placement='bottom' isOpen={this.state.popoverOpen} target='popoverQuestion' toggle={this.toggle}>
                    <PopoverBody>{props.t('The person who sent you this file protected it with a password. If you do not know the password, please contact her.')}</PopoverBody>
                  </Popover>
                </div>

                <InputTextArea
                  placeHolder={props.t('Leave a message with your file(s) if you wish. Feel free to leave your contact details if you wish to be contacted again.')}
                  numberRows='20'
                  value={state.guestComment}
                  onChange={this.handleChangeComment}
                />
              </div>
              <div className='guestupload__card__form__right'>
                <FileDropzone
                  onDrop={this.handleChangeFile}
                  onClick={this.handleChangeFile}
                  preview={state.uploadFilePreview}
                  multipleFiles
                />

                <div className='font-weight-bold m-1'>
                  {state.uploadFileList.length > 0
                    ? props.t('Attached files')
                    : props.t('You have not yet chosen any files to upload.')
                  }
                </div>
                <div className='guestupload__card__form__right__files'>
                  {(state.uploadFileList.map(file =>
                    <div className='d-flex' key={file.name}>
                      <i className='fa fa-fw fa-file-o m-1' />
                      {file.name} ({file.size} bytes)
                      <button
                        className='iconBtn ml-auto primaryColorFontHover'
                        onClick={() => this.handleDeleteFile(file)}
                        title={props.t('Delete')}
                      >
                        <i className='fa fa-fw fa-trash-o' />
                      </button>
                    </div>
                  ))}
                </div>

                <button type='button'
                  className='guestupload__card__form__right__btn btn highlightBtn primaryColorBg primaryColorBgDarkenHover ml-auto'
                  onClick={this.handleClickSend}
                >
                  {props.t('Send')} <i className='fa fa-fw fa-paper-plane-o' />
                </button>
              </div>
            </form>
          </CardBody>
        </Card>

        <FooterLogin />
      </section>
    )
  }
}

export default translate()(GuestUpload)
