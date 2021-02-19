import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Icon } from 'tracim_frontend_lib'
import DayPicker from './DayPicker.jsx'

export class SearchFilterMenu extends React.Component {
  render () {
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
        <div className='searchFilterMenu__content'>
          <div>
            <div className='searchFilterMenu__content__item__title'>
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
            <div className='searchFilterMenu__content__item__checkbox'>
              <input type='checkbox' id='s' />
              <label htmlFor='s'>Text (999)</label>
            </div>
            <div className='searchFilterMenu__content__item__checkbox'>
              <input type='checkbox' id='s' />
              <label htmlFor='s'>Text (999)</label>
            </div>
            <div className='searchFilterMenu__content__item__checkbox'>
              <input type='checkbox' id='s' />
              <label htmlFor='s'>Text (999)</label>
            </div>
            <div className='searchFilterMenu__content__item__checkbox'>
              <input type='checkbox' id='s' />
              <label htmlFor='s'>Text (999)</label>
            </div>
          </div>
          <div>
            <div className='searchFilterMenu__content__item__title'>
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
            <div className='searchFilterMenu__content__item__checkbox'>
              <input type='checkbox' id='s' />
              <label htmlFor='s'>Text (999)</label>
            </div>
            <div className='searchFilterMenu__content__item__checkbox'>
              <input type='checkbox' id='s' />
              <label htmlFor='s'>Text (999)</label>
            </div>
            <div className='searchFilterMenu__content__item__checkbox'>
              <input type='checkbox' id='s' />
              <label htmlFor='s'>Text (999)</label>
            </div>
            <div className='searchFilterMenu__content__item__checkbox'>
              <input type='checkbox' id='s' />
              <label htmlFor='s'>Text (999)</label>
            </div>
          </div>
          <div>
            <div className='searchFilterMenu__content__item__title'>
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
              <div className='searchFilterMenu__content__item__checkbox'>
                <input type='checkbox' id='s' />
                <label htmlFor='s'>Après le</label>
                <DayPicker />
              </div>
              <div className='searchFilterMenu__content__item__checkbox'>
                <input type='checkbox' id='s' />
                <label htmlFor='s'>Avant le</label>
                <DayPicker />
              </div>
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
