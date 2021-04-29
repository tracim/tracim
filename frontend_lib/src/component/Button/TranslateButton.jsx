import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'

import { TRANSLATION_STATE } from '../../translation.js'
import IconButton from './IconButton.jsx'
import DropdownMenu from '../DropdownMenu/DropdownMenu.jsx'

require('./TranslateButton.styl')

export const TranslateButton = props => {
  const className = classnames('translateButton', props.customClass)

  if (props.translationState === TRANSLATION_STATE.DISABLED) return null

  if (props.translationState === TRANSLATION_STATE.PENDING) {
    return (
      <span className={className}>
        <i className='fas fa-spinner fa-spin' /> {props.t('Translation pending…')}
      </span>
    )
  }

  const targetLanguage = props.targetLanguageList.find(target => target.code === props.targetLanguageCode) || { display: props.targetLanguageCode }

  if (props.translationState === TRANSLATION_STATE.UNTRANSLATED) {
    return (
      <>
        <IconButton
          text={props.t('Translate to {{language}}', { language: targetLanguage.display })}
          onClick={props.onClickTranslate}
          intent='link'
          mode='light'
          customClass={className}
          dataCy={props.dataCy}
        />
        <DropdownMenu buttonDataCy={props.dataCy ? `${props.dataCy}__languageMenu` : null}>
          {props.targetLanguageList.map(language => {
            return (
              <IconButton
                key={language.code}
                text={language.display}
                onClick={() => { props.onChangeTargetLanguageCode(language.code) }}
                intent='link'
                mode='light'
                dataCy={props.dataCy ? `${props.dataCy}__language__${language.code}` : null}
              />
            )
          }
          )}
        </DropdownMenu>
      </>
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
  onClickTranslate: PropTypes.func.isRequired,
  onClickRestore: PropTypes.func.isRequired,
  onChangeTargetLanguageCode: PropTypes.func.isRequired,
  targetLanguageList: PropTypes.arrayOf(PropTypes.object).isRequired,
  translationState: PropTypes.oneOf(Object.values(TRANSLATION_STATE)),
  targetLanguageCode: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  dataCy: PropTypes.string
}

TranslateButton.defaultProps = {
  translationState: TRANSLATION_STATE.DISABLED,
  customClass: '',
  dataCy: ''
}

export default translate()(TranslateButton)
