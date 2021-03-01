import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Icon } from 'tracim_frontend_lib'
import DateFilter from '../component/Search/DateFilter.jsx'
import ContentFacets from '../component/Search/ContentFacets.jsx'
import SpaceFacets from '../component/Search/SpaceFacets.jsx'
import CheckboxFilter from '../component/Search/CheckboxFilter.jsx'
import {
  ADVANCED_SEARCH_TYPE,
  DATE_FILTER_ELEMENT
} from '../util/helper.js'

export class SearchFilterMenu extends React.Component {
  constructor (props) {
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
    this.handleChangeCreatedDate(
      state.createdRange[`${type}DateActive`]
        ? ''
        : state.createdRange[`${type}Date`],
      type
    )
    this.setState(prev => ({
      createdRange: {
        ...prev.createdRange,
        [`${type}DateActive`]: !prev.createdRange[`${type}DateActive`]
      }
    }))
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
    this.handleChangeModifiedDate(
      state.modifiedRange[`${type}DateActive`]
        ? ''
        : state.modifiedRange[`${type}Date`],
      type
    )
    this.setState(prev => ({
      modifiedRange: {
        ...prev.modifiedRange,
        [`${type}DateActive`]: !prev.modifiedRange[`${type}DateActive`]
      }
    }))
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

  render () {
    const { props, state } = this
    const CONTENT_FIELD_LIST = [
      { slug: 'label', value: props.t('Title') },
      { slug: 'raw_content', value: props.t('Content') },
      { slug: 'comments', value: props.t('Comments') },
      { slug: 'description', value: props.t('Description') }
    ]

    const SPACE_FIELD_LIST = [
      { slug: 'label', value: props.t('Name') },
      { slug: 'description', value: props.t('Description') }
    ]

    const SEARCH_FIELDS = {
      content: CONTENT_FIELD_LIST,
      workspace: SPACE_FIELD_LIST
    }

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
          <CheckboxFilter
            appliedFilterList={SEARCH_FIELDS[props.searchType].filter(field => (
              props.currentSearch.appliedFilters.searchField && props.currentSearch.appliedFilters.searchField.includes(field.slug)
            ))}
            filterList={SEARCH_FIELDS[props.searchType]}
            label={props.t('Only search in')}
            onChangeSearchFacets={(value) => props.onClickSearchField(SEARCH_FIELDS[props.searchType].find(field => field.value === value))}
            onClickOpenOrCloseFilter={this.handleOpenOrCloseSearchFields}
            showFilter={state.showSearchFieldList}
          />

          {props.currentSearch.createdRange && Object.keys(props.currentSearch.createdRange).length > 0 && (
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
              {state.createdRange.showFilter && props.currentSearch.createdRange && (
                <DateFilter
                  id='creation'
                  from={props.currentSearch.createdRange.from}
                  to={props.currentSearch.createdRange.to}
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

          {props.currentSearch.modifiedRange && Object.keys(props.currentSearch.modifiedRange).length > 0 && (
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
                      ? props.t('Hide {{filter}}', { filter: props.t('Last Modification') })
                      : props.t('Show {{filter}}', { filter: props.t('Last Modification') })}
                  />
                </button>
                {props.t('Last Modification')}
              </div>
              {state.modifiedRange.showFilter && props.currentSearch.modifiedRange && (
                <DateFilter
                  id='modification'
                  from={props.currentSearch.modifiedRange.from}
                  to={props.currentSearch.modifiedRange.to}
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
          {props.searchType === ADVANCED_SEARCH_TYPE.CONTENT && props.currentSearch.searchFacets && (
            <ContentFacets
              searchFacets={props.currentSearch.searchFacets}
              onChangeSearchFacets={(facetObject) => props.onChangeSearchFacets(facetObject)}
              appliedFilters={props.currentSearch.appliedFilters.searchFacets || {}}
            />
          )}

          {props.searchType === ADVANCED_SEARCH_TYPE.SPACE && props.currentSearch.searchFacets && (
            <SpaceFacets
              searchFacets={props.currentSearch.searchFacets}
              onChangeSearchFacets={(facetObject) => props.onChangeSearchFacets(facetObject)}
              appliedFilters={props.currentSearch.appliedFilters.searchFacets || {}}
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
  currentSearch: PropTypes.object.isRequired,
  searchType: PropTypes.string.isRequired,
  onChangeCreatedDate: PropTypes.func,
  onChangeModifiedDate: PropTypes.func,
  onClickSearchField: PropTypes.func
}

SearchFilterMenu.defaultProps = {
  onClickSearchField: () => { },
  onChangeCreatedDate: () => { },
  onChangeModifiedDate: () => { }
}
