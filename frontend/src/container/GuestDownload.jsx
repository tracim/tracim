import React from 'react'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'

class GuestDownload extends React.Component {
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
      <section className='guestdownload primaryColorBg'>
        <Card customClass='guestdownload__card'>
          <CardHeader customClass='guestdownload__card__header primaryColorBgLighten'>
            {props.t('Download files')}
          </CardHeader>

          <CardBody formClass='guestdownload__card__form'>
            <form>
              <InputGroupText
                parentClassName='guestdownload__card__form__fullname'
                customClass='mb-3'
                type='text'
                placeHolder={props.t('Full name')}
                value={state.guestName}
                onChange={this.handleChangeFullName}
              />
            </form>
          </CardBody>
        </Card>

        <FooterLogin />
      </section>
    )
  }
}

const mapStateToProps = ({ contentType }) => ({ contentType })
export default connect(mapStateToProps)(translate()(GuestDownload))
