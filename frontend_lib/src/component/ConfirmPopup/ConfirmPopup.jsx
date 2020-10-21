import { CardPopup } from '../CardPopup/CardPopup'

export const ConfirmPopup = (props) => (
  <CardPopup
    customClass='confirm_popup'
    customHeaderClass='primaryColorBg'
    onClose={props.onCancel}
  >
    <div className='confirm_popup__body'>
      <div className='confirm_popup__body__msg'>{props.msg || props.t('Are you sure ?')}</div>
      <div className='confirm_popup__body__btn'>
        <button
          type='button'
          className='btn outlineTextBtn primaryColorBorder primaryColorFont nohover'
          onClick={props.onCancel}
        >
          {props.t('Cancel')}
        </button>
        <button
          type='button'
          className='btn highlightBtn primaryColorBg primaryColorDarkenBgHover'
          onClick={props.onConfirm}
        >
          {props.confirmLabel || props.t('Confirm')}
        </button>
      </div>
    </div>
  </CardPopup>
)
