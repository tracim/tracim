import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Icon } from 'tracim_frontend_lib'
import DateFilter from '../component/Search/DateFilter.jsx'
import UserFacets from '../component/Search/UserFacets.jsx'
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
      newestAuthoredContentRange: {
        showFilter: true,
        afterDateActive: false,
        afterDate: '',
        beforeDateActive: false,
        beforeDate: ''
      },
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

  handleChangeNewestAuthoredContentDate = (date, type) => {
    const { props } = this
    if (type === DATE_FILTER_ELEMENT.AFTER) {
      this.setState(prev => ({
        newestAuthoredContentRange: {
          ...prev.newestAuthoredContentRange,
          afterDateActive: true,
          afterDate: date
        }
      }))
      props.onChangeNewestAuthoredContentDate({ from: date })
    } else {
      this.setState(prev => ({
        newestAuthoredContentRange: {
          ...prev.newestAuthoredContentRange,
          beforeDateActive: true,
          beforeDate: date
        }
      }))
      props.onChangeNewestAuthoredContentDate({ to: date })
    }
  }

  handleCheckboxNewestAuthoredContentDate = (type) => {
    const { state } = this
    this.handleChangeNewestAuthoredContentDate(
      state.newestAuthoredContentRange[`${type}DateActive`]
        ? ''
        : state.newestAuthoredContentRange[`${type}Date`],
      type
    )
    this.setState(prev => ({
      newestAuthoredContentRange: {
        ...prev.newestAuthoredContentRange,
        [`${type}DateActive`]: !prev.newestAuthoredContentRange[`${type}DateActive`]
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

  handleOpenOrCloseNewestAuthoredContentRange = () => {
    this.setState(prev => ({
      newestAuthoredContentRange: {
        ...prev.newestAuthoredContentRange,
        showFilter: !prev.newestAuthoredContentRange.showFilter
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

    const USER_FIELD_LIST = [
      { id: 'public_name', value: props.t('Full name') },
      { id: 'username', value: props.t('Username') },
      { id: 'custom_properties', value: props.t('Profile') }
    ]

    const CONTENT_FIELD_LIST = [
      { id: 'label', value: props.t('Title') },
      { id: 'raw_content', value: props.t('Content') },
      { id: 'comments', value: props.t('Comments') },
      { id: 'description', value: props.t('Description') },
      { id: 'tags', value: props.t('Tags') },
      { id: 'todos', value: props.t('Tasks') }
    ]

    const SPACE_FIELD_LIST = [
      { id: 'label', value: props.t('Name') },
      { id: 'description', value: props.t('Description') }
    ]

    const SEARCH_FIELDS = {
      user: USER_FIELD_LIST,
      content: CONTENT_FIELD_LIST,
      workspace: SPACE_FIELD_LIST
    }

    const currentSearch = props.currentSearch

    const checkedFilterFieldIdList = SEARCH_FIELDS[props.searchType]
      .filter(field => (
        currentSearch.appliedFilters.searchFieldList && currentSearch.appliedFilters.searchFieldList.includes(field.id)
      ))
      .map(field => field.id)

    return (
      <div className='searchFilterMenu'>
        <div className='searchFilterMenu__title'>
          <Icon
            icon='fas fa-sliders-h'
            title={props.t('Filters')}
          />
          {props.t('Filters')}
          <button
            className='transparentButton'
            onClick={props.onClickCloseSearchFilterMenu}
          >
            <Icon
              icon='fas fa-times'
              title={props.t('Close')}
            />
          </button>
        </div>

        <div className='searchFilterMenu__content'>
          <CheckboxFilter
            checkedFilterIdList={checkedFilterFieldIdList}
            filterList={SEARCH_FIELDS[props.searchType]}
            label={props.t('Only search in')}
            onChangeSearchFacets={(value) => props.onClickSearchField(SEARCH_FIELDS[props.searchType].find(field => field.id === value))}
            onClickOpenOrCloseFilter={this.handleOpenOrCloseSearchFields}
            showFilter={state.showSearchFieldList}
          />

          {currentSearch.createdRange && Object.keys(currentSearch.createdRange).length > 0 && (
            <>
              <div className='searchFilterMenu__content__item__title'>
                <button
                  className='transparentButton'
                  onClick={this.handleOpenOrCloseCreatedRange}
                >
                  <Icon
                    icon={state.createdRange.showFilter
                      ? 'fas fa-caret-down'
                      : 'fas fa-caret-right'}
                    title={state.createdRange.showFilter
                      ? props.t('Hide {{filter}}', { filter: props.t('Creation') })
                      : props.t('Show {{filter}}', { filter: props.t('Creation') })}
                  />
                </button>
                {props.t('Creation')}
              </div>
              {state.createdRange.showFilter && currentSearch.createdRange && (
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
                      ? 'fas fa-caret-down'
                      : 'fas fa-caret-right'}
                    title={state.modifiedRange.showFilter
                      ? props.t('Hide {{filter}}', { filter: props.t('Last Modification') })
                      : props.t('Show {{filter}}', { filter: props.t('Last Modification') })}
                  />
                </button>
                {props.t('Last Modification')}
              </div>
              {state.modifiedRange.showFilter && currentSearch.modifiedRange && (
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

          {currentSearch.newestAuthoredContentRange && Object.keys(currentSearch.newestAuthoredContentRange).length > 0 && (
            <>
              <div className='searchFilterMenu__content__item__title'>
                <button
                  className='transparentButton'
                  onClick={this.handleOpenOrCloseNewestAuthoredContentRange}
                >
                  <Icon
                    icon={state.newestAuthoredContentRange.showFilter
                      ? 'fas fa-caret-down'
                      : 'fas fa-caret-right'}
                    title={state.newestAuthoredContentRange.showFilter
                      ? props.t('Hide {{filter}}', { filter: props.t('Last Intervention') })
                      : props.t('Show {{filter}}', { filter: props.t('Last Intervention') })}
                  />
                </button>
                {props.t('Last Intervention')}
              </div>
              {state.newestAuthoredContentRange.showFilter && currentSearch.newestAuthoredContentRange && (
                <DateFilter
                  id='intervention'
                  from={currentSearch.newestAuthoredContentRange.from}
                  to={currentSearch.newestAuthoredContentRange.to}
                  onChangeDate={this.handleChangeNewestAuthoredContentDate}
                  onClickDateCheckbox={this.handleCheckboxNewestAuthoredContentDate}
                  isAfterCheckboxChecked={state.newestAuthoredContentRange.afterDateActive}
                  isBeforeCheckboxChecked={state.newestAuthoredContentRange.beforeDateActive}
                  afterDate={state.newestAuthoredContentRange.afterDate}
                  beforeDate={state.newestAuthoredContentRange.beforeDate}
                />
              )}
            </>
          )}

          {props.searchType === ADVANCED_SEARCH_TYPE.USER && currentSearch.searchFacets && (
            <UserFacets
              searchFacets={currentSearch.searchFacets}
              onChangeSearchFacets={(facetObject) => props.onChangeSearchFacets(facetObject)}
              appliedFilters={currentSearch.appliedFilters.searchFacets || {}}
            />
          )}

          {props.searchType === ADVANCED_SEARCH_TYPE.CONTENT && currentSearch.searchFacets && (
            <ContentFacets
              searchFacets={currentSearch.searchFacets}
              onChangeSearchFacets={(facetObject) => props.onChangeSearchFacets(facetObject)}
              appliedFilters={currentSearch.appliedFilters.searchFacets || {}}
            />
          )}

          {props.searchType === ADVANCED_SEARCH_TYPE.SPACE && currentSearch.searchFacets && (
            <SpaceFacets
              searchFacets={currentSearch.searchFacets}
              onChangeSearchFacets={(facetObject) => props.onChangeSearchFacets(facetObject)}
              appliedFilters={currentSearch.appliedFilters.searchFacets || {}}
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
  onChangeNewestAuthoredContentDate: PropTypes.func,
  onChangeModifiedDate: PropTypes.func,
  onClickSearchField: PropTypes.func
}

SearchFilterMenu.defaultProps = {
  onClickSearchField: () => { },
  onChangeNewestAuthoredContentDate: () => { },
  onChangeCreatedDate: () => { },
  onChangeModifiedDate: () => { }
}
