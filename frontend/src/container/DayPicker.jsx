import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import DayPickerInput from 'react-day-picker/DayPickerInput'
import 'react-day-picker/lib/style.css'
import dateFnsFormat from 'date-fns/format'
import dateFnsParse from 'date-fns/parse'
import { DateUtils } from 'react-day-picker'

export class DayPicker extends React.Component {
  parseDate = (str, format, locale) => {
    const parsed = dateFnsParse(str, format, new Date(), { locale });
    if (DateUtils.isDate(parsed)) {
      return parsed
    }
    return undefined
  }

  formatDate = (date, format, locale) => {
    return dateFnsFormat(date, format, { locale })
  }

  render() {
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

    const FORMAT = 'DD/MM/YYYY'

    return (
      <DayPickerInput
        dayPickerProps={{
          disabledDays:[
            {
              after: new Date(2021, 1, 20),
              before: new Date(2021, 2, 25)
            }
          ],
          firstDayOfWeek: FIRST_DAY_OF_WEEK[props.user.lang],
          locale: props.user.lang,
          months: MONTHS[props.user.lang],
          showOutsideDays: true,
          weekdaysLong: WEEKDAYS_LONG[props.user.lang],
          weekdaysShort: WEEKDAYS_SHORT[props.user.lang]
        }}
        format={FORMAT}
        formatDate={this.formatDate}
        onDayChange={day => console.log(day)}
        parseDate={this.parseDate}
        placeholder={props.t(FORMAT)}
      />
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(DayPicker))

DayPicker.propTypes = {
}

DayPicker.defaultProps = {
}
