import React from 'react'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
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
    this.state = {
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

  handleChangeFullName = e => this.setState({guestName: e.target.value})
  handleChangeComment = e => this.setState({guestComment: e.target.value})
  handleChangePassword = e => this.setState({guestPassword: {...this.state.guestPassword, value: e.target.value}})

  handleClickSend = () => {}

  nada = () => {}

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
                  className='guestupload__card__form__groupepw__question mb-3'
                  data-toggle='popover'
                  data-content='test'
                >
                  <i className='fa fa-fw fa-question-circle' />
                </button>
              </div>

              <FileDropzone
                onDrop={this.nada()}
                onClick={this.nada()}
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
