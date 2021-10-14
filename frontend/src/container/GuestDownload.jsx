import React from 'react'
import { translate } from 'react-i18next'
import { connect } from 'react-redux'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'
import DownloadForm from '../component/GuestPage/DownloadForm.jsx'
import { setHeadTitle } from '../action-creator.sync.js'
import {
  getFileInfos
} from '../action-creator.async.js'
import {
  displayFileSize,
  handleFetchResult,
  sendGlobalFlashMessage,
  CUSTOM_EVENT,
  PAGE
} from 'tracim_frontend_lib'

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
          case 1007: sendGlobalFlashMessage(props.t('Error, this link is invalid or has expired')); break
          default: sendGlobalFlashMessage(props.t('Error in the URL')); break
        }
        props.history.push(PAGE.LOGIN)
        break
      default:
        sendGlobalFlashMessage(props.t('Error while loading file information'))
        props.history.push(PAGE.LOGIN)
    }
  }

  componentDidUpdate (prevProps) {
    const { props } = this

    if (prevProps.system.config.instance_name !== props.system.config.instance_name) {
      this.setHeadTitle()
    }
  }

  setHeadTitle = () => {
    const { props } = this
    props.dispatch(setHeadTitle(props.t('Public download')))
  }

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
              downloadUrl={`/api/public/guest-download/${props.match.params.token}/${state.file.fileName}`}
              onDownloadSubmitted={this.handleDownloadSubmitted}
            />
          </CardBody>
        </Card>

        <FooterLogin />
      </section>
    )
  }
}

const mapStateToProps = ({ system }) => ({ system })

export default connect(mapStateToProps)(translate()(GuestDownload))
