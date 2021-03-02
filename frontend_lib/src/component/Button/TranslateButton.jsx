import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'

import { TRANSLATION_STATE } from '../../helper.js'
import IconButton from './IconButton.jsx'

require('./TranslateButton.styl')

export const TranslateButton = props => {
  const TOGGLE_TRANSLATION_TEXT = {
    [TRANSLATION_STATE.TRANSLATED]: props.t('Restore the original language'),
    [TRANSLATION_STATE.UNTRANSLATED]: props.t('Show translation'),
    [TRANSLATION_STATE.DISABLED]: null,
    [TRANSLATION_STATE.PENDING]: null
  }
  const toggleTranslationText = TOGGLE_TRANSLATION_TEXT[props.translationState]
  const className = classnames('translateButton', props.customClass)

  if (props.translationState === TRANSLATION_STATE.DISABLED) return null

  return (
    <>
      {props.translationState === TRANSLATION_STATE.PENDING && (
        <span className={className}>
          <i className='fa fa-spinner fa-spin' /> {props.t('Translation pending…')}
        </span>
      )}
      {toggleTranslationText && (
        <IconButton
          text={toggleTranslationText}
          onClick={props.onClickToggleTranslation}
          intent='link'
          mode='light'
          customClass={className}
          dataCy={props.dataCy}
        />
      )}
    </>
  )
}

TranslateButton.propTypes = {
  translationState: PropTypes.oneOf(Object.values(TRANSLATION_STATE)),
  onClickToggleTranslation: PropTypes.func,
  customClass: PropTypes.string,
  dataCy: PropTypes.string
}

TranslateButton.defaultPropTypes = {
  customClass: '',
  dataCy: ''
}

export default translate()(TranslateButton)
