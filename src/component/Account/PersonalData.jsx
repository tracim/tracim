import React from 'react'

export const PersonalData = props => {
  return (
    <div className='account__userpreference__setting__personaldata'>
      <div className='personaldata__sectiontitle subTitle ml-2 ml-sm-0'>
        Information du compte et personnelles
      </div>

      <div className='personaldata__text ml-2 ml-sm-0'>
        NYI
      </div>

      <div className='personaldata__dataconnexion d-flex align-items-center justify-content-between flex-wrap'>
        <form className='personaldata__form mr-5'>
          <div className='personaldata__form__title'>
            Mot de passe :
          </div>
          <div className='d-flex align-items-center justify-content-between flex-wrap mb-4'>
            <input className='personaldata__form__txtinput form-control mr-3' type='password' placeholder='Ancien mot de passe' />
            <input className='personaldata__form__txtinput form-control mt-3 mt-sm-0' type='password' placeholder='Nouveau mot de passe' />
          </div>
          <div className='d-flex justify-content-sm-end'>
            <button type='submit' className='personaldata__form__button btn btn-outline-primary d-flex justify-content-end'>
              Envoyer
            </button>
          </div>
        </form>

        <form className='personaldata__form'>
          <div className='personaldata__form__title'>
            Adresse mail :
          </div>
          <div className='d-flex align-items-center justify-content-between flex-wrap mb-4'>
            <input className='personaldata__form__txtinput form-control mr-3' type='email' placeholder='Ancienne adresse mail' />
            <input className='personaldata__form__txtinput form-control mt-3 mt-sm-0' type='email' placeholder='Nouvelle adresse mail' />
          </div>
          <div className='d-flex justify-content-sm-end'>
            <button type='submit' className='personaldata__form__button btn btn-outline-primary d-flex justify-content-end'>
              Envoyer
            </button>
          </div>
        </form>
      </div>

      <div className='personaldata__dataheader d-flex align-items-center justify-content-between flex-wrap'>

        <form className='personaldata__form mr-5'>
          <div className='personaldata__form__title'>
            Nom de Famille :
          </div>
          <div className='d-flex align-items-center justify-content-between flex-wrap mb-4'>
            <input className='personaldata__form__txtinput form-control mr-3' type='password' placeholder='Ancien nom de famille' />
            <input className='personaldata__form__txtinput form-control mt-3 mt-sm-0' type='password' placeholder='Nouveau nom de famille' />
          </div>
          <div className='d-flex justify-content-sm-end'>
            <button type='submit' className='personaldata__form__button btn btn-outline-primary'>
              Envoyer
            </button>
          </div>
        </form>

        <form className='personaldata__form'>
          <div className='personaldata__form__title'>
            Prénom :
          </div>
          <div className='d-flex align-items-center justify-content-between flex-wrap mb-4'>
            <input className='personaldata__form__txtinput form-control mr-3' type='password' placeholder='Ancien prénom' />
            <input className='personaldata__form__txtinput form-control mt-3 mt-sm-0' type='password' placeholder='Nouveau prénom' />
          </div>
          <div className='d-flex justify-content-sm-end'>
            <button type='submit' className='personaldata__form__button btn btn-outline-primary'>
              Envoyer
            </button>
          </div>
        </form>
      </div>

      <div className='account__userpreference__setting__calendar mt-4 '>

        <div className='calendar__sectiontitle subTitle ml-2 ml-sm-0'>
          Calendrier
        </div>

        <div className='calendar__text ml-2 ml-sm-0'>
          NYI
        </div>

        <div className='calendar__title ml-2 ml-sm-0'>
          Accèder à votre Calendrier personnel
        </div>
        <div className='calendar__link ml-2 ml-sm-0'>
          { /* {props.user.caldavUrl} */ }
        </div>

        <div className='calendar__title ml-2 ml-sm-0'>
          Changer de Fuseau Horaire :
        </div>

        <div className='calendar__timezone ml-2 ml-sm-0 dropdown'>
          <button className='calendar__timezone__btn btn dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
            Fuseau Horaire
          </button>
          <div className='calendar__timezone__submenu dropdown-menu'>
            { /* {props.timezone.map((t, i) => <div className='calendar__timezone__submenu__item dropdown-item' key={i}>{t.place} {t.gmt}</div>)} */ }
          </div>
        </div>
      </div>

    </div>
  )
}

export default PersonalData
