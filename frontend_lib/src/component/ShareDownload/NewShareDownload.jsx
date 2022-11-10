import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import { generateRandomPassword } from '../../helper.js'
import ComposedIcon from '../Icon/ComposedIcon.jsx'
import IconButton from '../Button/IconButton.jsx'
import Popover from '../Popover/Popover.jsx'

export class NewShareDownload extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      isPasswordActive: false,
      hidePassword: true
    }
  }

  handleTogglePasswordVisibility = () => {
    this.setState(prevState => ({
      hidePassword: !prevState.hidePassword
    }))
  }

  handleRandomPassword = () => {
    this.props.onChangePassword({ target: { value: generateRandomPassword() } })
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

    return (
      <div className='shareDownload__new'>
        <div className='shareDownload__title'>
          {props.t('New share')}
        </div>

        <div className='shareDownload__email'>
          <textarea
            className='shareDownload__email__input form-control'
            placeholder={props.t("Recipient's email addresses")}
            rows='1'
            value={props.shareEmails}
            onChange={props.onChangeEmails}
            onKeyDown={props.onKeyDownEnter}
          />

          <button
            type='button'
            className='shareDownload__email__icon'
            id='popoverMultipleEmails'
            key='share_emails'
            style={{ ':hover': { color: props.hexcolor } }}
          >
            <i className='fas fa-fw fa-question-circle' />
          </button>

          <Popover
            targetId='popoverMultipleEmails'
            popoverBody={props.t('To add multiple recipients, separate the email addresses with a comma, a semicolon or a line break.')}
          />
        </div>

        {state.isPasswordActive
          ? (
            <div className='shareDownload__password'>
              <div className='shareDownload__password__active'>
                <div className='shareDownload__password__wrapper'>
                  <i className='fas fa-fw fa-lock' />

                  <input
                    type={state.hidePassword ? 'password' : 'text'}
                    className='shareDownload__password__input form-control'
                    placeholder={props.t('Password')}
                    value={props.sharePassword}
                    onChange={props.onChangePassword}
                    onFocus={props.onKeyDownEnter}
                  />

                  <button
                    type='button'
                    className='shareDownload__password__icon'
                    key='seeSharePassword'
                    title={props.t('Show password')}
                    style={{ ':hover': { color: props.hexcolor } }}
                    data-cy='seePassword'
                    onClick={this.handleTogglePasswordVisibility}
                  >
                    <i className={state.hidePassword ? 'far fa-fw fa-eye' : 'far fa-fw fa-eye-slash'} />
                  </button>
                </div>

                <button
                  type='button'
                  className='shareDownload__password__icon shareDownload__password__icon__random'
                  key='randomSharePassword'
                  title={props.t('Generate random password')}
                  style={{ ':hover': { color: props.hexcolor } }}
                  onClick={this.handleRandomPassword}
                >
                  <i className='fas fa-fw fa-redo' />
                </button>
              </div>
              <span className='shareDownload__password__link' onClick={this.handleTogglePasswordActive}>
                {props.t('Cancel protection by password')}
              </span>
            </div>
          )
          : (
            <div className='shareDownload__password'>
              <span className='shareDownload__password__link' onClick={this.handleTogglePasswordActive}>
                {props.t('Protect by password')}
              </span>
            </div>
          )}

        <div className='shareDownload__buttons'>
          <IconButton
            customClass='shareDownload__buttons__cancel'
            color={props.hexcolor}
            icon='fas fa-times'
            key='cancelNewShare'
            onClick={props.onClickCancelButton}
            text={props.t('Cancel')}
          />

          <IconButton
            customClass='shareDownload__buttons__newBtn'
            color={props.hexcolor}
            disabled={props.shareEmails === '' || (state.isPasswordActive && props.sharePassword === '')}
            icon='fas fa-check'
            intent='primary'
            key='newShareDownload'
            mode='light'
            onClick={() => props.onClickNewShare(state.isPasswordActive)}
            text={props.t('Validate')}
          />
        </div>

        {!props.isEmailNotifActivated && (
          <div className='shareDownload__emailWarning'>
            <ComposedIcon
              mainIcon='far fa-envelope'
              smallIcon='fas fa-exclamation-triangle'
              smallIconCustomClass='text-danger'
            />
            {props.t('Email notification are disabled, please manually share the link')}
          </div>
        )}
      </div>
    )
  }
}

export default translate()(Radium(NewShareDownload))
