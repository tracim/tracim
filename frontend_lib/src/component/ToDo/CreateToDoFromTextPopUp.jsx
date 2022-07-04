import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { tinymceRemove } from '../../helper.js'
import CardPopup from '../CardPopup/CardPopup.jsx'
import IconButton from '../Button/IconButton.jsx'

const wysiwygId = 'wysiwygTextToToDos'
const wysiwygIdSelector = `#${wysiwygId}`

const CreateToDoFromTextPopup = (props) => {
  useEffect(() => {
    return tinymceRemove(wysiwygIdSelector)
  }, [])

  return (
    <CardPopup
      customClass='createToDoFromTextPopup'
      customColor={props.customColor}
      onClose={props.onClickClose}
      label={props.t('Transform todos')}
      faIcon='fas fa-edit'
    >
      <div className='createToDoFromTextPopup__main'>
        <span>
          {props.t('Enter your tasks bellow:')}
        </span>
        <textarea
          placeholder={props.placeHolder || props.t('Your message...')}
          onChange={props.onChangeValue}
          value={props.value}
        />
      </div>
      <div className='createToDoFromTextPopup__buttons'>
        <IconButton
          color={props.customColor}
          icon='fas fa-times'
          intent='secondary'
          mode='dark'
          onClick={props.onClickClose}
          text={props.t('Cancel')}
          type='button'
        />
        <IconButton
          color={props.customColor}
          disabled={false}
          icon='far fa-paper-plane'
          intent='primary'
          mode='light'
          onClick={props.onClickTransform}
          text={props.t('Create task from text')}
          type='button'
        />
      </div>
    </CardPopup>
  )
}

export default translate()(CreateToDoFromTextPopup)

CreateToDoFromTextPopup.propTypes = {
  onChangeValue: PropTypes.func.isRequired,
  onClickClose: PropTypes.func.isRequired,
  onClickTransform: PropTypes.func.isRequired,
  apiUrl: PropTypes.string,
  customColor: PropTypes.string,
  value: PropTypes.string
}

CreateToDoFromTextPopup.defaultProps = {
  apiUrl: '',
  customColor: undefined,
  value: ''
}
