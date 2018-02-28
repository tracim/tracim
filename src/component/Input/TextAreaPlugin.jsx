import React from 'react'
// import classnames from 'classnames'

require('./TextAreaPlugin.styl')

export const TextAreaPlugin = props =>
  <form className={`${props.customClass} editionmode`}>
    <textarea className={`${props.customClass}__text editionmode__text`} />
    <input type='submit' className={`${props.customClass}__submit editionmode__submit`} value='Valider' />
  </form>

export default TextAreaPlugin
