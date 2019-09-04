import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import { Popover, PopoverBody } from 'reactstrap'
import { generateRandomPassword, ComposedIcon } from 'tracim_frontend_lib'
import { isMobile } from 'react-device-detect'
import PropTypes from 'prop-types'

const color = require('color')

class NewUpload extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      popoverMultipleEmailsOpen: false,
      hidePassword: true
    }
  }

  handleTogglePopoverMultipleEmails = () => {
    this.setState(prevState => ({
      popoverMultipleEmailsOpen: !prevState.popoverMultipleEmailsOpen
    }))
  }

  handleTogglePasswordVisibility = () => {
    this.setState(prevState => ({
      hidePassword: !prevState.hidePassword
    }))
  }

  handleRandomPassword = () => {
    this.props.onChangeUploadPassword({ target: { value: generateRandomPassword() } })

    if (this.state.hidePassword) {
      this.handleTogglePasswordVisibility()
    }
  }

  render () {
    const { props, state } = this
    const customColor = props.customColor
    const passwordType = 'password'
    const textType = 'text'

    return (
      <div className='newUpload'>
        <div className='newUpload__title share_folder_advanced__content__title'>
          {props.t('New authorization')}
        </div>

        <div className='newUpload__email'>
          <textarea
            type={textType}
            className='newUpload__email__input form-control'
            placeholder={props.t('Enter the email address of the recipient(s)')}
            rows='1'
            value={props.uploadEmails}
            onChange={props.onChangeUploadEmails}
            onKeyDown={props.onKeyDownEnter}
          />
          <button
            type='button'
            className='newUpload__email__icon'
            id='popoverMultipleEmails'
            key='uploadEmails'
            style={{ ':hover': { color: customColor } }}
          >
            <i className='fa fa-fw fa-question-circle' />
          </button>
          <Popover
            placement='bottom'
            isOpen={state.popoverMultipleEmailsOpen}
            target='popoverMultipleEmails'
            toggle={this.handleTogglePopoverMultipleEmails}
            trigger={isMobile ? 'focus' : 'hover'}
          >
            <PopoverBody>{props.t('To add multiple recipients, separate the email addresses with a comma or space.')}</PopoverBody>
          </Popover>
        </div>

        <div className='newUpload__password'>
          <div className='newUpload__password__wrapper'>
            <i className='fa fa-fw fa-lock' />
            <input
              type={state.hidePassword ? passwordType : textType}
              className='newUpload__password__input form-control'
              placeholder={props.t('Password to share link (optional)')}
              value={props.uploadPassword}
              onChange={props.onChangeUploadPassword}
            />
            <button
              type='button'
              className='newUpload__password__icon'
              key='seeuploadPassword'
              title={props.t('Show password')}
              style={{ ':hover': { color: customColor } }}
              data-cy='seePassword'
              onClick={this.handleTogglePasswordVisibility}
            >
              <i className={state.hidePassword ? 'fa fa-fw fa-eye' : 'fa fa-fw fa-eye-slash'} />
            </button>
          </div>
          <button
            type='button'
            className='newUpload__password__icon'
            key='randomuploadPassword'
            title={props.t('Generate random password')}
            style={{ ':hover': { color: customColor } }}
            onClick={this.handleRandomPassword}
          >
            <i className='fa fa-fw fa-repeat' />
          </button>
        </div>

        <div className='d-flex'>
          <button
            className='newUpload__btnCancel btn outlineTextBtn'
            key='deleteAllShares'
            style={{
              borderColor: customColor,
              ':hover': {
                backgroundColor: customColor
              }
            }}
            onClick={props.onClickCancelNewUpload}
          >
            {props.t('Cancel')}
            <i className='fa fa-fw fa-times' />
          </button>
          <button
            className='newUpload__newBtn btn highlightBtn'
            key='newShareFile'
            style={{
              backgroundColor: customColor,
              ':hover': {
                backgroundColor: color(customColor).darken(0.15).hex()
              }
            }}
            onClick={props.onClickNewUpload}
            disabled={props.uploadEmails === ''}
          >
            {props.t('New')}
            <i className='fa fa-fw fa-plus-circle' />
          </button>
        </div>

        {!props.emailNotifActivated && (
          <div className='newUpload__emailWarning'>
            <ComposedIcon
              mainIcon='envelope'
              smallIcon='warning'
              smallIconCustomClass='text-danger'
            />
            {props.t('Email notification are disabled, please manually notify the link')}
          </div>
        )}
      </div>
    )
  }
}

export default translate()(Radium(NewUpload))

NewUpload.propTypes = {
  uploadLinkList: PropTypes.array.isRequired,
  customColor: PropTypes.string,
  uploadEmails: PropTypes.string,
  onChangeUploadEmails: PropTypes.func,
  onKeyDownEnter: PropTypes.func,
  uploadPassword: PropTypes.string,
  onChangeUploadPassword: PropTypes.func,
  onClickCancelNewUpload: PropTypes.func,
  onClickNewUpload: PropTypes.func
}

NewUpload.defaultProps = {
  customColor: '',
  uploadEmails: '',
  onChangeUploadEmails: () => {},
  onKeyDownEnter: () => {},
  uploadPassword: '',
  onChangeUploadPassword: () => {},
  onClickCancelNewUpload: () => {},
  onClickNewUpload: () => {}
}
