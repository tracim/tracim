import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Icon } from 'tracim_frontend_lib'
import DayPickerInput from 'react-day-picker/DayPickerInput'
import 'react-day-picker/lib/style.css'
import dateFnsFormat from 'date-fns/format'
import dateFnsParse from 'date-fns/parse'
import { DateUtils } from 'react-day-picker'
import MomentLocaleUtils from 'react-day-picker/moment'

export class SearchFilterMenu extends React.Component {
  parseDate = (str, format, locale) => {
    const parsed = dateFnsParse(str, format, new Date(), { locale });
    if (DateUtils.isDate(parsed)) {
      return parsed
    }
    return undefined
  }

  formatDate = (date, format, locale=this.props.userLang) => {
    console.log('aaaaaaaa', locale)
    return dateFnsFormat(date, format, { locale })
  }

  render () {
    const FORMAT = 'DD/MM/YYYY'
    return (
      <div className='searchFilterMenu'>
        <div className='searchFilterMenu__title'>
          <Icon
            icon='fa-fw fas fa-sliders-h'
            title={this.props.t('Filters')}
          />
          {this.props.t('Filters')}
          <button
            className='transparentButton'
            onClick={this.props.onClickCloseSearchFilterMenu}
          >
            <Icon
              icon='fa-fw fas fa-times'
              title={this.props.t('Close')}
            />
          </button>
        </div>
        <div>
          <div className='searchFilterMenu__item__title'>
            <button
              className='transparentButton'
              onClick={this.props.onClickSearchFilterItem}
            >
              <Icon
                icon='fa-fw fas fa-caret-down'
                title={this.props.t('Close')}
              />
            </button>
          Title
        </div>
          <div className='searchFilterMenu__item__checkbox'>
            <input type='checkbox' id='s' />
            <label htmlFor='s'>Text (999)</label>
          </div>
          <div className='searchFilterMenu__item__checkbox'>
            <input type='checkbox' id='s' />
            <label htmlFor='s'>Text (999)</label>
          </div>
          <div className='searchFilterMenu__item__checkbox'>
            <input type='checkbox' id='s' />
            <label htmlFor='s'>Text (999)</label>
          </div>
          <div className='searchFilterMenu__item__checkbox'>
            <input type='checkbox' id='s' />
            <label htmlFor='s'>Text (999)</label>
          </div>
        </div>
        <div>
          <div className='searchFilterMenu__item__title'>
            <button
              className='transparentButton'
              onClick={this.props.onClickCloseSearchFilterMenu}
            >
              <Icon
                icon='fa-fw fas fa-caret-down'
                title={this.props.t('')}
              />
            </button>
          Title
        </div>
          <div className='searchFilterMenu__item__checkbox'>
            <input type='checkbox' id='s' />
            <label htmlFor='s'>Text (999)</label>
          </div>
          <div className='searchFilterMenu__item__checkbox'>
            <input type='checkbox' id='s' />
            <label htmlFor='s'>Text (999)</label>
          </div>
          <div className='searchFilterMenu__item__checkbox'>
            <input type='checkbox' id='s' />
            <label htmlFor='s'>Text (999)</label>
          </div>
          <div className='searchFilterMenu__item__checkbox'>
            <input type='checkbox' id='s' />
            <label htmlFor='s'>Text (999)</label>
          </div>
        </div>
        <div>
          <div className='searchFilterMenu__item__title'>
            <button
              className='transparentButton'
              onClick={this.props.onClickCloseSearchFilterMenu}
            >
              <Icon
                icon='fa-fw fas fa-caret-down'
                title={this.props.t('')}
              />
            </button>
          Title
        </div>
          <div>
            <div className='searchFilterMenu__item__checkbox'>
              <input type='checkbox' id='s' />
              <label htmlFor='s'>Après le</label>
              <DayPickerInput
                onDayChange={day => console.log(day)}
                formatDate={this.formatDate}
                format={FORMAT}
                parseDate={this.parseDate}
                placeholder={FORMAT}
                locale={this.props.userLang}
                localeUtils={MomentLocaleUtils}
              />
            </div>
            <div className='searchFilterMenu__item__checkbox'>
              <input type='checkbox' id='s' />
              <label htmlFor='s'>Avant le</label>
              <DayPickerInput onDayChange={day => console.log(day)} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default translate()(SearchFilterMenu)

SearchFilterMenu.propTypes = {
  onClickCloseSearchFilterMenu: PropTypes.func.isRequired,
  simpleFacets: PropTypes.object,
  dateRangeFacets: PropTypes.object
}

SearchFilterMenu.defaultProps = {
  simpleFacets: {},
  dateRangeFacets: {}
}

/* Add a "showFilter: true" em cada filtro quando didmount. no onclick envia a key e
procura peo elemento que tem a key, faz o toggle, só mostra se showFilter is false */
