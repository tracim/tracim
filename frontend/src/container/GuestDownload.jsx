import React from 'react'
import { translate } from 'react-i18next'
import { Popover, PopoverBody } from 'reactstrap'
import Card from '../component/common/Card/Card.jsx'
import CardHeader from '../component/common/Card/CardHeader.jsx'
import CardBody from '../component/common/Card/CardBody.jsx'
import Button from '../component/common/Input/Button.jsx'
import InputGroupText from '../component/common/Input/InputGroupText.jsx'
import FooterLogin from '../component/Login/FooterLogin.jsx'

class GuestDownload extends React.Component {
  constructor (props) {
    super(props)
    this.popoverToggle = this.popoverToggle.bind(this)
    this.state = {
      popoverOpen: false,
      userName: 'USER',
      file: {
        fileName: 'FILE',
        fileSize: 0
      },
      guestPassword: {
        value: '',
        isInvalid: false
      }
    }
  }

  popoverToggle () {
    this.setState({
      popoverOpen: !this.state.popoverOpen
    })
  }

  handleChangePassword = e => this.setState({guestPassword: {...this.state.guestPassword, value: e.target.value}})

  handleClickDownload = () => {}

  render () {
    const { props, state } = this

    return (
      <section className='guestdownload'>
        <Card customClass='guestdownload__card'>
          <CardHeader customClass='guestdownload__card__header primaryColorBgLighten'>
            {props.t('Download file')}
          </CardHeader>

          <CardBody formClass='guestdownload__card__form'>
            <form>
              <div className='guestdownload__card__form__text'>
                {props.t('{{userName}} shared with you the file {{fileName}}',
                  {userName: state.userName, fileName: state.file.fileName, interpolation: {escapeValue: false}}
                )} ({state.file.fileSize})
              </div>
              <div className='d-flex'>
                <InputGroupText
                  parentClassName='guestdownload__card__form__groupepw'
                  customClass=''
                  icon='fa-lock'
                  type='password'
                  placeHolder={props.t('Password')}
                  invalidMsg={props.t('Invalid password')}
                  isInvalid={state.guestPassword.isInvalid}
                  value={state.guestPassword.value}
                  onChange={this.handleChangePassword}
                />
                <button
                  type='button'
                  className='guestupload__card__form__groupepw__question mb-3'
                  id='popoverQuestion'
                >
                  <i className='fa fa-fw fa-question-circle' />
                </button>
                <Popover placement='bottom' isOpen={this.state.popoverOpen} target='popoverQuestion' toggle={this.popoverToggle}>
                  <PopoverBody>{props.t('The person who sent you this file protected it with a password. If you do not know the password, please contact her.')}</PopoverBody>
                </Popover>
              </div>
              <div className='d-flex'>
                <Button
                  htmlType='button'
                  bootstrapType=''
                  customClass='guestupload__card__form__btndownload btn highlightBtn primaryColorBg primaryColorBgDarkenHover ml-auto'
                  label={props.t('Download')}
                  onClick={this.handleClickDownload}
                />
              </div>
            </form>
          </CardBody>
        </Card>

        <FooterLogin />
      </section>
    )
  }
}
export default translate()(GuestDownload)
