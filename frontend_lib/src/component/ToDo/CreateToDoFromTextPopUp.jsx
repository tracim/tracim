import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import CardPopup from '../CardPopup/CardPopup.jsx'
import IconButton from '../Button/IconButton.jsx'
import Popover from '../Popover/Popover.jsx'

const CreateToDoFromTextPopup = (props) => {
  return (
    <CardPopup
      customClass='createToDoFromTextPopup'
      customColor={props.customColor}
      onClose={props.onClickClose}
      label={props.t('Create task from text')}
      faIcon='fas fa-edit'
    >
      <div className='createToDoFromTextPopup__main'>
        <div className='createToDoFromTextPopup__main__title'>
          <span>
            {props.t('Enter your tasks below:')}
          </span>
          <button
            type='button'
            className='transparentButton createToDoFromTextPopup__main__title__info'
            id='popoverToDoInfo'
          >
            <i className='fas fa-fw fa-question-circle' />
          </button>
        </div>
        <Popover
          popoverBody={(
            <div>
              {props.t('To create a task, type the + character followed by the username, then the text of your task.')}
              <br />
              {props.t('Each new line corresponds to a new task.')}
              <br />
              {props.t('For the task to be assigned to a member, the username must be at the beginning of the line.')}
            </div>
          )}
          targetId='popoverToDoInfo'
        />
        <textarea
          placeholder={props.placeHolder || props.t('+username please read the document')}
          onChange={props.onChangeValue}
          value={props.value}
          rows={10}
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
          dataCy='createToDoFromTextPopup__buttons__create'
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
