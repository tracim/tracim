import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import { Popover, PopoverBody } from 'reactstrap'
import { generateRandomPassword, ComposedIcon } from 'tracim_frontend_lib'
import { isMobile } from 'react-device-detect'
import PropTypes from 'prop-types'

const color = require('color')

export class NewUpload extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      popoverMultipleEmailsOpen: false,
      hidePassword: true,
      isPasswordActive: false
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

  handleTogglePasswordActive = () => {
    this.setState(prevState => ({
      isPasswordActive: !prevState.isPasswordActive
    }))
  }

  render () {
    const { props, state } = this
    const customColor = props.customColor

    return (
      <div className='newUpload'>
        <div className='newUpload__title share_folder_advanced__content__title'>
          {props.t('New public upload link')}
        </div>

        <div className='newUpload__email'>
          <textarea
            className='newUpload__email__input form-control'
            placeholder={props.t("Recipient's email addresses")}
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
            <i className='fas fa-fw fa-question-circle' />
          </button>
          <Popover
            placement='bottom'
            isOpen={state.popoverMultipleEmailsOpen}
            target='popoverMultipleEmails'
            // INFO - CH - 20200507 - ignoring rule react/jsx-handler-names for prop bellow because it comes from external lib
            toggle={this.handleTogglePopoverMultipleEmails} // eslint-disable-line react/jsx-handler-names
            trigger={isMobile ? 'focus' : 'hover'}
          >
            <PopoverBody>{props.t('To add multiple recipients, separate the email addresses with a comma, a semicolon or a line break.')}</PopoverBody>
          </Popover>
        </div>

        {(state.isPasswordActive
          ? (
            <div className='newUpload__password'>
              <div className='newUpload__password__active'>
                <div className='newUpload__password__wrapper'>
                  <i className='fas fa-fw fa-lock' />

                  <input
                    type={state.hidePassword ? 'password' : 'text'}
                    className='newUpload__password__input form-control'
                    placeholder={props.t('Password')}
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
                    <i className={state.hidePassword ? 'far fa-fw fa-eye' : 'far fa-fw fa-eye-slash'} />
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
                  <i className='fas fa-fw fa-redo' />
                </button>
              </div>

              <span className='newUpload__password__link' onClick={this.handleTogglePasswordActive}>
                {props.t('Cancel protection by password')}
              </span>
            </div>
          )
          : (
            <div className='newUpload__password'>
              <span className='newUpload__password__link' onClick={this.handleTogglePasswordActive}>
                {props.t('Protect by password')}
              </span>
            </div>
          )
        )}

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
            onClick={() => props.onClickNewUpload(state.isPasswordActive)}
            disabled={props.uploadEmails === '' || (state.isPasswordActive && props.uploadPassword === '')}
          >
            {props.t('Validate')}
          </button>
        </div>

        {!props.emailNotifActivated && (
          <div className='newUpload__emailWarning'>
            <ComposedIcon
              mainIcon='envelope'
              smallIcon='warning'
              smallIconCustomClass='text-danger'
            />
            {props.t('Email notification are disabled, please manually share the link')}
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
