import React from 'react'
import PropTypes from 'prop-types'

require('./TextAreaApp.styl')

export const TextAreaApp = props =>
  <form className={`${props.customClass} editionmode`}>
    <textarea
      id={props.id}
      className={`${props.customClass}__text editionmode__text`}
      value={props.text}
      onChange={props.onChangeText}
    />

    <div className={`${props.customClass}__button editionmode__button`}>
      <button
        type='button'
        className={`${props.customClass}__cancel editionmode__button__cancel btn btn-outline-primary mr-3`}
        onClick={props.onClickCancelBtn}
      >
        Annuler
      </button>

      <button
        type='button'
        className={`${props.customClass}__submit editionmode__button__submit btn btn-outline-primary`}
        onClick={props.onClickValidateBtn}
      >
        Valider
      </button>
    </div>
  </form>

export default TextAreaApp

TextAreaApp.propTypes = {
  text: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  onClickCancelBtn: PropTypes.func.isRequired,
  onClickValidateBtn: PropTypes.func.isRequired,
  id: PropTypes.string,
  customClass: PropTypes.string
}
