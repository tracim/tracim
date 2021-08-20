import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import Radium from 'radium'

// require('./TextAreaApp.styl') // see https://github.com/tracim/tracim/issues/1156
const color = require('color')

export const TextAreaApp = props =>
  <form className={`${props.customClass} editionmode`}>
    <textarea
      id={props.id}
      className={`${props.customClass}__text editionmode__text`}
      value={props.text}
      onChange={props.onChangeText}
      autoFocus
    />

    <div className={`${props.customClass}__button editionmode__button`}>
      <button
        type='button'
        className={`${props.customClass}__cancel editionmode__button__cancel btn outlineTextBtn`}
        onClick={props.onClickCancelBtn}
        tabIndex='1'
        style={{
          backgroundColor: '#fdfdfd',
          color: props.customColor,
          borderColor: props.customColor,
          ':hover': {
            backgroundColor: props.customColor,
            color: '#fdfdfd'
          }
        }}
        key='TextAreaApp__cancel'
      >
        {props.t('Cancel')}
      </button>

      <button
        type='button'
        data-cy='editionmode__button__submit'
        className={`${props.customClass}__submit editionmode__button__submit btn highlightBtn`}
        onClick={props.onClickValidateBtn}
        disabled={props.disableValidateBtn}
        tabIndex='0'
        style={{
          backgroundColor: props.customColor,
          color: '#fdfdfd',
          borderColor: props.customColor,
          ':hover': {
            backgroundColor: color(props.customColor).darken(0.15).hex()
          }
        }}
        key='TextAreaApp__validate'
      >
        {props.t('Validate')}
      </button>
    </div>
  </form>

export default translate()(Radium(TextAreaApp))

TextAreaApp.propTypes = {
  text: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  onClickCancelBtn: PropTypes.func.isRequired,
  onClickValidateBtn: PropTypes.func.isRequired,
  disableValidateBtn: PropTypes.bool,
  id: PropTypes.string,
  customClass: PropTypes.string,
  customColor: PropTypes.string
}
