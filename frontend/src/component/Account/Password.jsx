import React from 'react'

export const Password = props => {
  return (
    <div className='account__userpreference__setting__personaldata'>
      <div className='personaldata__sectiontitle subTitle ml-2 ml-sm-0'>
        Changer de mot de passe
      </div>

      <div className='personaldata__text ml-2 ml-sm-0'>
        NYI
      </div>

      <form className='personaldata__form mr-5'>
        <div className='personaldata__form__title'>
          Mot de passe :
        </div>
        <input className='personaldata__form__txtinput form-control' type='password' placeholder='Ancien mot de passe' />
        <input className='personaldata__form__txtinput form-control mt-4' type='password' placeholder='Nouveau mot de passe' />
        <button type='submit' className='personaldata__form__button btn btn-outline-primary mt-4'>
          Envoyer
        </button>
      </form>

    </div>
  )
}

export default Password
