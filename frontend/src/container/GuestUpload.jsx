import React from 'react'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap' // react-awesome-popover
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import InputTextArea from '../component/common/Input/InputTextArea.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import { FileDropzone } from 'tracim_frontend_lib'

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
      uploadFile: null,
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

  handleChangeFullName = e => this.setState({guestName: e.target.value})
  handleChangeComment = e => this.setState({guestComment: e.target.value})
  handleChangePassword = e => this.setState({guestPassword: {...this.state.guestPassword, value: e.target.value}})

  handleClickSend = () => {}

  handleChangeFile = newFile => {
    if (!newFile || !newFile[0]) return

    const fileToSave = newFile[0]

    if (
      !fileToSave.type.includes('image') ||
      fileToSave.size > 2000000
    ) {
      this.setState({
        uploadFile: fileToSave,
        uploadFilePreview: false
      })
      return
    }

    this.setState({uploadFile: fileToSave})

    var reader = new FileReader()
    reader.onload = e => {
      this.setState({uploadFilePreview: e.total > 0 ? e.target.result : false})
      const img = new Image()
      img.src = e.target.result
      img.onerror = () => this.setState({uploadFilePreview: false})
    }
    reader.readAsDataURL(fileToSave)
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
              <InputGroupText
                parentClassName='guestupload__card__form__fullname'
                customClass='mb-3'
                type='text'
                placeHolder={props.t('Full name')}
                value={state.guestName}
                onChange={this.handleChangeFullName}
              />

              <InputTextArea
                customClass='mb-3'
                placeHolder={props.t('Comment')}
                numberRows='5'
                value={state.guestComment}
                onChange={this.handleChangeComment}
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
                  <PopoverHeader>Popover Title</PopoverHeader>
                  <PopoverBody>Sed posuere consectetur est at lobortis. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.</PopoverBody>
                </Popover>
              </div>

              <FileDropzone
                onDrop={this.handleChangeFile}
                onClick={this.handleChangeFile}
                hexcolor='#ffa500'
                preview={state.uploadFilePreview}
                filename={state.uploadFile ? state.uploadFile.name : ''}
              />

              <div className='d-flex' >
                <button type='button'
                  className='guestupload__card__form__btn btn btn-primary ml-auto'
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

const mapStateToProps = ({ contentType }) => ({ contentType })
export default connect(mapStateToProps)(translate()(GuestUpload))
