import React from 'react'
import PropTypes from 'prop-types'
import Radium from 'radium'
import CardPopup from './CardPopup.jsx'

// require('./CardPopupCreateContent.styl') // see https://github.com/tracim/tracim/issues/1156
const color = require('color')

class PopupCreateContent extends React.Component {
  handleInputKeyDown = e => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        this.props.onValidate()
        break
      case 'Escape':
        e.preventDefault()
        this.props.onClose()
        break
    }
  }

  render () {
    const { props } = this
    return (
      <div className='popupCreateContentOverlay'>
        <CardPopup
          customClass='popupCreateContent'
          customColor={props.customColor}
          onClose={props.onClose}
          customStyle={props.customStyle}
        >
          <div className='createcontent'>
            <div className='createcontent__contentname'>
              <div className='createcontent__contentname__icon'>
                <i className={`fa fa-${props.faIcon}`} style={{ color: props.customColor }} />
              </div>

              <div className='createcontent__contentname__title' style={{ color: props.customColor }}>
                {props.label}
              </div>
            </div>

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
                    onKeyDown={this.handleInputKeyDown}
                    autoFocus
                  />
                )
              }
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
}

PopupCreateContent.propTypes = {
  onClose: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
  contentName: PropTypes.string.isRequired,
  onChangeContentName: PropTypes.func.isRequired,
  label: PropTypes.string,
  customColor: PropTypes.string,
  faIcon: PropTypes.string,
  btnValidateLabel: PropTypes.string,
  inputPlaceholder: PropTypes.string
}

PopupCreateContent.defaultProps = {
  label: '',
  customColor: '#333',
  inputPlaceHolder: '',
  btnValidateLabel: ''
}

export default Radium(PopupCreateContent)
