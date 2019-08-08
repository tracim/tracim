import React from 'react'
import { translate } from 'react-i18next'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import DownloadForm from '../component/GuestPage/DownloadForm.jsx'
import { getFileInfos } from '../action-creator.async.js'
import { displayFileSize } from 'tracim_frontend_lib'

class GuestDownload extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      userName: '',
      file: {
        fileName: '',
        fileSize: 0,
        fileId: 0
      },
      guestPassword: {
        value: '',
        isInvalid: false
      }
    }
  }

  async componentDidMount () {
    const { props } = this

    const fetchResultFileInfos = getFileInfos(props.match.params.token)

    switch (fetchResultFileInfos.status) {
      case 204:
        this.setState({
          fileName: fetchResultFileInfos.json.file_name,
          fileSize: displayFileSize(fetchResultFileInfos.json.file_size),
          fileId: fetchResultFileInfos.json.file_id,
          userName: fetchResultFileInfos.json.user_name
        })
        break
      default: this.sendGlobalFlashMsg(props.t('Error while loading file infos', 'warning'))
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
export default translate()(GuestDownload)
