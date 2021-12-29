import React from 'react'
import { translate } from 'react-i18next'
import InputGroupText from '../common/Input/InputGroupText.jsx'
import InputTextArea from '../common/Input/InputTextArea.jsx'
import {
  IconButton,
  FileDropzone,
  FileUploadList,
  Popover
} from 'tracim_frontend_lib'

class UploadForm extends React.Component {
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
                targetId='popoverPasswordInfo'
                popoverBody={props.t('The person who sent you this file protected it with a password. If you do not know the password, please contact her.')}
              />
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

          <IconButton
            customClass='guestupload__card__form__right__btn'
            intent='primary'
            mode='light'
            disabled={this.sendButtonIsDisabled()}
            onClick={props.onClickSend}
            icon='far fa-paper-plane'
            text={props.t('Send')}
          />
        </div>
      </form>
    )
  }
}

export default translate()(UploadForm)
