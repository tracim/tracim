import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import DayPickerInput from 'react-day-picker/DayPickerInput'
import 'react-day-picker/lib/style.css'
import dateFnsFormat from 'date-fns/format'
import { DATE_FILTER_ELEMENT } from '../../util/helper.js'
import { Checkbox, DATE_FNS_LOCALE } from 'tracim_frontend_lib'

require('./DateFilter.styl')

export class DateFilter extends React.Component {
  render () {
    const { props } = this

    const WEEKDAYS_LONG = [
      props.t('Sunday'),
      props.t('Monday'),
      props.t('Tuesday'),
      props.t('Wednesday'),
      props.t('Thursday'),
      props.t('Friday'),
      props.t('Saturday')
    ]

    const WEEKDAYS_SHORT = [
      props.t('Su'),
      props.t('Mo'),
      props.t('Tu'),
      props.t('We'),
      props.t('Th'),
      props.t('Fr'),
      props.t('Sa')
    ]

    const MONTHS = [
      props.t('January'),
      props.t('February'),
      props.t('March'),
      props.t('April'),
      props.t('May'),
      props.t('June'),
      props.t('July'),
      props.t('August'),
      props.t('September'),
      props.t('October'),
      props.t('November'),
      props.t('December')
    ]

    const locale = DATE_FNS_LOCALE[props.user.lang]
    const FIRST_DAY_OF_WEEK = locale.options.weekStartsOn

    const formatDate = (date, format, loc = undefined) => {
      return dateFnsFormat(new Date(date), format, { locale })
    }

    const FORMAT = props.t('MM/dd/yyyy')

    return (
      <div className='dateFilter'>
        <div className='dateFilter__checkbox'>
          <Checkbox
            name={`${props.id}_${DATE_FILTER_ELEMENT.AFTER}`}
            onClickCheckbox={() => props.onClickDateCheckbox(DATE_FILTER_ELEMENT.AFTER)}
            checked={props.isAfterCheckboxChecked}
            styleLabel={{ marginInlineStart: '5px', marginInlineEnd: '10px' }}
            styleCheck={{ top: '-5px' }}
            disabled={props.afterDate === ''}
          />
          <label htmlFor={`checkbox-${props.id}_${DATE_FILTER_ELEMENT.AFTER}`}>{props.t('After')}</label>
          <DayPickerInput
            dayPickerProps={{
              disabledDays: [{
                after: new Date(props.to),
                before: new Date(props.from)
              }],
              firstDayOfWeek: FIRST_DAY_OF_WEEK,
              locale: props.user.lang,
              months: MONTHS,
              showOutsideDays: true,
              weekdaysLong: WEEKDAYS_LONG,
              weekdaysShort: WEEKDAYS_SHORT
            }}
            format={FORMAT}
            formatDate={formatDate}
            onDayChange={(day) => props.onChangeDate(`${day.toISOString().split('T')[0]}`, DATE_FILTER_ELEMENT.AFTER)}
            placeholder={props.t('mm/dd/yyyy')}
            value={props.afterDate ? formatDate(props.afterDate, FORMAT) : ''}
          />
        </div>

        <div className='dateFilter__checkbox'>
          <Checkbox
            name={`${props.id}_${DATE_FILTER_ELEMENT.BEFORE}`}
            onClickCheckbox={() => props.onClickDateCheckbox(DATE_FILTER_ELEMENT.BEFORE)}
            checked={props.isBeforeCheckboxChecked}
            styleLabel={{ marginInlineStart: '5px', marginInlineEnd: '10px' }}
            styleCheck={{ top: '-5px' }}
            disabled={props.beforeDate === ''}
          />
          <label htmlFor={`checkbox-${props.id}_${DATE_FILTER_ELEMENT.BEFORE}`}>{props.t('Before')}</label>
          <DayPickerInput
            dayPickerProps={{
              disabledDays: [{
                after: new Date(props.to),
                before: new Date(props.from)
              }],
              firstDayOfWeek: FIRST_DAY_OF_WEEK,
              locale: props.user.lang,
              months: MONTHS,
              showOutsideDays: true,
              weekdaysLong: WEEKDAYS_LONG,
              weekdaysShort: WEEKDAYS_SHORT
            }}
            format={FORMAT}
            formatDate={formatDate}
            onDayChange={(day) => props.onChangeDate(`${day.toISOString().split('T')[0]}`, DATE_FILTER_ELEMENT.BEFORE)}
            placeholder={props.t('mm/dd/yyyy')}
            value={props.beforeDate ? formatDate(props.beforeDate, FORMAT) : ''}
          />
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(DateFilter))

DateFilter.propTypes = {
  afterDate: PropTypes.string,
  beforeDate: PropTypes.string,
  from: PropTypes.string,
  id: PropTypes.string,
  isAfterCheckboxChecked: PropTypes.bool,
  isBeforeCheckboxChecked: PropTypes.bool,
  onChangeDate: PropTypes.func,
  onClickDateCheckbox: PropTypes.func,
  to: PropTypes.string
}

DateFilter.defaultProps = {
  afterDate: '',
  beforeDate: '',
  from: '',
  id: '',
  isAfterCheckboxChecked: false,
  isBeforeCheckboxChecked: false,
  onChangeDate: () => {},
  onClickDateCheckbox: () => {},
  to: ''
}
