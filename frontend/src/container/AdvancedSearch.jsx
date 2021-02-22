import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  buildContentPathBreadcrumbs,
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
  setBreadcrumbs,
  setCreatedRange,
  setSearchContentBreadcrumbs,
  setCurrentNumberPage,
  setHeadTitle,
  setModifiedRange,
  setNumberResultsByPage,
  setSearchFacets,
  setSearchFieldList,
  setSearchString,
  setSearchResultList
} from '../action-creator.sync.js'
import SearchFilterMenu from './SearchFilterMenu.jsx'
import { getAdvancedSearchResult } from '../action-creator.async.js'
import SearchInput from '../component/Search/SearchInput.jsx'
import {
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

// TODO - G.B. - 2021-02-16 - All commented code at this component should be evaluated
// and possibly uncommented or explained at https://github.com/tracim/tracim/issues/4097

export class AdvancedSearch extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      totalHits: 0,
      isFilterMenuOpen: true,
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

  componentDidMount() {
    const { props } = this
    const urlSearchObject = parseSearchUrl(qs.parse(props.location.search))

    if (urlSearchObject.searchType !== ADVANCED_SEARCH_TYPE.CONTENT) {
      this.getSearchResult({
        ...urlSearchObject,
        currentPage: FIRST_PAGE,
        searchType: ADVANCED_SEARCH_TYPE.CONTENT
      }, props.contentSearch.resultList.length)
    }

    /*
      if (urlSearchObject.searchType !== ADVANCED_SEARCH_TYPE.USER) {
        this.getSearchResult({
          ...urlSearchObject,
          currentPage: FIRST_PAGE,
          searchType: ADVANCED_SEARCH_TYPE.USER
        }, props.userSearch.resultList.length)
      }

      if (urlSearchObject.searchType !== ADVANCED_SEARCH_TYPE.SPACE) {
        this.getSearchResult({
          ...urlSearchObject,
          currentPage: FIRST_PAGE,
          searchType: ADVANCED_SEARCH_TYPE.SPACE
        }, props.spaceSearch.resultList.length)
      }
    */
    this.setHeadTitle()
    this.buildBreadcrumbs()
    this.loadSearchUrl()
  }

  componentDidUpdate(prevProps) {
    const { props } = this
    const prevSearch = parseSearchUrl(qs.parse(prevProps.location.search))
    const currentSearch = parseSearchUrl(qs.parse(props.location.search))

    if (
      prevSearch.searchString !== currentSearch.searchString ||
      prevSearch.currentPage !== currentSearch.currentPage
    ) {
      this.loadSearchUrl()
    }
    if (
      prevProps.system.config.instance_name !== props.system.config.instance_name ||
      prevSearch.searchString !== currentSearch.searchString
    ) {
      this.setHeadTitle()
    }
  }

  getSearchResult = async (searchObject, currentSearchLength, searchFieldList, createdRange, modifiedRange, searchFacets) => {
    const { props } = this

    // INFO - G.B. - 2021-02-12 - check if the user comes through an url that is not placed at first page
    const hasFirstPage = !(currentSearchLength < searchObject.numberResultsByPage * (searchObject.currentPage - 1))

    const fetchGetAdvancedSearchResult = await props.dispatch(getAdvancedSearchResult(
      searchObject.searchString,
      searchObject.contentTypes,
      hasFirstPage
        ? searchObject.currentPage
        : FIRST_PAGE,
      hasFirstPage
        ? searchObject.numberResultsByPage
        : searchObject.numberResultsByPage * searchObject.currentPage,
      searchObject.showArchived,
      searchObject.showDeleted,
      searchObject.showActive,
      searchObject.searchType,
      searchFieldList,
      createdRange,
      modifiedRange,
      searchFacets
    ))

    switch (fetchGetAdvancedSearchResult.status) {
      case 200:
        props.dispatch(setSearchString(searchObject.searchString))
        props.dispatch(setCurrentNumberPage(searchObject.currentPage, searchObject.searchType))
        props.dispatch(setNumberResultsByPage(searchObject.numberResultsByPage))
        props.dispatch(setSearchFieldList(fetchGetAdvancedSearchResult.json.search_fields, searchObject.searchType))
        props.dispatch(setCreatedRange(fetchGetAdvancedSearchResult.json.created_range, searchObject.searchType))
        props.dispatch(setModifiedRange(fetchGetAdvancedSearchResult.json.modified_range, searchObject.searchType))
        props.dispatch(setSearchFacets(fetchGetAdvancedSearchResult.json.facets, searchObject.searchType))
        if (searchObject.currentPage === FIRST_PAGE || !hasFirstPage) {
          props.dispatch(setSearchResultList(fetchGetAdvancedSearchResult.json.contents, searchObject.searchType))
        } else {
          props.dispatch(appendSearchResultList(fetchGetAdvancedSearchResult.json.contents, searchObject.searchType))
        }
        if (searchObject.searchType === this.state.searchType) this.setState({ totalHits: fetchGetAdvancedSearchResult.json.total_hits })
        if (searchObject.searchType === ADVANCED_SEARCH_TYPE.CONTENT) this.buildContentBreadcrumbs()
        break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
        break
    }
  }

  handleChangeSearchFieldList = (isCheckboxChecked, field) => {
    const { props, state } = this
    let currentSearch
    if (state.searchType === ADVANCED_SEARCH_TYPE.CONTENT) {
      currentSearch = props.contentSearch
    }
    /*
      if (state.searchType === ADVANCED_SEARCH_TYPE.USER) {
        currentSearch= props.userSearch
      }

      if (state.searchType === ADVANCED_SEARCH_TYPE.SPACE) {
        currentSearch = props.spaceSearch
      }
    */
    if (currentSearch.searchFieldList.find(searchField => searchField === field)) {
      this.getSearchResult(
        { ...currentSearch, searchType: state.searchType },
        currentSearch.resultList.length,
        isCheckboxChecked
          ? currentSearch.searchFieldList.filter(searchField => searchField === field)
          : [],
        currentSearch.createdRange,
        currentSearch.modifiedRange,
        undefined // currentSearch.searchFacets
      )}
  }

  handleChangeCreatedRange = (dateObject) => {
    const { props, state } = this
    let currentSearch

    if (state.searchType === ADVANCED_SEARCH_TYPE.CONTENT) {
      currentSearch = props.contentSearch
    }
    /*
      if (state.searchType === ADVANCED_SEARCH_TYPE.USER) {
        currentSearch= props.userSearch
      }

      if (state.searchType === ADVANCED_SEARCH_TYPE.SPACE) {
        currentSearch = props.spaceSearch
      }
    */

    this.getSearchResult(
      { ...currentSearch, searchType: state.searchType },
      currentSearch.resultList.length,
      currentSearch.searchFieldList,
      { ...currentSearch.createdRange, ...dateObject },
      currentSearch.modifiedRange,
      undefined // currentSearch.searchFacets
    )
  }

  handleChangeModifiedRange = (dateObject) => {
    const { props, state } = this
    let currentSearch

    if (state.searchType === ADVANCED_SEARCH_TYPE.CONTENT) {
      currentSearch = props.contentSearch
    }
    /*
      if (state.searchType === ADVANCED_SEARCH_TYPE.USER) {
        currentSearch= props.userSearch
      }

      if (state.searchType === ADVANCED_SEARCH_TYPE.SPACE) {
        currentSearch = props.spaceSearch
      }
    */

    this.getSearchResult(
      { ...currentSearch, searchType: state.searchType },
      currentSearch.resultList.length,
      currentSearch.searchFieldList,
      currentSearch.createdRange,
      { ...currentSearch.modifiedRange, ...dateObject },
      undefined // currentSearch.searchFacets
    )
  }

  handleChangeSearchFacets = (facetsObject) => {
    const { props, state } = this
    let currentSearch
    console.log('handleChangeSearchFacets', facetsObject)
    if (state.searchType === ADVANCED_SEARCH_TYPE.CONTENT) {
      currentSearch = props.contentSearch
    }
    /*
      if (state.searchType === ADVANCED_SEARCH_TYPE.USER) {
        currentSearch= props.userSearch
      }

      if (state.searchType === ADVANCED_SEARCH_TYPE.SPACE) {
        currentSearch = props.spaceSearch
      }
    */

    this.getSearchResult(
      { ...currentSearch, searchType: state.searchType },
      currentSearch.resultList.length,
      currentSearch.searchFieldList,
      currentSearch.createdRange,
      currentSearch.modifiedRange,
      facetsObject
    )
  }

  loadSearchUrl = () => {
    const searchObject = parseSearchUrl(qs.parse(this.props.location.search))
    let currentSearchLength = 0

    if (searchObject.searchType === ADVANCED_SEARCH_TYPE.CONTENT) {
      currentSearchLength = this.props.contentSearch.resultList.length
    }
    /*
      if (searchObject.searchType === ADVANCED_SEARCH_TYPE.USER) {
        currentSearchLength = props.userSearch.resultList.length
      }

      if (searchObject.searchType === ADVANCED_SEARCH_TYPE.SPACE) {
        currentSearchLength = props.spaceSearch.resultList.length
      }
    */
    this.getSearchResult(searchObject, currentSearchLength)
  }

  buildContentBreadcrumbs = () => {
    const { state, props } = this
    if (state.searchType !== ADVANCED_SEARCH_TYPE.CONTENT) return

    props.contentSearch.resultList.map(async (content) => {
      let contentBreadcrumbsList = []
      try {
        contentBreadcrumbsList = await buildContentPathBreadcrumbs(FETCH_CONFIG.apiUrl, content)
      } catch (e) {
        console.error('Error at advanced search, count not build breadcrumbs', e)
      }
      props.dispatch(setSearchContentBreadcrumbs(contentBreadcrumbsList, content.contentId, state.searchType))
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

  handleClickSeeMore = async () => {
    const { props, state } = this
    let nextPage
    if (state.searchType === ADVANCED_SEARCH_TYPE.CONTENT) {
      nextPage = props.contentSearch.currentPage + 1
    }
    /*
      if (state.searchType === ADVANCED_SEARCH_TYPE.USER) {
        nextPage = props.userSearch.currentPage + 1
      }

      if (state.searchType === ADVANCED_SEARCH_TYPE.SPACE) {
        nextPage = props.spaceSearch.currentPage + 1
      }
    */
    props.history.push(
      `${PAGE.SEARCH_RESULT}?${qs.stringify({ ...qs.parse(props.location.search), p: nextPage }, { encode: true })}`
    )
  }

  handleClickFilterMenu = () => this.setState(prev => ({ isFilterMenuOpen: !prev.isFilterMenuOpen }))

  handleClickSearch = searchString => {
    const { props } = this
    const FIRST_PAGE = 1
    props.history.push(`${PAGE.SEARCH_RESULT}?${qs.stringify({
      ...qs.parse(props.location.search),
      q: searchString,
      p: FIRST_PAGE
    }, { encode: true })}`)
  }

  getDisplayDetail() {
    const { props, state } = this
    const totalResultsNumber = this.state.totalHits
    let displayedResultsNumber

    if (totalResultsNumber <= 0) return ''

    if (state.searchType === ADVANCED_SEARCH_TYPE.CONTENT) {
      displayedResultsNumber = props.contentSearch.resultList.length
    }
    /*
      if (state.searchType === ADVANCED_SEARCH_TYPE.USER) {
        displayedResultsNumber = props.userSearch.resultList.length
      }

      if (state.searchType === ADVANCED_SEARCH_TYPE.SPACE) {
        displayedResultsNumber = props.spaceSearch.resultList.length
      }
    */
    return props.t('Showing {{displayedResults}} of {{totalResults}} results', {
      displayedResults: displayedResultsNumber,
      totalResults: totalResultsNumber
    })
  }

  hasMoreResults() {
    const { props, state } = this
    const currentNumberSearchResults = state.totalHits
    let maxNumberSearchResults = 0
    if (state.searchType === ADVANCED_SEARCH_TYPE.CONTENT) {
      maxNumberSearchResults = (props.contentSearch.numberResultsByPage * props.contentSearch.currentPage)
    }
    /*
      if (state.searchType === ADVANCED_SEARCH_TYPE.USER) {
        maxNumberSearchResults = (props.userSearch.numberResultsByPage * props.userSearch.currentPage)
      }

      if (state.searchType === ADVANCED_SEARCH_TYPE.SPACE) {
        maxNumberSearchResults = (props.spaceSearch.numberResultsByPage * props.spaceSearch.currentPage)
      }
    */
    return currentNumberSearchResults >= maxNumberSearchResults
  }

  handleChangeSearchType = (e) => {
    const { props } = this
    props.history.push(
      `${PAGE.SEARCH_RESULT}?${qs.stringify({ ...qs.parse(props.location.search), s: e.currentTarget.value }, { encode: true })}`
    )
  }

  render() {
    const { props, state } = this
    let currentNumberSearchResults = 0

    if (state.searchType === ADVANCED_SEARCH_TYPE.CONTENT) {
      currentNumberSearchResults = props.contentSearch.resultList.length
    }
    /*
      if (state.searchType === ADVANCED_SEARCH_TYPE.USER) {
        currentNumberSearchResults = props.userSearch.resultList.length
      }

      if (state.searchType === ADVANCED_SEARCH_TYPE.SPACE) {
        currentNumberSearchResults = props.spaceSearch.resultList.length
      }
    */
    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='advancedSearch__wrapper'>
            <PageTitle
              title={(currentNumberSearchResults === 1
                ? props.t('Result for "{{keywords}}"', { keywords: props.contentSearch.searchString })
                : props.t('Results for "{{keywords}}"', { keywords: props.contentSearch.searchString })
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
                  />
                  <span>{props.t('Contents')}</span>
                  <input
                    onChange={this.handleChangeSearchType}
                    value={ADVANCED_SEARCH_TYPE.SPACE}
                    checked={state.searchType === ADVANCED_SEARCH_TYPE.SPACE}
                    type='radio'
                  />
                  <span>{props.t('Spaces')}</span>
                  <input
                    onChange={this.handleChangeSearchType}
                    value={ADVANCED_SEARCH_TYPE.USER}
                    checked={state.searchType === ADVANCED_SEARCH_TYPE.USER}
                    type='radio'
                  />
                  <span>{props.t('Users')}</span>
                </div>
                <SearchInput
                  onClickSearch={this.handleClickSearch}
                  searchString={props.contentSearch.searchString}
                />
              </div>

              <div className='advancedSearch__page'>
                <div className='advancedSearch__content'>
                  {currentNumberSearchResults > 0 && (
                    <div className='advancedSearch__content__detail'>
                      {this.getDisplayDetail()}

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
                  )}

                  {currentNumberSearchResults === 0 && (
                    <div className='advancedSearch__content__empty'>
                      {`${props.t('No results for the search terms')}: "${props.contentSearch.searchString}"`}
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
                      user={props.user}
                      userSearch={props.contentSearch} // {props.userSearch}
                    />
                  )}

                  {state.searchType === ADVANCED_SEARCH_TYPE.SPACE && (
                    <AdvancedSearchSpaceList
                      contentType={props.contentType}
                      spaceSearch={props.contentSearch} // {props.spaceSearch}
                      user={props.user}
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
                      : currentNumberSearchResults > props.contentSearch.numberResultsByPage &&
                      props.t('No more results')
                    )}
                  </div>
                </div>
                {state.isFilterMenuOpen && (
                  <SearchFilterMenu
                    onClickCloseSearchFilterMenu={this.handleClickFilterMenu}
                    searchType={state.searchType}
                    onClickSearchField={this.handleChangeSearchFieldList}
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

const mapStateToProps = ({ breadcrumbs, contentSearch, spaceSearch, contentType, userSearch, system, user }) => ({
  breadcrumbs,
  contentSearch,
  spaceSearch,
  userSearch,
  contentType,
  system,
  user
})
export default connect(mapStateToProps)(translate()(TracimComponent(AdvancedSearch)))
