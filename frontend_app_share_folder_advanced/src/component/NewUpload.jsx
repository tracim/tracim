import React from 'react'
import { translate } from 'react-i18next'
import Radium from 'radium'
import color from 'color'
import { Popover, PopoverBody } from 'reactstrap'
import { generateRandomPassword } from 'tracim_frontend_lib'
import PropTypes from 'prop-types'

class NewUpload extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      popoverOpen: false,
      hidePassword: true
    }
  }

  popoverToggle = () => {
    this.setState({
      popoverOpen: !this.state.popoverOpen
    })
  }

  handleSeePassword = () => {
    this.setState({hidePassword: !this.state.hidePassword})
  }

  handleRandomPassword = () => {
    this.props.onChangeSharePassword = generateRandomPassword()
    const passwordInput = document.getElementsByClassName('newUpload__password__input')[0]

    if (passwordInput.type === 'password') {
      this.handleSeePassword()
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
            onKeyDown={props.convertSpaceAndCommaToNewLines}
          />
          <button
            type='button'
            className='newUpload__email__icon'
            id='popoverMultipleEmails'
            key='shareEmails'
            style={{':hover': {color: customColor}}}
          >
            <i className='fa fa-fw fa-question-circle' />
          </button>
          <Popover placement='bottom' isOpen={state.popoverOpen} target='popoverMultipleEmails' toggle={this.popoverToggle}>
            <PopoverBody>{props.t('To add multiple recipients, separate the email addresses with a comma or space.')}</PopoverBody>
          </Popover>
        </div>

        <div className='newUpload__password'>
          <div className='newUpload__password__wrapper'>
            <i className='fa fa-fw fa-lock' />
            <button
              type='button'
              className='newUpload__password__icon'
              key='seeSharePassword'
              style={{':hover': {color: customColor}}}
              data-cy='seePassword'
              onClick={this.handleSeePassword}
            >
              <i className={state.hidePassword ? 'fa fa-fw fa-eye' : 'fa fa-fw fa-eye-slash'} />
            </button>
            <input
              type={state.hidePassword ? 'password' : 'text'}
              className='newUpload__password__input form-control'
              placeholder={props.t('Password to share link (optional)')}
              value={props.sharePassword}
              onChange={props.onChangeSharePassword}
            />
          </div>
          <button
            type='button'
            className='newUpload__password__icon'
            key='randomSharePassword'
            style={{':hover': {color: customColor}}}
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
            onClick={props.onClickReturnToManagement}
          >
            {props.t('Cancel')}
            <i className='fa fa-fw fa-times' />
          </button>
          <button
            className='newUpload__btnNew btn highlightBtn'
            key='newShareFile'
            style={{
              backgroundColor: customColor,
              ':hover': {
                backgroundColor: color(customColor).darken(0.15).hexString()
              }
            }}
            onClick={props.onClickNewUpload}
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
  convertSpaceAndCommaToNewLines: PropTypes.func,
  sharePassword: PropTypes.string,
  onChangeSharePassword: PropTypes.func,
  onClickReturnToManagement: PropTypes.func,
  onClickNewUpload: PropTypes.func
}

NewUpload.defaultProps = {
  customColor: '',
  shareEmails: '',
  onChangeShareEmails: () => {},
  convertSpaceAndCommaToNewLines: () => {},
  sharePassword: '',
  onChangeSharePassword: () => {},
  onClickReturnToManagement: () => {},
  onClickNewUpload: () => {}
}
