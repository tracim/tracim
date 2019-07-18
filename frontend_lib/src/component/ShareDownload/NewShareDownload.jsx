import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import Radium from 'radium'
import color from 'color'
import { Popover, PopoverBody } from 'reactstrap'
import { generateRandomPassword } from '../../helper.js'

class NewShareDownload extends React.Component {
  constructor (props) {
    super(props)
    this.popoverToggle = this.popoverToggle.bind(this)
    this.state = {
      passwordActive: false,
      popoverOpen: false,
      hidePassword: true
    }
  }

  popoverToggle () {
    this.setState({
      popoverOpen: !this.state.popoverOpen
    })
  }

  handleSeePassword = () => {
    const passwordInput = document.getElementsByClassName('shareDownload__password__input')[0]
    this.setState({hidePassword: !this.state.hidePassword})
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text'
    } else {
      passwordInput.type = 'password'
    }
  }

  handleRandomPassword = () => {
    this.props.sharePassword = generateRandomPassword()
    const passwordInput = document.getElementsByClassName('shareDownload__password__input')[0]
    if (passwordInput.type === 'password') {
      this.handleSeePassword()
    }
  }

  handlehidePassword = () => {
    this.setState({passwordActive: true})
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
            type='text'
            className='shareDownload__email__input form-control'
            placeholder={props.t('Enter the email address of the recipient(s)')}
            rows='10'
            value={props.shareEmails}
            onChange={props.onChangeEmails}
            onKeyDown={props.convertSpaceAndCommaToNewLines}
          />
          <button
            type='button'
            className='shareDownload__email__icon'
            id='popoverMultipleEmails'
            key='share_emails'
            style={{':hover': {color: props.hexcolor}}}
          >
            <i className='fa fa-fw fa-question-circle' />
          </button>
          <Popover placement='bottom' isOpen={state.popoverOpen} target='popoverMultipleEmails' toggle={this.popoverToggle}>
            <PopoverBody>{props.t('To add multiple recipients, separate the email addresses with a comma or space.')}</PopoverBody>
          </Popover>
        </div>

        {state.passwordActive
        ? <div className='shareDownload__password'>
          <div className='shareDownload__password__wrapper'>
            <i className='fa fa-fw fa-lock' />
            <button
              type='button'
              className='shareDownload__password__icon'
              key='see_share_password'
              title={props.t('Show password')}
              style={{':hover': {color: props.hexcolor}}}
              onClick={this.handleSeePassword}
            >
              <i className={state.hidePassword ? 'fa fa-fw fa-eye' : 'fa fa-fw fa-eye-slash'} />
            </button>
            <input
              type={state.hidePassword ? 'password' : 'text'}
              className='shareDownload__password__input form-control'
              placeholder={props.t('Password to share link (optional)')}
              value={props.sharePassword}
              onChange={props.onChangePassword}
              onFocus={props.convertSpaceAndCommaToNewLines}
            />
          </div>
          <button
            type='button'
            className='shareDownload__password__icon'
            key='random_share_password'
            title={props.t('Generate random password')}
            style={{':hover': {color: props.hexcolor}}}
            onClick={this.handleRandomPassword}
          >
            <i className='fa fa-fw fa-repeat' />
          </button>
        </div>
        : <div className='shareDownload__password'>
          <span className='shareDownload__password__link' onClick={this.handlehidePassword}>
            {props.t('Protect by password')}
          </span>
        </div>
        }
        <div className='d-flex mt-3'>
          <button
            className='shareDownload__cancel btn outlineTextBtn'
            key='cancelNewShare'
            onClick={props.onClickReturnToManagement}
            style={{
              borderColor: props.hexcolor,
              ':hover': {
                backgroundColor: props.hexcolor
              }
            }}
          >
            {props.t('Cancel')}
            <i className='fa fa-fw fa-times' />
          </button>

          <button
            className='btn highlightBtn'
            key='newShareDownload'
            onClick={props.onClickReturnToManagement}
            style={{
              backgroundColor: props.hexcolor,
              ':hover': {
                backgroundColor: color(props.hexcolor).darken(0.15).hexString()
              }
            }}
          >
            {props.t('New')}
            <i className='fa fa-fw fa-plus-circle' />
          </button>
        </div>
      </div>
    )
  }
}

export default translate()(Radium(NewShareDownload))
