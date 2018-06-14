import React from 'react'
import PropTypes from 'prop-types'
import CardPopup from './CardPopup.jsx'

require('./CardPopupCreateContent.styl')

const PopupCreateContent = props => {
  return (
    <CardPopup customClass='popupCreateContent' onClose={props.onClose}>
      <div className='createcontent'>
        <div className='createcontent__contentname mb-4'>
          <div className='createcontent__contentname__icon ml-1 mr-3'>
            <i className={`fa ${props.icon}`} style={{color: props.color}} />
          </div>

          <div className='createcontent__contentname__title' style={{color: props.color}}>
            {props.title}
          </div>
        </div>

        <form className='createcontent__form'>
          <input
            type='text'
            className='createcontent__form__input'
            value={props.contentName}
            onChange={props.onChangeContentName}
          />

          <div className='createcontent__form__button'>
            <button
              className='createcontent__form__button btn btn-primary'
              type='submit'
              onClick={props.onValidate}
            >
              {props.btnValidateLabel}
            </button>
          </div>
        </form>
      </div>
    </CardPopup>
  )
}

PopupCreateContent.propTypes = {
  onClose: PropTypes.func.isRequired,
  onValidate: PropTypes.func.isRequired,
  contentName: PropTypes.string.isRequired,
  onChangeContentName: PropTypes.func.isRequired,
  title: PropTypes.string,
  color: PropTypes.string,
  btnValidateLabel: PropTypes.string
}

PopupCreateContent.defaultProps = {
  title: '',
  color: '#333',
  inputPlaceHolder: '',
  btnValidateLabel: ''
}


export default PopupCreateContent
