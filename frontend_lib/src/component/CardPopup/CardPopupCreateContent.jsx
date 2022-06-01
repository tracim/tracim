import React from 'react'
import Select from 'react-select'
import PropTypes from 'prop-types'
import Radium from 'radium'
import CardPopup from './CardPopup.jsx'

// require('./CardPopupCreateContent.styl') // see https://github.com/tracim/tracim/issues/1156
const color = require('color')

export const PopupCreateContent = (props) => {
  const handleChangeModel = (event) => {
    console.log('handleChangeModel', event)
  }

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
            <span>À partir d'un model</span>
            {/* <span>À partir d'un model {modelName}</span> */}
            <Select
              className='newSpace__input'
              isSearchable
              onChange={handleChangeModel}
              options={props.templateList}
              defaultValue={props.templateList[0]}
            />
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
  faIcon: PropTypes.string,
  inputPlaceholder: PropTypes.string,
  onChangeContentName: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
  label: PropTypes.string,
  templateList: PropTypes.array
}

PopupCreateContent.defaultProps = {
  btnValidateLabel: '',
  customColor: '#333',
  faIcon: '',
  inputPlaceHolder: '',
  label: '',
  templateList: []
}

export default Radium(PopupCreateContent)
