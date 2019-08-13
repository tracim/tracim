import React from 'react'
import { translate } from 'react-i18next'
import { Popover, PopoverBody } from 'reactstrap'
import InputGroupText from '../common/Input/InputGroupText.jsx'
import InputTextArea from '../common/Input/InputTextArea.jsx'
import { FileDropzone, displayFileSize } from 'tracim_frontend_lib'

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

  render () {
    const { props } = this

    return (
      <form className='d-flex'>
        <div className='guestupload__card__form__left'>
          <InputGroupText
            parentClassName='guestupload__card__form__fullname'
            customClass=''
            type='text'
            placeHolder={props.t('Full name')}
            value={props.guestName}
            onChange={props.onChangeFullName}
          />

          <div className='d-flex'>
            <InputGroupText
              parentClassName='guestupload__card__form__groupepw'
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
              className='guestupload__card__form__groupepw__question'
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
              <PopoverBody>{props.t('The person who sent you this file protected it with a password. If you do not know the password, please contact her.')}</PopoverBody>
            </Popover>
          </div>

          <InputTextArea
            placeHolder={props.t('Leave a message with your file(s) if you wish. Feel free to leave your contact details if you wish to be contacted again.')}
            numberRows={props.uploadFileList.length > 4 ? '20' : '15'}
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

          <div className='font-weight-bold'>
            {props.uploadFileList.length > 0
              ? props.t('Attached files')
              : props.t('You have not yet chosen any files to upload.')
            }
          </div>

          <div className='guestupload__card__form__right__files'>
            {props.uploadFileList.map(file =>
              <div className='d-flex' key={file.name}>
                <i className='fa fa-fw fa-file-o m-1' />

                {file.name} ({displayFileSize(file.size)})

                <button
                  className='iconBtn ml-auto primaryColorFontHover'
                  onClick={() => props.onDeleteFile(file)}
                  title={props.t('Delete')}
                >
                  <i className='fa fa-fw fa-trash-o' />
                </button>
              </div>
            )}
          </div>

          <button type='button'
            className='guestupload__card__form__right__btn btn highlightBtn primaryColorBg primaryColorBgDarkenHover'
            onClick={props.onClickSend}
          >
            {props.t('Send')} <i className='fa fa-fw fa-paper-plane-o' />
          </button>
        </div>
      </form>
    )
  }
}

export default translate()(UploadForm)
