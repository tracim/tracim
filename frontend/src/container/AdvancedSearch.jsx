import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CUSTOM_EVENT,
  IconButton,
  PAGE,
  PageContent,
  PageTitle,
  PageWrapper,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  appendSearchResultList,
  newFlashMessage,
  resetAppliedFilter,
  setAppliedFilter,
  setBreadcrumbs,
  setCreatedRange,
  setNewestAuthoredContentRange,
  setSearchContentBreadcrumbs,
  setCurrentNumberPage,
  setHeadTitle,
  setModifiedRange,
  setNumberResultsByPage,
  setSearchFacets,
  setSearchString,
  setSearchResultList
} from '../action-creator.sync.js'
import SearchFilterMenu from './SearchFilterMenu.jsx'
import { getAdvancedSearchResult } from '../action-creator.async.js'
import SearchInput from '../component/Search/SearchInput.jsx'
import {
  ADVANCED_SEARCH_FILTER,
  ADVANCED_SEARCH_TYPE,
  FETCH_CONFIG,
  parseSearchUrl
} from '../util/helper.js'
import AdvancedSearchContentList from '../component/Search/AdvancedSearchContentList.jsx'
import AdvancedSearchUserList from '../component/Search/AdvancedSearchUserList.jsx'
import AdvancedSearchSpaceList from '../component/Search/AdvancedSearchSpaceList.jsx'
import classnames from 'classnames'

const qs = require('query-string')
const FIRST_PAGE = 1

export class AdvancedSearch extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      totalHits: 0,
      isFilterMenuOpen: false,
      searchType: ADVANCED_SEARCH_TYPE.CONTENT
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  handleAllAppChangeLanguage = () => {
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  setHeadTitle = () => {
    const { props } = this
    const headTitle = buildHeadTitle(
      [`${props.t('Search results')} : ${parseSearchUrl(qs.parse(props.location.search)).searchString}`]
    )

    props.dispatch(setHeadTitle(headTitle))
  }

  buildBreadcrumbs = () => {
    const { props } = this

    props.dispatch(setBreadcrumbs([{
      link: PAGE.SEARCH_RESULT,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('Search results'),
      isALink: true
    }]))
  }

  componentDidMount () {
    const { props } = this
    for (const searchType of Object.values(ADVANCED_SEARCH_TYPE)) {
      props.dispatch(resetAppliedFilter(searchType))
    }
    this.setHeadTitle()
    this.buildBreadcrumbs()
    const search = parseSearchUrl(qs.parse(props.location.search))
    this.getAllSearchResult(search)
    this.setSearchTab(search.searchType)
  }

  componentDidUpdate (prevProps) {
    const { props } = this
    const prevSearch = parseSearchUrl(qs.parse(prevProps.location.search))
    const currentSearch = parseSearchUrl(qs.parse(props.location.search))

    if (
      prevSearch.searchString !== currentSearch.searchString ||
      prevSearch.currentPage !== currentSearch.currentPage
    ) {
      this.getAllSearchResult(currentSearch)
    }
    if (prevSearch.searchType !== currentSearch.searchType) {
      this.setSearchTab(currentSearch.searchType)
    }

    if (
      prevProps.system.config.instance_name !== props.system.config.instance_name ||
      prevSearch.searchString !== currentSearch.searchString
    ) {
      this.setHeadTitle()
      props.dispatch(resetAppliedFilter(this.state.searchType))
    }
  }

  getSearchResult = async (searchObject, currentSearchLength, searchFieldList, appliedFilters = {}) => {
    const { props, state } = this
    // INFO - G.B. - 2021-02-12 - check if the user comes through an url that is not placed at first page
    const hasFirstPage = !(currentSearchLength < searchObject.numberResultsByPage * (searchObject.currentPage - 1))
    const isOnlyFacet = Object.keys(appliedFilters).length == 0 && !searchObject.searchString

    let pageSize = searchObject.numberResultsByPage
    if (isOnlyFacet) {
      pageSize = 0
    } else {
      pageSize = searchObject.numberResultsByPage * searchObject.currentPage
    }

    const fetchGetAdvancedSearchResult = await props.dispatch(getAdvancedSearchResult(
      searchObject.searchString,
      searchObject.contentTypes,
      hasFirstPage
        ? searchObject.currentPage
        : FIRST_PAGE,
      pageSize,
      searchObject.showArchived,
      searchObject.showDeleted,
      searchObject.showActive,
      searchObject.searchType,
      searchFieldList,
      appliedFilters.createdRange || {},
      appliedFilters.modifiedRange || {},
      appliedFilters.newestAuthoredContentRange || {},
      appliedFilters.searchFacets || {}
    ))

    switch (fetchGetAdvancedSearchResult.status) {
      case 200: {
        let resultList
        if (searchObject.searchType === ADVANCED_SEARCH_TYPE.CONTENT) {
          resultList = fetchGetAdvancedSearchResult.json.contents
        }

        if (searchObject.searchType === ADVANCED_SEARCH_TYPE.USER) {
          resultList = fetchGetAdvancedSearchResult.json.users
        }

        if (searchObject.searchType === ADVANCED_SEARCH_TYPE.SPACE) {
          resultList = fetchGetAdvancedSearchResult.json.workspaces
        }

        props.dispatch(setSearchString(searchObject.searchString))
        props.dispatch(setCurrentNumberPage(searchObject.currentPage, searchObject.searchType))
        props.dispatch(setNumberResultsByPage(searchObject.numberResultsByPage))
        props.dispatch(setNewestAuthoredContentRange(fetchGetAdvancedSearchResult.json.newest_authored_content_date_range, searchObject.searchType))
        props.dispatch(setCreatedRange(fetchGetAdvancedSearchResult.json.created_range, searchObject.searchType))
        props.dispatch(setModifiedRange(fetchGetAdvancedSearchResult.json.modified_range, searchObject.searchType))
        props.dispatch(setSearchFacets(fetchGetAdvancedSearchResult.json.facets, searchObject.searchType))
        if (searchObject.currentPage === FIRST_PAGE || !hasFirstPage) {
          props.dispatch(setSearchResultList(resultList, searchObject.searchType))
        } else {
          props.dispatch(appendSearchResultList(resultList, searchObject.searchType))
        }
        if (searchObject.searchType === this.state.searchType) this.setState({ totalHits: fetchGetAdvancedSearchResult.json.total_hits })
        if (searchObject.searchType === ADVANCED_SEARCH_TYPE.CONTENT) this.buildContentBreadcrumbs()
        break
      }
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
        break
    }
  }

  handleChangeSearchFieldList = (field) => {
    const { props, state } = this
    const currentSearch = this.getCurrentSearchObject()

    const oldAppliedSearchFieldList = currentSearch.appliedFilters.searchField || []

    const newAppliedSearchFieldList = oldAppliedSearchFieldList.includes(field.id)
      ? oldAppliedSearchFieldList.filter(searchField => searchField !== field.id)
      : [...oldAppliedSearchFieldList, field.id]

    props.dispatch(setAppliedFilter(ADVANCED_SEARCH_FILTER.SEARCH_FIELD, newAppliedSearchFieldList, state.searchType))

    this.getSearchResult(
      { ...currentSearch, searchType: state.searchType },
      currentSearch.resultList.length,
      newAppliedSearchFieldList,
      currentSearch.appliedFilters.newestAuthoredContentRange,
      currentSearch.appliedFilters.createdRange,
      currentSearch.appliedFilters.modifiedRange,
      currentSearch.appliedFilters.searchFacets
    )
  }

  handleChangeNewestAuthoredContentDate = (dateObject) => {
    const currentSearch = this.getCurrentSearchObject()

    this.updateAppliedFilter(
      ADVANCED_SEARCH_FILTER.NEWEST_AUTHORED_CONTENT_RANGE,
      currentSearch.appliedFilters.newestAuthoredContentRange,
      dateObject
    )
  }

  handleChangeCreatedRange = (dateObject) => {
    const currentSearch = this.getCurrentSearchObject()

    this.updateAppliedFilter(
      ADVANCED_SEARCH_FILTER.CREATED_RANGE,
      currentSearch.appliedFilters.createdRange,
      dateObject
    )
  }

  handleChangeModifiedRange = (dateObject) => {
    const currentSearch = this.getCurrentSearchObject()

    this.updateAppliedFilter(
      ADVANCED_SEARCH_FILTER.MODIFIED_RANGE,
      currentSearch.appliedFilters.modifiedRange,
      dateObject
    )
  }

  handleChangeSearchFacets = (facetObject) => {
    const currentSearch = this.getCurrentSearchObject()
    this.updateAppliedFilter(
      ADVANCED_SEARCH_FILTER.SEARCH_FACETS,
      currentSearch.appliedFilters.searchFacets,
      facetObject
    )
  }

  updateAppliedFilter = (type, oldAppliedFilter, filterObject) => {
    const { props, state } = this
    const currentSearch = this.getCurrentSearchObject()

    let newAppliedFilter = oldAppliedFilter ? { ...oldAppliedFilter } : filterObject
    const filterKey = Object.keys(filterObject)[0]

    if (oldAppliedFilter) {
      if (Object.keys(oldAppliedFilter).includes(filterKey)) {
        if (Array.isArray(newAppliedFilter[filterKey])) {
          if (newAppliedFilter[filterKey].find(filter => filter === filterObject[filterKey][0])) {
            newAppliedFilter[filterKey] = newAppliedFilter[filterKey].filter(filter => filter !== filterObject[filterKey][0])
          } else newAppliedFilter[filterKey] = newAppliedFilter[filterKey].concat(filterObject[filterKey])
        } else delete newAppliedFilter[filterKey]
      } else newAppliedFilter = { ...newAppliedFilter, ...filterObject }
    }

    props.dispatch(setAppliedFilter(type, newAppliedFilter, state.searchType))

    this.getSearchResult(
      { ...currentSearch, searchType: state.searchType },
      currentSearch.resultList.length,
      currentSearch.appliedFilters.searchFieldList,
      {
        ...currentSearch.appliedFilters,
        [type]: newAppliedFilter
      }
    )
  }

  getAllSearchResult = (searchObject) => {
    const { props } = this
    for (const searchType of Object.values(ADVANCED_SEARCH_TYPE)) {
      const searchTypeObject = this.getSearchObject(searchType)
      this.getSearchResult({
        ...searchObject,
        currentPage: FIRST_PAGE,
        searchType: searchType
      }, searchTypeObject ? searchTypeObject.resultList.length : 0)
    }
  }

  setSearchTab = (searchType) => {
    const { props } = this
    if (Object.values(ADVANCED_SEARCH_TYPE).includes(searchType)) {
      this.setState({ searchType: searchType })
    } else {
      // Default to content search (??)
      const contentSearchQuery = qs.stringify(
        { ...qs.parse(props.location.search), s: ADVANCED_SEARCH_TYPE.CONTENT },
        { encode: true }
      )
      props.history.push(
        `${PAGE.SEARCH_RESULT}?${contentSearchQuery}`
      )
    }
  }

  buildContentBreadcrumbs = () => {
    const { state, props } = this
    if (state.searchType !== ADVANCED_SEARCH_TYPE.CONTENT) return

    props.contentSearch.resultList.forEach((content) => {
      const workspace = {
        link: PAGE.WORKSPACE.DASHBOARD(content.workspaceId),
        label: content.workspace.label,
        type: BREADCRUMBS_TYPE.APP_FEATURE,
        isALink: true
      }
      const contentBreadcrumbsList = content.path.map(crumb => ({
        link: PAGE.WORKSPACE.CONTENT(content.workspaceId, crumb.content_type, crumb.content_id),
        label: crumb.label,
        type: BREADCRUMBS_TYPE.APP_FEATURE,
        isALink: true
      }))
      props.dispatch(setSearchContentBreadcrumbs(
        [workspace, ...contentBreadcrumbsList],
        content.contentId,
        state.searchType
      ))
    })
  }

  getContentName = (content) => {
    // FIXME - GB - 2019-06-04 - we need to have a better way to check if it is a file than using contentType[1]
    // https://github.com/tracim/tracim/issues/1840
    const { props } = this
    let contentName = ''

    if (props.contentType.length > 1) {
      contentName = content.contentType === props.contentType[1].slug ? content.filename : content.label
    } else {
      props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
    }
    return contentName
  }

  getCurrentSearchObject = () => {
    const { state } = this
    return this.getSearchObject(state.searchType)
  }

  getSearchObject = (searchType) => {
    const { props } = this
    if (searchType === ADVANCED_SEARCH_TYPE.CONTENT) return props.contentSearch
    if (searchType === ADVANCED_SEARCH_TYPE.USER) return props.userSearch
    if (searchType === ADVANCED_SEARCH_TYPE.SPACE) return props.spaceSearch
    return {}
  }

  handleClickSeeMore = async () => {
    const { props } = this
    const currentSearch = this.getCurrentSearchObject()
    props.history.push(
      `${PAGE.SEARCH_RESULT}?${qs.stringify({ ...qs.parse(props.location.search), p: currentSearch.currentPage + 1 }, { encode: true })}`
    )
  }

  handleClickFilterMenu = () => this.setState(prev => ({ isFilterMenuOpen: !prev.isFilterMenuOpen }))

  handleClickSearch = searchString => {
    const { props } = this
    props.history.push(`${PAGE.SEARCH_RESULT}?${qs.stringify({
      ...qs.parse(props.location.search),
      q: searchString,
      p: FIRST_PAGE
    }, { encode: true })}`)
  }

  getDisplayDetail () {
    const { props, state } = this
    const totalResultsNumber = state.totalHits
    const currentSearch = this.getCurrentSearchObject()

    if (totalResultsNumber <= 0) return ''

    return props.t('Showing {{displayedResults}} of {{totalResults}} results', {
      displayedResults: currentSearch.resultList.length,
      totalResults: totalResultsNumber
    })
  }

  hasMoreResults () {
    const { state } = this
    const currentNumberSearchResults = state.totalHits
    const currentSearch = this.getCurrentSearchObject()
    const maxNumberSearchResults = currentSearch.numberResultsByPage * currentSearch.currentPage
    return currentSearch.resultList.length !== 0 && currentNumberSearchResults >= maxNumberSearchResults
  }

  handleChangeSearchType = (e) => {
    const { props } = this
    props.history.push(
      `${PAGE.SEARCH_RESULT}?${qs.stringify({ ...qs.parse(props.location.search), s: e.currentTarget.value }, { encode: true })}`
    )
  }

  render () {
    const { props, state } = this
    const currentSearch = this.getCurrentSearchObject()
    const currentNumberSearchResults = currentSearch.resultList.length
    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='advancedSearch__wrapper'>
            <PageTitle
              title={(currentNumberSearchResults === 1
                ? props.t('Result for "{{keywords}}"', { keywords: currentSearch.searchString })
                : props.t('Results for "{{keywords}}"', { keywords: currentSearch.searchString })
              )}
              icon='fas fa-search'
              breadcrumbsList={props.breadcrumbs}
            />

            <PageContent parentClass={classnames('advancedSearch', { advancedSearch__openMenu: state.isFilterMenuOpen })}>
              <div className='advancedSearch__input'>
                <div className='advancedSearch__input__type'>
                  <input
                    onChange={this.handleChangeSearchType}
                    value={ADVANCED_SEARCH_TYPE.CONTENT}
                    checked={state.searchType === ADVANCED_SEARCH_TYPE.CONTENT}
                    type='radio'
                    id={`radio-${ADVANCED_SEARCH_TYPE.CONTENT}`}
                  />
                  <label htmlFor={`radio-${ADVANCED_SEARCH_TYPE.CONTENT}`}>
                    {props.t('Contents')}
                  </label>
                  <input
                    onChange={this.handleChangeSearchType}
                    value={ADVANCED_SEARCH_TYPE.SPACE}
                    checked={state.searchType === ADVANCED_SEARCH_TYPE.SPACE}
                    type='radio'
                    id={`radio-${ADVANCED_SEARCH_TYPE.SPACE}`}
                  />
                  <label htmlFor={`radio-${ADVANCED_SEARCH_TYPE.SPACE}`}>
                    {props.t('Spaces')}
                  </label>
                  <input
                    onChange={this.handleChangeSearchType}
                    value={ADVANCED_SEARCH_TYPE.USER}
                    checked={state.searchType === ADVANCED_SEARCH_TYPE.USER}
                    type='radio'
                    id={`radio-${ADVANCED_SEARCH_TYPE.USER}`}
                  />
                  <label htmlFor={`radio-${ADVANCED_SEARCH_TYPE.USER}`}>
                    {props.t('Users')}
                  </label>
                </div>
                <SearchInput
                  onClickSearch={this.handleClickSearch}
                  searchString={currentSearch.searchString}
                />
              </div>

              <div className='advancedSearch__page'>
                <div className='advancedSearch__content'>
                  <div className='advancedSearch__content__detail'>
                    {state.searchString && (
                      <div className='advancedSearch__content__detail__count'>
                        {this.getDisplayDetail()}
                      </div>
                    )}

                    {!state.isFilterMenuOpen && (
                      <IconButton
                        customClass='advancedSearch__content__detail__filter'
                        icon='fas fa-sliders-h'
                        onClick={this.handleClickFilterMenu}
                        text={props.t('Filter')}
                        title={props.t('Search filters')}
                      />
                    )}
                  </div>

                  {currentNumberSearchResults === 0 && (
                    <div className='advancedSearch__content__empty'>
                      {`${props.t('No results for the search terms')}: "${currentSearch.searchString}"`}
                    </div>
                  )}

                  {state.searchType === ADVANCED_SEARCH_TYPE.CONTENT && (
                    <AdvancedSearchContentList
                      contentSearch={props.contentSearch}
                      contentType={props.contentType}
                      userLang={props.user.lang}
                    />
                  )}

                  {state.searchType === ADVANCED_SEARCH_TYPE.USER && (
                    <AdvancedSearchUserList
                      apiUrl={FETCH_CONFIG.apiUrl}
                      userSearch={props.userSearch}
                    />
                  )}

                  {state.searchType === ADVANCED_SEARCH_TYPE.SPACE && (
                    <AdvancedSearchSpaceList
                      spaceSearch={props.spaceSearch}
                      workspaceList={props.workspaceList}
                    />
                  )}

                  <div className='advancedSearch__content__btnSeeMore'>
                    {(this.hasMoreResults()
                      ? (
                        <IconButton
                          onClick={this.handleClickSeeMore}
                          icon='fas fa-chevron-down'
                          text={props.t('See more')}
                        />
                      )
                      : currentNumberSearchResults > currentSearch.numberResultsByPage &&
                      props.t('No more results')
                    )}
                  </div>
                </div>
                {state.isFilterMenuOpen && (
                  <SearchFilterMenu
                    onClickCloseSearchFilterMenu={this.handleClickFilterMenu}
                    currentSearch={currentSearch}
                    searchType={state.searchType}
                    onClickSearchField={this.handleChangeSearchFieldList}
                    onChangeNewestAuthoredContentDate={this.handleChangeNewestAuthoredContentDate}
                    onChangeCreatedDate={this.handleChangeCreatedRange}
                    onChangeModifiedDate={this.handleChangeModifiedRange}
                    onChangeSearchFacets={this.handleChangeSearchFacets}
                  />
                )}
              </div>
            </PageContent>
          </PageWrapper>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, contentSearch, spaceSearch, contentType, userSearch, system, user, workspaceList }) => ({
  breadcrumbs,
  contentSearch,
  spaceSearch,
  userSearch,
  contentType,
  system,
  user,
  workspaceList
})
export default connect(mapStateToProps)(translate()(TracimComponent(AdvancedSearch)))
