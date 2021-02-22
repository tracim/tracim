import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Icon } from 'tracim_frontend_lib'
import DateFilter from '../component/Search/DateFilter.jsx'
import ContentFacets from '../component/Search/ContentFacets.jsx'
import {
  ADVANCED_SEARCH_TYPE,
  DATE_FILTER_ELEMENT,
  SEARCH_FIELD_LIST
} from '../util/helper.js'

export class SearchFilterMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showSearchFieldList: true,
      createdRange: {
        showFilter: true,
        afterDateActive: false,
        afterDate: '',
        beforeDateActive: false,
        beforeDate: ''
      },
      modifiedRange: {
        showFilter: true,
        afterDateActive: false,
        afterDate: '',
        beforeDateActive: false,
        beforeDate: ''
      }
    }
  }

  componentDidMount() {
  }

  handleOpenOrCloseSearchFields = () => {
    this.setState(prev => ({ showSearchFieldList: !prev.showSearchFieldList }))
  }

  handleOpenOrCloseCreatedRange = () => {
    this.setState(prev => ({
      createdRange: {
        ...prev.createdRange,
        showFilter: !prev.createdRange.showFilter
      }
    }))
  }

  handleCheckboxCreatedRange = (type) => {
    const { state } = this

    if (type === DATE_FILTER_ELEMENT.AFTER) {
      state.createdRange.afterDateActive
        ? this.handleChangeCreatedDate('', DATE_FILTER_ELEMENT.AFTER)
        : this.handleChangeCreatedDate(state.createdRange.afterDate, DATE_FILTER_ELEMENT.AFTER)
      this.setState(prev => ({
        createdRange: {
          ...prev.createdRange,
          afterDateActive: !prev.createdRange.afterDateActive
        }
      }))
    } else {
      state.createdRange.beforeDateActive
        ? this.handleChangeCreatedDate('', DATE_FILTER_ELEMENT.BEFORE)
        : this.handleChangeCreatedDate(state.createdRange.beforeDate, DATE_FILTER_ELEMENT.BEFORE)
      this.setState(prev => ({
        createdRange: {
          ...prev.createdRange,
          beforeDateActive: !prev.createdRange.beforeDateActive
        }
      }))
    }
  }

  handleChangeCreatedDate = (date, type) => {
    const { props } = this
    if (type === DATE_FILTER_ELEMENT.AFTER) {
      this.setState(prev => ({
        createdRange: {
          ...prev.createdRange,
          afterDateActive: true,
          afterDate: date
        }
      }))
      props.onChangeCreatedDate({ from: date })
    } else {
      this.setState(prev => ({
        createdRange: {
          ...prev.createdRange,
          beforeDateActive: true,
          beforeDate: date
        }
      }))
      props.onChangeCreatedDate({ to: date })
    }
  }

  handleOpenOrCloseModifiedRange = () => {
    this.setState(prev => ({
      modifiedRange: {
        ...prev.modifiedRange,
        showFilter: !prev.modifiedRange.showFilter
      }
    }))
  }

  handleCheckboxModifiedRange = (type) => {
    const { state } = this
    if (type === DATE_FILTER_ELEMENT.AFTER) {
      state.modifiedRange.afterDateActive
        ? this.handleChangeModifiedDate('', DATE_FILTER_ELEMENT.AFTER)
        : this.handleChangeModifiedDate(state.modifiedRange.afterDate, DATE_FILTER_ELEMENT.AFTER)
      this.setState(prev => ({
        modifiedRange: {
          ...prev.modifiedRange,
          afterDateActive: !prev.modifiedRange.afterDateActive
        }
      }))
    } else {
      state.modifiedRange.beforeDateActive
        ? this.handleChangeModifiedDate('', DATE_FILTER_ELEMENT.BEFORE)
        : this.handleChangeModifiedDate(state.modifiedRange.beforeDate, DATE_FILTER_ELEMENT.BEFORE)
      this.setState(prev => ({
        modifiedRange: {
          ...prev.modifiedRange,
          beforeDateActive: !prev.modifiedRange.beforeDateActive
        }
      }))
    }
  }

  handleChangeModifiedDate = (date, type) => {
    const { props } = this
    if (type === DATE_FILTER_ELEMENT.AFTER) {
      this.setState(prev => ({
        modifiedRange: {
          ...prev.modifiedRange,
          afterDateActive: true,
          afterDate: date
        }
      }))
      props.onChangeModifiedDate({ from: date })
    } else {
      this.setState(prev => ({
        modifiedRange: {
          ...prev.modifiedRange,
          beforeDateActive: true,
          beforeDate: date
        }
      }))
      props.onChangeModifiedDate({ to: date })
    }
  }

  render() {
    const { props, state } = this
    let currentSearch
    if (props.searchType === ADVANCED_SEARCH_TYPE.CONTENT) {
      currentSearch = props.contentSearch
    }
    /*
      if (state.searchType === ADVANCED_SEARCH_TYPE.USER) {
        currentSearch = props.userSearch
      }

      if (state.searchType === ADVANCED_SEARCH_TYPE.SPACE) {
        currentSearch = props.spaceSearch
      }
    */

    return (
      <div className='searchFilterMenu'>
        <div className='searchFilterMenu__title'>
          <Icon
            icon='fa-fw fas fa-sliders-h'
            title={props.t('Filters')}
          />
          {props.t('Filters')}
          <button
            className='transparentButton'
            onClick={props.onClickCloseSearchFilterMenu}
          >
            <Icon
              icon='fa-fw fas fa-times'
              title={props.t('Close')}
            />
          </button>
        </div>

        <div className='searchFilterMenu__content'>
          {currentSearch.searchFieldList.length > 0 && (
            <div className='searchFilterMenu__content__item__title'>
              <button
                className='transparentButton'
                onClick={this.handleOpenOrCloseSearchFields}
              >
                <Icon
                  icon={state.showSearchFieldList
                    ? 'fa-fw fas fa-caret-down'
                    : 'fa-fw fas fa-caret-right'}
                  title={state.showSearchFieldList
                    ? props.t('Hide {{filter}}', { filter: props.t('Search Fields') })
                    : props.t('Show {{filter}}', { filter: props.t('Search Fields') })}
                />
              </button>
              {props.t('Only search at')}
            </div>
          )}

          {state.showSearchFieldList && currentSearch.searchFieldList.map(field => (
            <div className='searchFilterMenu__content__item__checkbox' key={`item__${field}`}>
              <input
                type='checkbox'
                id={`item__${field}`}
                onChange={(e) => props.onClickSearchField(e.currentTarget.checked, field)}
              />
              <label htmlFor={`item__${field}`}>
                {(SEARCH_FIELD_LIST.find(searchField => searchField.slug === field) || { label: '' }).label}
              </label>
            </div>
          ))}

          {currentSearch.createdRange && Object.keys(currentSearch.createdRange).length > 0 && (
            <>
              <div className='searchFilterMenu__content__item__title'>
                <button
                  className='transparentButton'
                  onClick={this.handleOpenOrCloseCreatedRange}
                >
                  <Icon
                    icon={state.createdRange.showFilter
                      ? 'fa-fw fas fa-caret-down'
                      : 'fa-fw fas fa-caret-right'}
                    title={state.createdRange.showFilter
                      ? props.t('Hide {{filter}}', { filter: props.t('Creation') })
                      : props.t('Show {{filter}}', { filter: props.t('Creation') })}
                  />
                </button>
                {props.t('Creation')}
              </div>
              {state.createdRange.showFilter && (
                <DateFilter
                  id='creation'
                  from={currentSearch.createdRange.from}
                  to={currentSearch.createdRange.to}
                  onChangeDate={this.handleChangeCreatedDate}
                  onClickDateCheckbox={this.handleCheckboxCreatedRange}
                  isAfterCheckboxChecked={state.createdRange.afterDateActive}
                  isBeforeCheckboxChecked={state.createdRange.beforeDateActive}
                  afterDate={state.createdRange.afterDate}
                  beforeDate={state.createdRange.beforeDate}
                />
              )}
            </>
          )}

          {currentSearch.modifiedRange && Object.keys(currentSearch.modifiedRange).length > 0 && (
            <>
              <div className='searchFilterMenu__content__item__title'>
                <button
                  className='transparentButton'
                  onClick={this.handleOpenOrCloseModifiedRange}
                >
                  <Icon
                    icon={state.modifiedRange.showFilter
                      ? 'fa-fw fas fa-caret-down'
                      : 'fa-fw fas fa-caret-right'}
                    title={state.modifiedRange.showFilter
                      ? props.t('Hide {{filter}}', { filter: props.t('Last Intervention') })
                      : props.t('Show {{filter}}', { filter: props.t('Last Intervention') })}
                  />
                </button>
                {props.t('Last Intervention')}
              </div>
              {state.modifiedRange.showFilter && (
                <DateFilter
                  id='modification'
                  from={currentSearch.modifiedRange.from}
                  to={currentSearch.modifiedRange.to}
                  onChangeDate={this.handleChangeModifiedDate}
                  onClickDateCheckbox={this.handleCheckboxModifiedRange}
                  isAfterCheckboxChecked={state.modifiedRange.afterDateActive}
                  isBeforeCheckboxChecked={state.modifiedRange.beforeDateActive}
                  afterDate={state.modifiedRange.afterDate}
                  beforeDate={state.modifiedRange.beforeDate}
                />
              )}
            </>
          )}
          {props.searchType === ADVANCED_SEARCH_TYPE.CONTENT && (
            <ContentFacets
              searchFacets={currentSearch.searchFacets}
              onChangeSearchFacets={(facetObject) => props.onChangeSearchFacets(facetObject)}
            />
          )}
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ contentSearch, spaceSearch, userSearch }) => ({ contentSearch, spaceSearch, userSearch })
export default connect(mapStateToProps)(translate()(SearchFilterMenu))

SearchFilterMenu.propTypes = {
  onClickCloseSearchFilterMenu: PropTypes.func.isRequired,
  searchType: PropTypes.string.isRequired,
  onClickSearchField: PropTypes.func
}

SearchFilterMenu.defaultProps = {
  onClickSearchField: () => { }
}

/* Add a "showFilter: true" em cada filtro quando didmount. no onclick envia a key e
procura peo elemento que tem a key, faz o toggle, só mostra se showFilter is false */
