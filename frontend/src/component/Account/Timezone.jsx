import React from 'react'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

export const Timezone = props => {
  const handleChangeTimezone = selectedTimezone => props.onChangeTimezone(props.timezone.find(t => t.place === selectedTimezone.place))

  return (
    <div className='account__userpreference__setting__calendar'>

      <div className='calendar__title ml-2 ml-sm-0'>
        Changer de Fuseau Horaire :
      </div>

      <div className='calendar__text ml-2 ml-sm-0'>
        NYI
      </div>

      <div className='calendar__timezone ml-2 ml-sm-0 dropdown'>
        <Select
          name='timezoneSelect'
          className='calendar__timezone__select'
          value={props.timezoneUser}
          labelKey='place'
          valueKey='place'
          options={props.timezone}
          onChange={handleChangeTimezone}
        />
      </div>

    </div>
  )
}

export default Timezone
