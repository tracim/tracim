import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

export const PersonalData = props => {
  return (
    <div className='account__userpreference__setting__personaldata'>
      <div className='personaldata__sectiontitle subTitle ml-2 ml-sm-0'>
        {props.t('Account information')}
      </div>

      <div className='personaldata__text ml-2 ml-sm-0'>
        NYI
      </div>

      <form className='personaldata__form'>
        <div className='personaldata__form__title'>
          {props.t('Name:')}
        </div>
        <div className='d-flex align-items-center justify-content-between flex-wrap mb-4'>
          <input
            className='personaldata__form__txtinput primaryColorBorderLighten form-control mt-3 mt-sm-0'
            type='text'
            placeholder={props.t('Change your name')}
          />
        </div>
        <div className='personaldata__form__title'>
          {props.t('Email Adress:')}
        </div>
        <div className='d-flex align-items-center justify-content-between flex-wrap mb-4'>
          <input
            className='personaldata__form__txtinput primaryColorBorderLighten form-control mt-3 mt-sm-0'
            type='email'
            placeholder={props.t('Change your email')}
          />
        </div>
        <button type='submit' className='personaldata__form__button primaryColorBorderLighten btn btn-outline-primary'>
          {props.t('Send')}
        </button>
      </form>
    </div>
  )
}

PersonalData.propTypes = {
  inputPlaceholderNameUser: PropTypes.string,
  inputPlaceholderEmailUser: PropTypes.string
}

export default translate()(PersonalData)
