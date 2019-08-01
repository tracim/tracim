import React from 'react'
import { withTranslation } from 'react-i18next'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import DownloadForm from '../component/GuestPage/DownloadForm.jsx'

class GuestDownload extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      userName: '',
      file: {
        fileName: '',
        fileSize: 0
      },
      guestPassword: {
        value: '',
        isInvalid: false
      }
    }
  }

  handleChangePassword = e => this.setState({ guestPassword: { ...this.state.guestPassword, value: e.target.value } })

  handleClickDownload = () => {}

  render () {
    const { props, state } = this

    return (
      <section className='guestdownload'>
        <Card customClass='guestdownload__card'>
          <CardHeader customClass='guestdownload__card__header primaryColorBgLighten'>
            {props.t('Download file')}
          </CardHeader>

          <CardBody formClass='guestdownload__card__form'>
            <DownloadForm
              userName={state.userName}
              file={state.file}
              guestPassword={state.guestPassword}
              onChangePassword={this.handleChangePassword}
              onClickDownload={this.handleClickDownload}
            />
          </CardBody>
        </Card>

        <FooterLogin />
      </section>
    )
  }
}
export default withTranslation()(GuestDownload)
