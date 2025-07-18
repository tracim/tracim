import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import Radium from 'radium'
import CardPopup from './CardPopup.jsx'
import TemplateContentSelector from '../TemplateContentSelector/TemplateContentSelector.jsx'

// require('./CardPopupCreateContent.styl') // see https://github.com/tracim/tracim/issues/1156
const color = require('color')

export const PopupCreateContent = (props) => {
  const handleInputKeyDown = e => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        props.onValidate()
        break
      case 'Escape':
        e.preventDefault()
        props.onClose()
        break
    }
  }

  return (
    <div className='popupCreateContentOverlay'>
      <CardPopup
        customClass='popupCreateContent'
        customColor={props.customColor}
        onClose={props.onClose}
        faIcon={props.faIcon}
        label={props.label}
      >
        <div className='createcontent'>
          <form className='createcontent__form' data-cy='createcontent__form'>
            {(props.displayTemplateList && (props.templateList.length > 0)) && (
              <TemplateContentSelector
                onChangeTemplate={props.onChangeTemplate}
                templateList={props.templateList}
                templateId={props.templateId}
                customColor={props.customColor}
              />
            )}
            {(props.children
              ? props.children
              : (
                <input
                  type='text'
                  className='createcontent__form__input'
                  data-cy='createcontent__form__input'
                  placeholder={props.inputPlaceholder}
                  value={props.contentName}
                  onChange={props.onChangeContentName}
                  onKeyDown={handleInputKeyDown}
                  autoFocus
                />
              )
            )}
            <div className='createcontent__form__button'>
              <button
                type='button' // do neither remove this nor set it to 'submit' otherwise clicking the btn will submit the form and reload the page
                className='createcontent__form__button btn highlightBtn'
                data-cy='popup__createcontent__form__button'
                onClick={props.onValidate}
                style={{
                  backgroundColor: props.customColor,
                  color: '#fdfdfd',
                  borderColor: props.customColor,
                  ':hover': {
                    backgroundColor: color(props.customColor).darken(0.15).hex()
                  }
                }}
                disabled={(!props.contentName || props.contentName.length === 0) && !props.allowEmptyTitle}
              >
                {props.btnValidateLabel}
              </button>
            </div>
          </form>
        </div>
      </CardPopup>
    </div>
  )
}

PopupCreateContent.propTypes = {
  btnValidateLabel: PropTypes.string,
  contentName: PropTypes.string.isRequired,
  customColor: PropTypes.string,
  displayTemplateList: PropTypes.bool,
  faIcon: PropTypes.string,
  inputPlaceholder: PropTypes.string,
  onChangeContentName: PropTypes.func.isRequired,
  onChangeTemplate: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
  label: PropTypes.string,
  allowEmptyTitle: PropTypes.bool,
  templateList: PropTypes.array,
  templateId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}

PopupCreateContent.defaultProps = {
  btnValidateLabel: '',
  customColor: '#333',
  displayTemplateList: false,
  faIcon: '',
  inputPlaceHolder: '',
  label: '',
  onChangeTemplate: () => {},
  allowEmptyTitle: false,
  templateList: [],
  templateId: null
}

export default translate()(Radium(PopupCreateContent))
