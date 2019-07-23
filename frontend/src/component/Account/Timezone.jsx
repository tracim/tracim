import React from 'react'
import Select from 'react-select'
import 'react-select/dist/react-select.css'
import { withTranslation } from 'react-i18next'

export const Timezone = props => {
  const handleChangeTimezone = selectedTimezone => props.onChangeTimezone(props.timezone.find(t => t.place === selectedTimezone.place))

  return (
    <div className='account__userpreference__setting__timezone'>

      <div className='timezone__title subTitle ml-2 ml-sm-0'>
        {props.t('Change your Timezone')}
      </div>

      <div className='timezone__text ml-2 ml-sm-0'>
        NYI
      </div>

      <div className='timezone__time ml-2 ml-sm-0 dropdown'>
        <Select
          name='timezoneSelect'
          className='timezone__time__select'
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

export default withTranslation()(Timezone)
