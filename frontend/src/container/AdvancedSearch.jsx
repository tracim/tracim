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
  appendSearchResultsList,
  setSearchResultsList,
  setNumberResultsByPage,
  setSearchedKeywords,
  setBreadcrumbs,
  setHeadTitle
} from '../action-creator.sync.js'
import { getSearchedKeywords } from '../action-creator.async.js'
import SearchInput from '../component/Search/SearchInput.jsx'
import { parseSearchUrl } from '../util/helper.js'
import SearchFilterMenu from '../component/Search/SearchFilterMenu.jsx'
import AdvancedSearchContentList from '../component/Search/AdvancedSearchContentList.jsx'
import AdvancedSearchUserList from '../component/Search/AdvancedSearchUserList.jsx'
import AdvancedSearchSpaceList from '../component/Search/AdvancedSearchSpaceList.jsx'
import classnames from 'classnames'

const qs = require('query-string')
const searchType = {
  content: 'content',
  user: 'user',
  space: 'space'
}

export class AdvancedSearch extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      totalHits: 0,
      isFilterMenuOpen: false,
      searchType: searchType.content
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  handleAllAppChangeLanguage = () => {
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  componentDidMount () {
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

  setHeadTitle = () => {
    const { props } = this
    const headTitle = buildHeadTitle(
      [`${props.t('Search results')} : ${parseSearchUrl(qs.parse(props.location.search)).searchedKeywords}`]
    )

    props.dispatch(setHeadTitle(headTitle))
  }

  loadSearchUrl = async () => {
    const { props } = this
    const searchObject = parseSearchUrl(qs.parse(props.location.search))
    const FIRST_PAGE = 1
    // INFO - G.B. - 2021-02-12 - check if the user comes through an url that is not placed at first page
    const hasFirstPage = !(props.searchResult.resultsList.length < searchObject.numberResultsByPage * (searchObject.currentPage - 1))

    const fetchGetSearchedKeywords = await props.dispatch(getSearchedKeywords(
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
      searchObject.showActive
    ))

    switch (fetchGetSearchedKeywords.status) {
      case 200:
        props.dispatch(setSearchedKeywords(searchObject.searchedKeywords))
        props.dispatch(setCurrentNumberPage(searchObject.currentPage))
        props.dispatch(setNumberResultsByPage(searchObject.numberResultsByPage))
        if (searchObject.currentPage === FIRST_PAGE || !hasFirstPage) {
          props.dispatch(setSearchResultsList(fetchGetSearchedKeywords.json.contents))
        } else {
          props.dispatch(appendSearchResultsList(fetchGetSearchedKeywords.json.contents))
        }
        this.setState({ totalHits: fetchGetSearchedKeywords.json.total_hits })
        break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
        break
    }
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
    const { props } = this
    const NEXT_PAGE = props.searchResult.currentNumberPage + 1
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
    const { props } = this
    const totalResultsNumber = this.state.totalHits

    if (totalResultsNumber <= 0) return ''

    const displayedResultsNumber = props.searchResult.resultsList.length
    return props.t('Showing {{displayedResults}} of {{totalResults}} results', {
      displayedResults: displayedResultsNumber,
      totalResults: totalResultsNumber
    })
  }

  hasMoreResults () {
    const { props } = this
    const currentNumberSearchResults = this.state.totalHits
    return currentNumberSearchResults >= (props.searchResult.numberResultsByPage * props.searchResult.currentNumberPage)
  }

  handleChangeSearchType = (e) => this.setState({ searchType: e.currentTarget.value })

  buildBreadcrumbs = () => {
    const { props } = this

    props.dispatch(setBreadcrumbs([{
      link: PAGE.SEARCH_RESULT,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('Search results'),
      isALink: true
    }]))
  }

  render () {
    const { props, state } = this
    const currentNumberSearchResults = props.searchResult.resultsList.length

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='advancedSearch'>
            <PageTitle
              parentClass='advancedSearch'
              title={(currentNumberSearchResults === 1
                ? props.t('Result for "{{keywords}}"', { keywords: props.searchResult.searchedKeywords })
                : props.t('Results for "{{keywords}}"', { keywords: props.searchResult.searchedKeywords })
              )}
              icon='fas fa-search'
              breadcrumbsList={props.breadcrumbs}
            />

            <PageContent parentClass={classnames('advancedSearch', { advancedSearch__openMenu: state.isFilterMenuOpen })}>
              <div className='advancedSearch__input'>
                <div className='advancedSearch__input__type'>
                  <input
                    onChange={this.handleChangeSearchType}
                    value={searchType.content}
                    checked={state.searchType === searchType.content}
                    type='radio'
                  />
                  <span>{props.t('Contents')}</span>
                  <input
                    onChange={this.handleChangeSearchType}
                    value={searchType.space}
                    checked={state.searchType === searchType.space}
                    type='radio'
                  />
                  <span>{props.t('Spaces')}</span>
                  <input
                    onChange={this.handleChangeSearchType}
                    value={searchType.user}
                    checked={state.searchType === searchType.user}
                    type='radio'
                  />
                  <span>{props.t('Users')}</span>
                </div>
                <SearchInput
                  onClickSearch={this.handleClickSearch}
                  searchedKeywords={props.searchResult.searchedKeywords}
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
                      {`${props.t('No results for the search terms')}: "${props.searchResult.searchedKeywords}"`}
                    </div>
                  )}

                  {state.searchType === searchType.content && (
                    <AdvancedSearchContentList
                      searchResult={props.searchResult}
                      contentType={props.contentType}
                      user={props.user}
                    />
                  )}

                  {state.searchType === searchType.user && (
                    <AdvancedSearchUserList
                      searchResult={props.searchResult}
                      contentType={props.contentType}
                      user={props.user}
                    />
                  )}

                  {state.searchType === searchType.space && (
                    <AdvancedSearchSpaceList
                      searchResult={props.searchResult}
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
                      : currentNumberSearchResults > props.searchResult.numberResultsByPage &&
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

const mapStateToProps = ({ breadcrumbs, searchResult, contentType, system, user }) => ({ breadcrumbs, searchResult, contentType, system, user })
export default connect(mapStateToProps)(translate()(TracimComponent(AdvancedSearch)))
