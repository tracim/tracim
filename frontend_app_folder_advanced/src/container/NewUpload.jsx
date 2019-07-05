import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import color from 'color'
import { Popover, PopoverBody } from 'reactstrap'

class NewUpload extends React.Component {
  constructor (props) {
    super(props)
    this.toggle = this.toggle.bind(this)
    this.state = {
      popoverOpen: false,
      emails: '',
      password: ''
    }
  }

  toggle () {
    this.setState({
      popoverOpen: !this.state.popoverOpen
    })
  }

  handleChangeEmails = e => this.setState({emails: e.target.value})
  handleChangePassword = e => this.setState({password: e.target.value})

  handleSeePassword = () => {
    const passwordInput = document.getElementsByClassName('newUpload__password__input')[0]
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
  }

  render () {
    const { props } = this
    const customColor = props.tracimContentTypeList[1] ? props.tracimContentTypeList[1].hexcolor : props.customColor

    return (
      <div className='folder_advanced-content'>
        <div className='formBlock folder_advanced__content py-2 px-4'>
          <div className='formBlock__title folder_advanced__content__title'>
            {props.t('New authorization')}
          </div>

          <div className='newUpload__email'>
            <input
              type='text'
              className='newUpload__email__input form-control'
              placeholder={props.t('Enter the email address of the recipient(s)')}
              value={this.state.emails}
              onChange={this.handleChangeEmails}
              onKeyDown={() => {}}
            />
            <button
              type='button'
              className='newUpload__email__icon'
              id='popoverMultipleEmails'
              key='share_emails'
              style={{':hover': {color: customColor}}}
            >
              <i className='fa fa-fw fa-question-circle' />
            </button>
            <Popover placement='bottom' isOpen={this.state.popoverOpen} target='popoverMultipleEmails' toggle={this.toggle}>
              <PopoverBody>{props.t('To add multiple recipients, separate the email addresses with a comma or space, leave this field blank if you want to create a public link.')}</PopoverBody>
            </Popover>
          </div>

          <div className='newUpload__password'>
            <div className='newUpload__password__wrapper'>
              <i className='fa fa-fw fa-lock' />
              <button
                type='button'
                className='newUpload__password__icon'
                key='see_share_password'
                style={{':hover': {color: customColor}}}
                onClick={this.handleSeePassword}
              >
                <i id='seePasswordIcon' className='fa fa-fw fa-eye' />
              </button>
              <input
                type='password'
                className='newUpload__password__input form-control'
                placeholder={props.t('Password to share link (optional)')}
                value={this.state.password}
                onChange={this.handleChangePassword}
                onKeyDown={() => {}}
              />
            </div>
            <button
              type='button'
              className='newUpload__password__icon'
              key='random_share_password'
              style={{':hover': {color: customColor}}}
              onClick={this.handleRandomPassword}
            >
              <i className='fa fa-fw fa-repeat' />
            </button>
          </div>

          <div className='d-flex'>
            <button
              className='btn outlineTextBtn d-flex mt-3 mr-3 ml-auto'
              key='delete_all_shares'
              style={{
                borderColor: customColor,
                ':hover': {
                  backgroundColor: customColor
                }
              }}
            >
              {props.t('Delete all')}
              <i className='fa fa-fw fa-trash-o' />
            </button>
            <button
              className='btn highlightBtn mt-3'
              key='new_share_file'
              style={{
                backgroundColor: customColor,
                ':hover': {
                  backgroundColor: color(customColor).darken(0.15).hexString()
                }
              }}
            >
              {props.t('New')}
              <i className='fa fa-fw fa-plus-circle' />
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default translate()(Radium(NewUpload))
