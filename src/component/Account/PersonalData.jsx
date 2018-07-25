import React from 'react'

export const PersonalData = props => {
  return (
    <div className='account__userpreference__setting__personaldata'>
      <div className='personaldata__sectiontitle subTitle ml-2 ml-sm-0'>
        Information du compte
      </div>

      <div className='personaldata__text ml-2 ml-sm-0'>
        NYI
      </div>

      <form className='personaldata__form'>
        <div className='personaldata__form__title'>
          Nom :
        </div>
        <div className='d-flex align-items-center justify-content-between flex-wrap mb-4'>
          <input className='personaldata__form__txtinput form-control mt-3 mt-sm-0' type='text' placeholder='Nom' />
        </div>
        <div className='personaldata__form__title'>
          Adresse mail :
        </div>
        <div className='d-flex align-items-center justify-content-between flex-wrap mb-4'>
          <input className='personaldata__form__txtinput form-control mt-3 mt-sm-0' type='email' placeholder='Nouvelle adresse mail' />
        </div>
        <button type='submit' className='personaldata__form__button btn btn-outline-primary'>
          Envoyer
        </button>
      </form>
    </div>
  )
}

export default PersonalData
