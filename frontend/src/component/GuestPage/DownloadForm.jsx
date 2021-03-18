import React from 'react'
import { translate } from 'react-i18next'
import { Popover, PopoverBody } from 'reactstrap'
import { isMobile } from 'react-device-detect'
import InputGroupText from '../common/Input/InputGroupText.jsx'
import {
  postDownloadFile
} from '../../action-creator.async.js'
import {
  handleFetchResult,
  sendGlobalFlashMessage
} from 'tracim_frontend_lib'

class DownloadForm extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      popoverPasswordInfoOpen: false
    }
  }

  handleTogglePopoverPasswordInfo = () => {
    this.setState(prevState => ({
      popoverPasswordInfoOpen: !prevState.popoverPasswordInfoOpen
    }))
  }

  handleSubmit = async (e) => {
    const { props } = this

    const guestPassword = props.guestPassword.value !== '' ? props.guestPassword.value : null
    e.preventDefault()
    const request = await postDownloadFile(props.token, guestPassword)
    const response = await handleFetchResult(request)

    // FIXME - G.B. - 2019-08-22 - handleFetch doesn't return the same response everytime, in case of success there is no "apiResponse"
    if (response.apiResponse) {
      switch (response.apiResponse.status) {
        case 204:
          this.refs.test.submit()
          return true
        case 400:
          sendGlobalFlashMessage(props.t('Error in the URL'))
          break
        case 403:
          switch (response.body.code) {
            case 2053:
              sendGlobalFlashMessage(props.t('Invalid password'))
              break
            default:
              sendGlobalFlashMessage(props.t('Error while downloading file'))
          }
          break
        default:
          sendGlobalFlashMessage(props.t('Error while downloading file'))
      }
    } else {
      this.refs.test.submit()
    }
    return false
  }

  handleKeyDown = e => { if (e.key === 'Enter') this.handleSubmit(e) }

  render () {
    const { props } = this

    return (
      <div>
        <form method='post' action={props.downloadUrl} ref='test'>
          <div className='guestdownload__card__form__text'>
            {props.t('{{userName}} shared with you the file {{fileName}}',
              { userName: props.userName, fileName: props.file.fileName, interpolation: { escapeValue: false } }
            )} ({props.file.fileSize})
          </div>

          {props.file.isProtected && (
            <div className='d-flex'>
              <InputGroupText
                parentClassName='guestdownload__card__form__groupepw'
                customClass=''
                icon='fa-lock'
                type='password'
                placeHolder={props.t('Password')}
                invalidMsg={props.t('Invalid password')}
                isInvalid={props.guestPassword.isInvalid}
                value={props.guestPassword.value}
                onChange={props.onChangePassword}
                name='password'
                onKeyDown={this.handleKeyDown}
              />

              <button
                type='button'
                className='guestdownload__card__form__groupepw__question'
                id='popoverPasswordInfo'
              >
                <i className='fas fa-fw fa-question-circle' />
              </button>

              <Popover
                placement='bottom'
                isOpen={this.state.popoverPasswordInfoOpen}
                target='popoverPasswordInfo'
                // INFO - CH - 20200507 - ignoring rule react/jsx-handler-names for prop bellow because it comes from external lib
                toggle={this.handleTogglePopoverPasswordInfo} // eslint-disable-line react/jsx-handler-names
                trigger={isMobile ? 'focus' : 'hover'}
              >
                <PopoverBody>
                  {props.t('The person who sent you this file protected it with a password. If you do not know the password, please contact her.')}
                </PopoverBody>
              </Popover>
            </div>
          )}
        </form>
        <div className='d-flex'>
          {/* INFO - G.B. - 2019-08-22 - This button should be always outside the form, to not trigger the submit. */}
          <button
            className='btn highlightBtn primaryColorBg primaryColorBgDarkenHover guestdownload__card__form__right__btn'
            onClick={this.handleSubmit}
          >
            {props.t('Download')}
          </button>
        </div>
      </div>
    )
  }
}
export default translate()(DownloadForm)
