import React from 'react'
import { translate } from 'react-i18next'
import Select from 'react-select'
import PropTypes from 'prop-types'
import Radium from 'radium'
import CardPopup from './CardPopup.jsx'

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
        customStyle={props.customStyle}
        faIcon={props.faIcon}
        label={props.label}
      >
        <div className='createcontent'>
          <form className='createcontent__form' data-cy='createcontent__form'>
            {props.children
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
              )}
            {(props.displayTemplateList && (props.templateList.length > 0)) && (
              <div>
                <div className='createcontent__form__label'>{props.t('From a template:')}</div>
                <Select
                  className='createcontent__form__template'
                  defaultValue={props.templateList[0]}
                  isClearable
                  isSearchable
                  onChange={props.onChangeTemplate}
                  options={props.templateList}
                />
              </div>
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
                disabled={!props.contentName || props.contentName.length === 0}
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
  templateList: PropTypes.array
}

PopupCreateContent.defaultProps = {
  btnValidateLabel: '',
  customColor: '#333',
  displayTemplateList: false,
  faIcon: '',
  inputPlaceHolder: '',
  label: '',
  onChangeTemplate: () => {},
  templateList: []
}

export default translate()(Radium(PopupCreateContent))
