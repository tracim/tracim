import React from 'react'
import { translate } from 'react-i18next'

export const Password = props => {
  return (
    <div className='account__userpreference__setting__personaldata'>
      <div className='personaldata__sectiontitle subTitle ml-2 ml-sm-0'>
        {props.t('Change your password')}
      </div>

      <div className='personaldata__text ml-2 ml-sm-0'>
        NYI
      </div>

      <form className='personaldata__form mr-5'>
        <div className='personaldata__form__title'>
          {props.t('Password')}
        </div>
        <input
          className='personaldata__form__txtinput primaryColorBorderLighten form-control'
          type='password'
          placeholder={props.t('Old password')}
        />
        <input
          className='personaldata__form__txtinput primaryColorBorderLighten form-control mt-4'
          type='password'
          placeholder={props.t('New password')}
        />
        <button type='submit' className='personaldata__form__button primaryColorBorderLighten btn btn-outline-primary mt-4'>
          {props.t('Send')}
        </button>
      </form>

    </div>
  )
}

export default translate()(Password)
