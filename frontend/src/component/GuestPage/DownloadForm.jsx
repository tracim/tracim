import React from 'react'
import { translate } from 'react-i18next'
import { Popover, PopoverBody } from 'reactstrap'
import InputGroupText from '../common/Input/InputGroupText.jsx'

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

  render () {
    const { props } = this

    return (
      <form>
        <div className='guestdownload__card__form__text'>
          {props.t('{{userName}} shared with you the file {{fileName}}',
            { userName: props.userName, fileName: props.file.fileName, interpolation: { escapeValue: false } }
          )} ({props.file.fileSize})
        </div>

        {props.file.isProtected &&
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
            />

            <button
              type='button'
              className='guestdownload__card__form__groupepw__question'
              id='popoverPasswordInfo'
            >
              <i className='fa fa-fw fa-question-circle' />
            </button>

            <Popover
              placement='bottom'
              isOpen={this.state.popoverPasswordInfoOpen}
              target='popoverPasswordInfo'
              toggle={this.handleTogglePopoverPasswordInfo}
            >
              <PopoverBody>
                {props.t('The person who sent you this file protected it with a password. If you do not know the password, please contact her.')}
              </PopoverBody>
            </Popover>
          </div>
        }
        <div className='d-flex'>
          <a
            className='btn highlightBtn primaryColorBg primaryColorBgDarkenHover guestdownload__card__form__right__btn'
            href={props.onDownloadFile()}
            target='_blank'
            download
          >
            {props.t('Download')}
          </a>
        </div>
      </form>
    )
  }
}
export default translate()(DownloadForm)
