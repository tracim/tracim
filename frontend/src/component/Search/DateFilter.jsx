import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import DayPickerInput from 'react-day-picker/DayPickerInput'
import 'react-day-picker/lib/style.css'
import dateFnsFormat from 'date-fns/format'
import { DATE_FILTER_ELEMENT } from '../../util/helper.js'

export class DateFilter extends React.Component {
  formatDate = (date, format, locale) => {
    return dateFnsFormat(date, format, { locale })
  }

  render () {
    const { props } = this

    const WEEKDAYS_LONG = {
      en: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ],
      fr: [
        'Dimanche',
        'Lundi',
        'Mardi',
        'Mercredi',
        'Jeudi',
        'Vendredi',
        'Samedi'
      ],
      pt: [
        'Domingo',
        'Segunda-feira',
        'Terça-feira',
        'Quarta-feira',
        'Quinta-feira',
        'Sexta-feira',
        'Sábado'
      ]
    }

    const WEEKDAYS_SHORT = {
      en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      fr: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
      pt: ['Do', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sá']
    }

    const MONTHS = {
      en: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ],
      fr: [
        'Janvier',
        'Février',
        'Mars',
        'Avril',
        'Mai',
        'Juin',
        'Juillet',
        'Août',
        'Septembre',
        'Octobre',
        'Novembre',
        'Décembre'
      ],
      pt: [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro'
      ]
    }

    // INFO - G.B. - 2021-02-18 - Use 1 to start the week at Monday, 0 to start at Sunday
    const FIRST_DAY_OF_WEEK = {
      en: 0,
      fr: 1,
      pt: 0
    }

    const FORMAT = {
      en: 'MM/DD/YYYY',
      fr: 'DD/MM/YYYY',
      pt: 'DD/MM/YYYY'
    }

    return (
      <>
        <div className='searchFilterMenu__content__item__checkbox'>
          <input
            type='checkbox'
            id={`${props.id}_${DATE_FILTER_ELEMENT.AFTER}`}
            onChange={() => props.onClickDateCheckbox(DATE_FILTER_ELEMENT.AFTER)}
            checked={props.isAfterCheckboxChecked}
          />
          <label htmlFor={`${props.id}_${DATE_FILTER_ELEMENT.AFTER}`}>{props.t('After')}</label>
          <DayPickerInput
            dayPickerProps={{
              disabledDays: [{
                after: new Date(props.to),
                before: new Date(props.from)
              }],
              firstDayOfWeek: FIRST_DAY_OF_WEEK[props.user.lang],
              locale: props.user.lang,
              months: MONTHS[props.user.lang],
              showOutsideDays: true,
              weekdaysLong: WEEKDAYS_LONG[props.user.lang],
              weekdaysShort: WEEKDAYS_SHORT[props.user.lang]
            }}
            format={FORMAT[props.user.lang]}
            formatDate={this.formatDate}
            onDayChange={(day) => props.onChangeDate(`${day.toISOString().split('T')[0]}T00:00:01Z`, DATE_FILTER_ELEMENT.AFTER)}
            placeholder={props.t('mm/dd/yyyy')}
            value={props.afterDate ? this.formatDate(props.afterDate, FORMAT[props.user.lang], props.user.lang) : ''}
          />
        </div>

        <div className='searchFilterMenu__content__item__checkbox'>
          <input
            type='checkbox'
            id={`${props.id}_${DATE_FILTER_ELEMENT.BEFORE}`}
            onChange={() => props.onClickDateCheckbox(DATE_FILTER_ELEMENT.BEFORE)}
            checked={props.isBeforeCheckboxChecked}
          />
          <label htmlFor={`${props.id}_${DATE_FILTER_ELEMENT.BEFORE}`}>{props.t('Before')}</label>
          <DayPickerInput
            dayPickerProps={{
              disabledDays: [{
                after: new Date(props.to),
                before: new Date(props.from)
              }],
              firstDayOfWeek: FIRST_DAY_OF_WEEK[props.user.lang],
              locale: props.user.lang,
              months: MONTHS[props.user.lang],
              showOutsideDays: true,
              weekdaysLong: WEEKDAYS_LONG[props.user.lang],
              weekdaysShort: WEEKDAYS_SHORT[props.user.lang]
            }}
            format={FORMAT[props.user.lang]}
            formatDate={this.formatDate}
            onDayChange={(day) => props.onChangeDate(`${day.toISOString().split('T')[0]}T23:59:59Z`, DATE_FILTER_ELEMENT.BEFORE)}
            placeholder={props.t('mm/dd/yyyy')}
            value={props.beforeDate ? this.formatDate(props.beforeDate, FORMAT[props.user.lang], props.user.lang) : ''}
          />
        </div>
      </>
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
