import React from 'react'
import { translate } from 'react-i18next'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import DownloadForm from '../component/GuestPage/DownloadForm.jsx'
import {
  getFileInfos
} from '../action-creator.async.js'
import {
  displayFileSize,
  handleFetchResult,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import { PAGE } from '../helper.js'

class GuestDownload extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      userName: '',
      file: {
        fileName: '',
        fileSize: 0,
        fileId: 0,
        isProtected: false
      },
      guestPassword: {
        value: '',
        isInvalid: false
      }
    }
  }

  async componentDidMount () {
    const { props } = this
    const request = await getFileInfos(props.match.params.token)
    const response = await handleFetchResult(request)

    switch (response.apiResponse.status) {
      case 200:
        this.setState({
          file: {
            fileName: response.body.content_filename,
            fileSize: displayFileSize(response.body.content_size),
            fileId: response.body.content_id,
            isProtected: response.body.has_password
          },
          userName: response.body.author.public_name
        })
        break
      case 400:
        switch (response.body.code) {
          case 1007: this.sendGlobalFlashMessage(props.t('Error, this link is invalid or has expired')); break
          default: this.sendGlobalFlashMessage(props.t('Error in the URL')); break
        }
        props.history.push(PAGE.LOGIN)
        break
      default:
        this.sendGlobalFlashMessage(props.t('Error while loading file information'))
        props.history.push(PAGE.LOGIN)
    }
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: CUSTOM_EVENT.ADD_FLASH_MSG,
    data: {
      msg: this.props.t(msg),
      type: 'warning',
      delay: undefined
    }
  })

  handleChangePassword = e => this.setState({ guestPassword: { ...this.state.guestPassword, value: e.target.value } })

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
              token={props.match.params.token}
              downloadUrl={`/api/v2/public/guest-download/${props.match.params.token}/${state.file.fileName}`}
              onDownloadSubmitted={this.handleDownloadSubmitted}
            />
          </CardBody>
        </Card>

        <FooterLogin />
      </section>
    )
  }
}
export default translate()(GuestDownload)
