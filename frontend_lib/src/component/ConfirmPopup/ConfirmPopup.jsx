import React from 'react'
import PropTypes from 'prop-types'
import CardPopup from '../CardPopup/CardPopup.jsx'
import { translate } from 'react-i18next'
import IconButton from '../Button/IconButton.jsx'

// require('./ConfirmPopup.styl') // see https://github.com/tracim/tracim/issues/1156

const ConfirmPopup = (props) => (
  <CardPopup
    customClass='confirm_popup'
    customHeaderClass={props.customColor !== '' ? '' : 'primaryColorBg'}
    customColor={props.customColor !== '' ? props.customColor : ''}
    onClose={props.onClose || props.onCancel}
  >
    <div className='confirm_popup__body'>
      <div className='confirm_popup__body__msg'>
        {props.msg || props.t('Are you sure?')}
      </div>
      <div className='confirm_popup__body__btn'>
        <IconButton
          customClass='confirm_popup__body__btn__item'
          color={props.customColor ? props.customColor : undefined}
          icon={props.cancelIcon}
          text={props.cancelLabel || props.t('Cancel')}
          title={props.cancelLabel || props.t('Cancel')}
          type='button'
          intent='secondary'
          mode='dark'
          disabled={false}
          onClick={props.onCancel}
          dataCy='confirm_popup__button_cancel'
        />

        <IconButton
          customClass='confirm_popup__body__btn__item'
          color={props.customColor ? props.customColor : undefined}
          icon={props.confirmIcon}
          text={props.confirmLabel || props.t('Confirm')}
          title={props.confirmLabel || props.t('Confirm')}
          type='button'
          intent='primary'
          mode='light'
          disabled={false}
          onClick={props.onConfirm}
          dataCy='confirm_popup__button_confirm'
        />
      </div>
    </div>
  </CardPopup>
)

ConfirmPopup.propTypes = {
  cancelLabel: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelIcon: PropTypes.string,
  confirmIcon: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  msg: PropTypes.any,
  customColor: PropTypes.string
}

ConfirmPopup.defaultProps = {
  cancelLabel: '',
  confirmLabel: '',
  cancelIcon: '',
  confirmIcon: '',
  msg: '',
  customColor: ''
}

export default translate()(ConfirmPopup)
