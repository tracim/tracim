import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'

import { TRANSLATION_STATE } from '../../translation.js'
import IconButton from './IconButton.jsx'

require('./TranslateButton.styl')

export const TranslateButton = props => {
  const className = classnames('translateButton', props.customClass)

  if (props.translationState === TRANSLATION_STATE.DISABLED) return null

  if (props.translationState === TRANSLATION_STATE.PENDING) {
    return (
      <span className={className}>
        <i className='fa fa-spinner fa-spin' /> {props.t('Translation pending…')}
      </span>
    )
  }

  if (props.translationState === TRANSLATION_STATE.UNTRANSLATED) {
    return (
      <IconButton
        text={props.t('Show translation')}
        onClick={props.onClickTranslate}
        intent='link'
        mode='light'
        customClass={className}
        dataCy={props.dataCy}
      />
    )
  }

  return (
    <IconButton
      text={props.t('Restore the original language')}
      onClick={props.onClickRestore}
      intent='link'
      mode='light'
      customClass={className}
      dataCy={props.dataCy}
    />
  )
}

TranslateButton.propTypes = {
  translationState: PropTypes.oneOf(Object.values(TRANSLATION_STATE)),
  onClickTranslate: PropTypes.func,
  onClickRestore: PropTypes.func,
  customClass: PropTypes.string,
  dataCy: PropTypes.string
}

TranslateButton.defaultPropTypes = {
  customClass: '',
  dataCy: ''
}

export default translate()(TranslateButton)
