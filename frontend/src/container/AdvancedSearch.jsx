import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CUSTOM_EVENT,
  EmptyListMessage,
  IconButton,
  PAGE,
  PageContent,
  PageTitle,
  PageWrapper,
  TracimComponent,
  Loading
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
      searchType: ADVANCED_SEARCH_TYPE.CONTENT,
      isLoading: true
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
    const { props } = this
    // INFO - G.B. - 2021-02-12 - check if the user comes through an url that is not placed at first page
    const hasFirstPage = !(currentSearchLength < searchObject.numberResultsByPage * (searchObject.currentPage - 1))
    const onlyGetFacet = (
      Object.values(appliedFilters).filter(item => !Array.isArray(item)).every(item => Object.keys(item).length === 0) &&
      searchFieldList.length === 0 &&
      !searchObject.searchString
    )

    let pageNumber = searchObject.currentPage
    let pageSize = searchObject.numberResultsByPage
    if (onlyGetFacet) {
      // NOTE - S.G. - 2021-03-09 - setting pageSize to 0 allows to get the search facets
      // without any results.
      pageSize = 0
    } else if (!hasFirstPage) {
      pageNumber = FIRST_PAGE
      pageSize = searchObject.numberResultsByPage * searchObject.currentPage
    }

    const fetchGetAdvancedSearchResult = await props.dispatch(getAdvancedSearchResult(
      searchObject.searchString,
      searchObject.contentTypes,
      pageNumber,
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
    this.setState({ isLoading: false })
  }

  handleChangeSearchFieldList = (field) => {
    const { props, state } = this
    const currentSearch = this.getCurrentSearchObject()

    const oldAppliedSearchFieldList = currentSearch.appliedFilters.searchFieldList || []

    const newAppliedSearchFieldList = oldAppliedSearchFieldList.includes(field.id)
      ? oldAppliedSearchFieldList.filter(searchField => searchField !== field.id)
      : [...oldAppliedSearchFieldList, field.id]

    props.dispatch(setAppliedFilter(ADVANCED_SEARCH_FILTER.SEARCH_FIELD, newAppliedSearchFieldList, state.searchType))

    this.getSearchResult(
      { ...currentSearch, searchType: state.searchType },
      0, // INFO - CH - 20210319 - Force to 0 to force hasFirstPage (from getSearchResult()) to be evaluated to false to
      // load previous pages in case we already clicked on "see more" button
      newAppliedSearchFieldList,
      currentSearch.appliedFilters
    )
  }

  handleChangeNewestAuthoredContentDate = (dateObject) => {
    const currentSearch = this.getCurrentSearchObject()

    this.updateAppliedFilter(
      ADVANCED_SEARCH_FILTER.NEWEST_AUTHORED_CONTENT_RANGE,
      currentSearch.appliedFilters.newestAuthoredContentRange,
      dateObject,
      this.updateScalar
    )
  }

  handleChangeCreatedRange = (dateObject) => {
    const currentSearch = this.getCurrentSearchObject()

    this.updateAppliedFilter(
      ADVANCED_SEARCH_FILTER.CREATED_RANGE,
      currentSearch.appliedFilters.createdRange,
      dateObject,
      this.updateScalar
    )
  }

  handleChangeModifiedRange = (dateObject) => {
    const currentSearch = this.getCurrentSearchObject()

    this.updateAppliedFilter(
      ADVANCED_SEARCH_FILTER.MODIFIED_RANGE,
      currentSearch.appliedFilters.modifiedRange,
      dateObject,
      this.updateScalar
    )
  }

  handleChangeSearchFacets = (facetObject) => {
    const currentSearch = this.getCurrentSearchObject()
    this.updateAppliedFilter(
      ADVANCED_SEARCH_FILTER.SEARCH_FACETS,
      currentSearch.appliedFilters.searchFacets,
      facetObject,
      this.updateList
    )
  }

  updateList = (value, oldValueList = []) => {
    const newValueList = oldValueList.includes(value)
      ? oldValueList.filter(f => f !== value)
      : [...oldValueList, value]
    return newValueList.length > 0 ? newValueList : null
  }

  /* INFO - SG - 2021/06/28 - return the value as it is.
     Used in conjunction with updateAppliedFilter to avoid a
     static if.
   */

  updateScalar = value => value

  updateAppliedFilter = (type, oldAppliedFilter = {}, filterObject, updateFilterValue) => {
    const { props, state } = this

    const filterKey = Object.keys(filterObject)[0]
    const filterValue = filterObject[filterKey]
    const oldFilterValue = oldAppliedFilter[filterKey]

    const newFilterValue = updateFilterValue(filterValue, oldFilterValue)
    /* INFO - SG - 2021/06/28 - If the new filter value is not existing,
       remove the key from the applied filter object, else set its value.
       This is done in order to properly get facets only when no filter is selected.
       Please see onlyGetFacet in getSearchResult().
    */
    let newAppliedFilter
    if (newFilterValue) {
      newAppliedFilter = { ...oldAppliedFilter, [filterKey]: newFilterValue }
    } else {
      newAppliedFilter = { ...oldAppliedFilter }
      delete newAppliedFilter[filterKey]
    }
    props.dispatch(setAppliedFilter(type, newAppliedFilter, state.searchType))
    const currentSearch = this.getCurrentSearchObject()
    this.getSearchResult(
      { ...currentSearch, searchType: state.searchType },
      0, // INFO - CH - 20210319 - Force to 0 to force hasFirstPage (from getSearchResult()) to be evaluated to false to
      // load previous pages in case we already clicked on "see more" button
      currentSearch.appliedFilters.searchFieldList,
      {
        ...currentSearch.appliedFilters,
        [type]: newAppliedFilter
      }
    )
  }

  getAllSearchResult = (searchObject) => {
    for (const searchType of Object.values(ADVANCED_SEARCH_TYPE)) {
      const searchTypeObject = this.getSearchObject(searchType)
      this.getSearchResult(
        {
          ...searchObject,
          currentPage: searchObject.searchType === searchType ? searchObject.currentPage : FIRST_PAGE,
          searchType: searchType
        },
        searchTypeObject && searchTypeObject.resultList ? searchTypeObject.resultList.length : 0,
        searchObject.searchType === searchType ? searchTypeObject.appliedFilters.searchFieldList : [],
        searchObject.searchType === searchType ? searchTypeObject.appliedFilters : {}
      )
    }
  }

  setSearchTab = (searchType) => {
    const { props } = this
    if (Object.values(ADVANCED_SEARCH_TYPE).includes(searchType)) {
      this.setState({ searchType: searchType })
    } else {
      // Default to content search
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

    return props.t('Showing {{displayedResults}} of {{count}} results', {
      displayedResults: currentSearch.resultList.length,
      count: totalResultsNumber
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

    const i18nOpts = {
      keywords: currentSearch.searchString,
      interpolation: { escapeValue: false }
    }

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='advancedSearch__wrapper'>
            <PageTitle
              title={(currentNumberSearchResults === 1
                ? props.t('Result for: {{keywords}}', i18nOpts)
                : props.t('Results for: {{keywords}}', i18nOpts)
              )}
              icon='fas fa-search'
              breadcrumbsList={props.breadcrumbs}
              isEmailNotifActivated={props.system.config.email_notification_activated}
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
              {state.isLoading
                ? <Loading />
                : (
                  <div className='advancedSearch__page'>
                    <div className='advancedSearch__content'>
                      <div className='advancedSearch__content__detail'>
                        {currentNumberSearchResults > 0 && (
                          <span>
                            {this.getDisplayDetail()}
                          </span>
                        )}

                        {!state.isFilterMenuOpen && (
                          <IconButton
                            customClass='advancedSearch__content__detail__filter_button'
                            icon='fas fa-sliders-h'
                            onClick={this.handleClickFilterMenu}
                            text={props.t('Filter')}
                            title={props.t('Search filters')}
                          />
                        )}
                      </div>

                      {currentNumberSearchResults === 0 && (
                        <EmptyListMessage>
                          {`${props.t('No results for the search terms:')} ${currentSearch.searchString}`}
                        </EmptyListMessage>
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
                )}
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
