import React from 'react'
import { translate } from 'react-i18next'
import i18n from '../../i18n.js'
import Radium from 'radium'
import color from 'color'
import { CUSTOM_EVENT } from 'tracim_frontend_lib'
import { Popover, PopoverBody } from 'reactstrap'

require('./ShareFile.styl')

class NewShareFile extends React.Component {
  constructor (props) {
    super(props)
    this.toggle = this.toggle.bind(this)
    this.state = {
      popoverOpen: false,
      emails: '',
      password: ''
    }

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  toggle () {
    this.setState({
      popoverOpen: !this.state.popoverOpen
    })
  }

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<NewShareFile> Custom event', 'color: #28a745', type, data)
        i18n.changeLanguage(data)
        break
    }
  }

  componentWillUnmount () {
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  handleChangeEmails = e => this.setState({emails: e.target.value})
  handleChangePassword = e => this.setState({password: e.target.value})

  handleSeePassword = () => {
    const passwordInput = document.getElementsByClassName('shareFile__password__input')[0]
    const passwordIcon = document.getElementById('seePasswordIcon')
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text'
      passwordIcon.className = 'fa fa-fw fa-eye-slash'
    } else {
      passwordInput.type = 'password'
      passwordIcon.className = 'fa fa-fw fa-eye'
    }
  }

  // INFO - GB - 2019-07-05 - This password generetor function was based on
  // https://stackoverflow.com/questions/5840577/jquery-or-javascript-password-generator-with-at-least-a-capital-and-a-number
  handleRandomPassword = () => {
    let password = []
    let charCode = String.fromCharCode
    let randomNumber = Math.random
    let random, i

    for (i = 0; i < 10; i++) { // password with a size 10
      random = 0 | randomNumber() * 62 // generate upper OR lower OR number
      password.push(charCode(48 + random + (random > 9 ? 7 : 0) + (random > 35 ? 6 : 0)))
    }
    let randomPassword = password.sort(() => { return randomNumber() - 0.5 }).join('')
    this.setState({password: randomPassword})

    const passwordInput = document.getElementsByClassName('shareFile__password__input')[0]
    if (passwordInput.type === 'password') {
      this.handleSeePassword()
    }
  }

  render () {
    const { props } = this

    return (
      <div className='shareFile'>
        <div className='shareFile__title'>
          {props.t('New file share')}
        </div>

        <div className='shareFile__email'>
          <input
            type='text'
            className='shareFile__email__input form-control'
            placeholder={props.t('Enter the email address of the recipient(s)')}
            value={this.state.emails}
            onChange={this.handleChangeEmails}
            onKeyDown={() => {}}
          />
          <button
            type='button'
            className='shareFile__email__icon'
            id='popoverMultipleEmails'
            key='share_emails'
            style={{':hover': {color: props.hexcolor}}}
          >
            <i className='fa fa-fw fa-question-circle' />
          </button>
          <Popover placement='bottom' isOpen={this.state.popoverOpen} target='popoverMultipleEmails' toggle={this.toggle}>
            <PopoverBody>{props.t('To add multiple recipients, separate the email addresses with a comma or space, leave this field blank if you want to create a public link.')}</PopoverBody>
          </Popover>
        </div>

        <div className='shareFile__password'>
          <div className='shareFile__password__wrapper'>
            <i className='fa fa-fw fa-lock' />
            <button
              type='button'
              className='shareFile__password__icon'
              key='see_share_password'
              style={{':hover': {color: props.hexcolor}}}
              onClick={this.handleSeePassword}
            >
              <i id='seePasswordIcon' className='fa fa-fw fa-eye' />
            </button>
            <input
              type='password'
              className='shareFile__password__input form-control'
              placeholder={props.t('Password to share link (optional)')}
              value={this.state.password}
              onChange={this.handleChangePassword}
              onKeyDown={() => {}}
            />
          </div>
          <button
            type='button'
            className='shareFile__password__icon'
            key='random_share_password'
            style={{':hover': {color: props.hexcolor}}}
            onClick={this.handleRandomPassword}
          >
            <i className='fa fa-fw fa-repeat' />
          </button>
        </div>

        <div className='d-flex ml-auto mt-2'>
          <button
            className='btn outlineTextBtn d-flex mr-3'
            key='cancel__new__share'
            onClick={props.onClickReturnToManagement}
            style={{
              borderColor: props.hexcolor,
              ':hover': {
                backgroundColor: props.hexcolor
              }
            }}
          >
            {props.t('Cancel')}
            <i className='fa fa-fw fa-trash-o' />
          </button>

          <button
            className='btn highlightBtn'
            key='new__share__file'
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

export default translate()(Radium(NewShareFile))
