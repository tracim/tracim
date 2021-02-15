import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  PageWrapper,
  PageTitle,
  PageContent,
  IconButton,
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT,
  buildHeadTitle,
  PAGE,
  TracimComponent
} from 'tracim_frontend_lib'
import {
  newFlashMessage,
  setCurrentNumberPage,
  appendSearchResultList,
  setSearchResultList,
  setNumberResultsByPage,
  setSearchedKeywords,
  setBreadcrumbs,
  setHeadTitle
} from '../action-creator.sync.js'
import { getAdvancedSearchResult } from '../action-creator.async.js'
import SearchInput from '../component/Search/SearchInput.jsx'
import { ADVANCED_SEARCH_TYPE, parseSearchUrl } from '../util/helper.js'
import SearchFilterMenu from '../component/Search/SearchFilterMenu.jsx'
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
      currentSearch: {}
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
      [`${props.t('Search results')} : ${parseSearchUrl(qs.parse(props.location.search)).searchedKeywords}`]
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
    const searchObject = parseSearchUrl(qs.parse(props.location.search))

    if (searchObject.searchType !== ADVANCED_SEARCH_TYPE.CONTENT) {
      this.getSearchResult({
        ...searchObject,
        currentPage: FIRST_PAGE,
        searchType: ADVANCED_SEARCH_TYPE.CONTENT
      }, props.contentSearch)
    } else this.setState({ currentSearch: props.contentSearch })

    if (searchObject.searchType !== ADVANCED_SEARCH_TYPE.USER) {
      this.getSearchResult({
        ...searchObject,
        currentPage: FIRST_PAGE,
        searchType: ADVANCED_SEARCH_TYPE.USER
      }, props.userSearch)
    } else this.setState({ currentSearch: props.userSearch })

    if (searchObject.searchType !== ADVANCED_SEARCH_TYPE.SPACE) {
      this.getSearchResult({
        ...searchObject,
        currentPage: FIRST_PAGE,
        searchType: ADVANCED_SEARCH_TYPE.SPACE
      }, props.spaceSearch)
    } else this.setState({ currentSearch: props.spaceSearch })

    this.setHeadTitle()
    this.buildBreadcrumbs()
    this.loadSearchUrl()
  }

  componentDidUpdate (prevProps) {
    const { props } = this
    const prevSearch = parseSearchUrl(qs.parse(prevProps.location.search))
    const currentSearch = parseSearchUrl(qs.parse(props.location.search))

    if (
      prevSearch.searchedKeywords !== currentSearch.searchedKeywords ||
      prevSearch.currentPage !== currentSearch.currentPage
    ) {
      this.loadSearchUrl()
    }
    if (
      prevProps.system.config.instance_name !== props.system.config.instance_name ||
      prevSearch.searchedKeywords !== currentSearch.searchedKeywords
    ) {
      this.setHeadTitle()
    }
  }

  getSearchResult = async (searchObject, currentSearch) => {
    const { props } = this

    // INFO - G.B. - 2021-02-12 - check if the user comes through an url that is not placed at first page
    const hasFirstPage = !(currentSearch.resultList.length < searchObject.numberResultsByPage * (searchObject.currentPage - 1))

    const fetchGetAdvancedSearchResult = await props.dispatch(getAdvancedSearchResult(
      searchObject.contentTypes,
      searchObject.searchedKeywords,
      hasFirstPage
        ? searchObject.currentPage
        : FIRST_PAGE,
      hasFirstPage
        ? searchObject.numberResultsByPage
        : searchObject.numberResultsByPage * searchObject.currentPage,
      searchObject.showArchived,
      searchObject.showDeleted,
      searchObject.showActive,
      searchObject.searchType
    ))

    switch (fetchGetAdvancedSearchResult.status) {
      case 200:
        props.dispatch(setSearchedKeywords(searchObject.searchedKeywords))
        props.dispatch(setCurrentNumberPage(searchObject.currentPage, searchObject.searchType))
        props.dispatch(setNumberResultsByPage(searchObject.numberResultsByPage))
        if (searchObject.currentPage === FIRST_PAGE || !hasFirstPage) {
          props.dispatch(setSearchResultList(fetchGetAdvancedSearchResult.json.contents, searchObject.searchType))
        } else {
          props.dispatch(appendSearchResultList(fetchGetAdvancedSearchResult.json.contents, searchObject.searchType))
        }
        if (searchObject.searchType === this.state.searchType) this.setState({ totalHits: fetchGetAdvancedSearchResult.json.total_hits })
        break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
        break
    }
  }

  loadSearchUrl = async () => {
    const searchObject = parseSearchUrl(qs.parse(this.props.location.search))
    this.getSearchResult(searchObject, this.state.currentSearch)
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
    const NEXT_PAGE = state.currentSearch.currentNumberPage + 1
    props.history.push(
      `${PAGE.SEARCH_RESULT}?${qs.stringify({ ...qs.parse(props.location.search), p: NEXT_PAGE }, { encode: true })}`
    )
  }

  handleClickFilterMenu = () => this.setState(prev => ({ isFilterMenuOpen: !prev.isFilterMenuOpen }))

  handleClickSearch = searchedKeywords => {
    const { props } = this
    const FIRST_PAGE = 1
    props.history.push(`${PAGE.SEARCH_RESULT}?${qs.stringify({
      ...qs.parse(props.location.search),
      q: searchedKeywords,
      p: FIRST_PAGE
    }, { encode: true })}`)
  }

  getDisplayDetail () {
    const { props, state } = this
    const totalResultsNumber = this.state.totalHits

    if (totalResultsNumber <= 0) return ''

    const displayedResultsNumber = state.currentSearch.resultList.length
    return props.t('Showing {{displayedResults}} of {{totalResults}} results', {
      displayedResults: displayedResultsNumber,
      totalResults: totalResultsNumber
    })
  }

  hasMoreResults () {
    const { state } = this
    const currentNumberSearchResults = this.state.totalHits
    return currentNumberSearchResults >= (state.currentSearch.numberResultsByPage * state.currentSearch.currentNumberPage)
  }

  handleChangeSearchType = (e) => {
    props.history.push(
      `${PAGE.SEARCH_RESULT}?${qs.stringify({ ...qs.parse(props.location.search), s: e.currentTarget.value }, { encode: true })}`
    )
  }

  render () {
    const { props, state } = this
    const currentNumberSearchResults = state.currentSearch.resultList.length

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper>
            <PageTitle
              title={(currentNumberSearchResults === 1
                ? props.t('Result for "{{keywords}}"', { keywords: state.currentSearch.searchedKeywords })
                : props.t('Results for "{{keywords}}"', { keywords: state.currentSearch.searchedKeywords })
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
                  searchedKeywords={state.currentSearch.searchedKeywords}
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
                      {`${props.t('No results for the search terms')}: "${state.currentSearch.searchedKeywords}"`}
                    </div>
                  )}

                  {state.searchType === ADVANCED_SEARCH_TYPE.CONTENT && (
                    <AdvancedSearchContentList
                      contentSearch={props.contentSearch}
                      contentType={props.contentType}
                      user={props.user}
                    />
                  )}

                  {state.searchType === ADVANCED_SEARCH_TYPE.USER && (
                    <AdvancedSearchUserList
                      userSearch={props.userSearch}
                      contentType={props.contentType}
                      user={props.user}
                    />
                  )}

                  {state.searchType === ADVANCED_SEARCH_TYPE.SPACE && (
                    <AdvancedSearchSpaceList
                      spaceSearch={props.spaceSearch}
                      contentType={props.contentType}
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
                      : currentNumberSearchResults > state.currentSearch.numberResultsByPage &&
                      props.t('No more results')
                    )}
                  </div>
                </div>
                {state.isFilterMenuOpen && (
                  <SearchFilterMenu
                    onClickSearchFilterMenu={this.handleClickFilterMenu}
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
