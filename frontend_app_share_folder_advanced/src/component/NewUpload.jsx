// TODO - G.B. - This component is a wip because it's waiting the backend 
// https://github.com/tracim/tracim/issues/2126

import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import { Popover, PopoverBody } from 'reactstrap'
import { generateRandomPassword } from 'tracim_frontend_lib'
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
    this.props.onChangeSharePassword({ target: { value: generateRandomPassword() } })

    if (this.state.hidePassword) {
      this.handleTogglePasswordVisibility()
    }
  }

  render () {
    const { props, state } = this
    const customColor = props.customColor

    return (
      <div className='newUpload'>
        <div className='newUpload__title share_folder_advanced__content__title'>
          {props.t('New authorization')}
        </div>

        <div className='newUpload__email'>
          <textarea
            type='text'
            className='newUpload__email__input form-control'
            placeholder={props.t('Enter the email address of the recipient(s)')}
            rows='10'
            value={props.shareEmails}
            onChange={props.onChangeShareEmails}
            onKeyDown={props.onKeyDownEnter}
          />
          <button
            type='button'
            className='newUpload__email__icon'
            id='popoverMultipleEmails'
            key='shareEmails'
            style={{ ':hover': { color: customColor } }}
          >
            <i className='fa fa-fw fa-question-circle' />
          </button>
          <Popover
            placement='bottom'
            isOpen={state.popoverMultipleEmailsOpen}
            target='popoverMultipleEmails'
            toggle={this.handleTogglePopoverMultipleEmails}
          >
            <PopoverBody>{props.t('To add multiple recipients, separate the email addresses with a comma or space.')}</PopoverBody>
          </Popover>
        </div>

        <div className='newUpload__password'>
          <div className='newUpload__password__wrapper'>
            <i className='fa fa-fw fa-lock' />
            <input
              type={state.hidePassword ? 'password' : 'text'}
              className='newUpload__password__input form-control'
              placeholder={props.t('Password to share link (optional)')}
              value={props.sharePassword}
              onChange={props.onChangeSharePassword}
            />
            <button
              type='button'
              className='newUpload__password__icon'
              key='seeSharePassword'
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
            key='randomSharePassword'
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
            disabled={props.shareEmails === ''}
          >
            {props.t('New')}
            <i className='fa fa-fw fa-plus-circle' />
          </button>
        </div>
      </div>
    )
  }
}

export default translate()(Radium(NewUpload))

NewUpload.propTypes = {
  // shareLinkList: PropTypes.array.isRequired,
  customColor: PropTypes.string,
  shareEmails: PropTypes.string,
  onChangeShareEmails: PropTypes.func,
  onKeyDownEnter: PropTypes.func,
  sharePassword: PropTypes.string,
  onChangeSharePassword: PropTypes.func,
  onClickCancelNewUpload: PropTypes.func,
  onClickNewUpload: PropTypes.func
}

NewUpload.defaultProps = {
  customColor: '',
  shareEmails: '',
  onChangeShareEmails: () => {},
  onKeyDownEnter: () => {},
  sharePassword: '',
  onChangeSharePassword: () => {},
  onClickCancelNewUpload: () => {},
  onClickNewUpload: () => {}
}
