import React from 'react'

export const PersonalData = props => {
  return (
    <div className='account__userpreference__setting__personaldata'>
      <div className='personaldata__title subTitle ml-2 ml-sm-0'>
        Mes informations personnelles
      </div>

      <div className='personaldata__text ml-2 ml-sm-0'>
        NYI
      </div>

      <div className='personaldata__form'>
        <div className='personaldata__form__title'>
          Changer le mot de passe :
        </div>
        <input className='personaldata__form__txtinput form-control' type='password' placeholder='Ancien mot de passe' />
        <input className='personaldata__form__txtinput form-control' type='password' placeholder='Nouveau mot de passe' />
        <div className='personaldata__form__button btn btn-primary'>
          Envoyer
        </div>
      </div>

      <div className='personaldata__form'>
        <div className='personaldata__form__title'>
          Changer d'adresse mail :
        </div>
        <input className='personaldata__form__txtinput form-control' type='email' placeholder='Ancienne adresse mail' />
        <input className='personaldata__form__txtinput form-control' type='email' placeholder='Nouvelle adresse mail' />
        <div className='personaldata__form__button btn btn-primary'>
          Envoyer
        </div>
      </div>
    </div>
  )
}

export default PersonalData
