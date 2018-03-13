import React from 'react'

export const Calendar = props => {
  return (
    <div className='account__userpreference__setting__calendar'>

      <div className='calendar__title subTitle ml-2 ml-sm-0'>
        Calendrier
      </div>

      <div className='calendar__text ml-2 ml-sm-0'>
        NYI
      </div>

      <div className='calendar__title ml-2 ml-sm-0'>
        Accèder à votre Calendrier personnel
      </div>
      <div className='calendar__link ml-2 ml-sm-0'>
        {props.user.caldavUrl}
      </div>

      <div className='calendar__title ml-2 ml-sm-0'>
        Changer de Fuseau Horaire :
      </div>

      <div className='calendar__timezone ml-2 ml-sm-0 dropdown'>
        <button className='calendar__timezone__btn btn dropdown-toggle' type='button' id='dropdownMenuButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
          Fuseau Horaire
        </button>
        <div className='calendar__timezone__submenu dropdown-menu'>
          {props.timezone.map((t, i) => <div className='calendar__timezone__submenu__item dropdown-item' key={i}>{t.place} {t.gmt}</div>)}
        </div>
      </div>
    </div>
  )
}

export default Calendar
