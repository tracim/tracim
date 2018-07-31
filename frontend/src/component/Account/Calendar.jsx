import React from 'react'

export const Calendar = props => {
  return (
    <div className='account__userpreference__setting__calendar'>

      <div className='calendar__title subTitle ml-2 ml-sm-0'>
        {props.t('Calendar')}
      </div>

      <div className='calendar__text ml-2 ml-sm-0'>
        NYI
      </div>

      <div className='calendar__title ml-2 ml-sm-0'>
        {props.t('Access your personal calendar')}
      </div>
      <div className='calendar__link ml-2 ml-sm-0'>
        {props.user.caldavUrl}
      </div>
    </div>
  )
}

export default Calendar
