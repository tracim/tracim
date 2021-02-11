import React from 'react'
import { translate } from 'react-i18next'
import { Popover, PopoverBody } from 'reactstrap'
import { isMobile } from 'react-device-detect'
import InputGroupText from '../common/Input/InputGroupText.jsx'
import InputTextArea from '../common/Input/InputTextArea.jsx'
import { FileDropzone, FileUploadList } from 'tracim_frontend_lib'

class UploadForm extends React.Component {
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

  sendButtonIsDisabled = () => {
    const { props } = this
    const guestFullnameIsValid = props.guestFullname.value.length && !props.guestFullname.isInvalid
    const guestPasswordIsValid = !props.hasPassword || (props.guestPassword.value.length && !props.guestPassword.isInvalid)
    const uploadListIsValid = props.fileUploadList.length > 0
    return !(guestPasswordIsValid && guestFullnameIsValid && uploadListIsValid)
  }

  render () {
    const { props } = this

    return (
      <form className='guestupload__card__form__container'>
        <div className='guestupload__card__form__left'>
          <InputGroupText
            parentClassName='guestupload__card__form__fullname'
            customClass=''
            type='text'
            placeHolder={props.t('Full name (required)')}
            value={props.guestFullname.value}
            onChange={props.onChangeFullName}
            isInvalid={props.guestFullname.isInvalid}
            invalidMsg={props.t('Full name is required')}
          />

          {props.hasPassword && (
            <div className='d-flex'>
              <InputGroupText
                parentClassName='guestupload__card__form__groupepw'
                customClass=''
                icon='fa-lock'
                type='password'
                placeHolder={props.t('Password (required)')}
                invalidMsg={props.t('Invalid password')}
                isInvalid={props.guestPassword.isInvalid}
                value={props.guestPassword.value}
                onChange={props.onChangePassword}
              />

              <button
                type='button'
                className='guestupload__card__form__groupepw__question'
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

          <InputTextArea
            placeHolder={props.t('Leave a message with your file(s) if you wish. Feel free to leave your contact details if you wish to be contacted again.')}
            numberRows={props.fileUploadList.length > 4 ? '20' : '15'}
            value={props.guestComment}
            onChange={props.onChangeComment}
          />
        </div>

        <div className='guestupload__card__form__right'>
          <FileDropzone
            onDrop={props.onAddFile}
            onClick={props.onAddFile}
            preview={props.uploadFilePreview}
            multipleFiles
          />

          <FileUploadList
            fileUploadList={props.fileUploadList}
            onDeleteFile={props.onDeleteFile}
            customTitle={props.t('Attached files')}
          />

          <button
            type='button'
            className='guestupload__card__form__right__btn btn highlightBtn primaryColorBg primaryColorBgDarkenHover'
            onClick={props.onClickSend}
            disabled={this.sendButtonIsDisabled()}
          >
            {props.t('Send')} <i className='far fa-fw fa-paper-plane' />
          </button>
        </div>
      </form>
    )
  }
}

export default translate()(UploadForm)
