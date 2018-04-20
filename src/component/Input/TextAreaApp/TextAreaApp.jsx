import React from 'react'
// import classnames from 'classnames'

require('./TextAreaApp.styl')

export const TextAreaApp = props =>
  <form className={`${props.customClass} editionmode`}>
    <textarea className={`${props.customClass}__text editionmode__text`} />
    <div className={`${props.customClass}__button editionmode__button`}>
      <button
        type='button'
        className={`${props.customClass}__cancel editionmode__button__cancel btn btn-outline-primary mr-3`}
        onClick={props.onClickCancelBtn}
      >
        Annuler
      </button>
      <button type='submit' className={`${props.customClass}__submit editionmode__button__submit btn btn-outline-primary`}>Valider</button>
    </div>
  </form>

export default TextAreaApp
