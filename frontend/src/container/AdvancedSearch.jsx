import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  PageWrapper,
  PageTitle,
  PageContent,
  ListItemWrapper,
  displayDistanceDate,
  IconButton,
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT,
  buildHeadTitle,
  PAGE,
  TracimComponent
} from 'tracim_frontend_lib'
import ContentItemSearch from '../component/Search/ContentItemSearch.jsx'
import ContentItemHeader from '../component/Workspace/ContentItemHeader.jsx'
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
import Search from '../component/Search/Search.jsx'
import { parseSearchUrl } from '../util/helper.js'
import SearchFilterMenu from '../component/Search/SearchFilterMenu.jsx'

const qs = require('query-string')

export class AdvancedSearch extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      totalHits: 0,
      isFilterMenuOpen: true
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
    const prevSearchedKeywords = qs.parse(prevProps.location.search).q
    const currentSearchedKeywords = parseSearchUrl(qs.parse(props.location.search)).searchedKeywords

    if (prevSearchedKeywords !== currentSearchedKeywords) {
      this.loadSearchUrl()
    }
    if (prevProps.system.config.instance_name !== props.system.config.instance_name || prevSearchedKeywords !== currentSearchedKeywords) {
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

    const fetchGetSearchedKeywords = await props.dispatch(getSearchedKeywords(
      searchObject.contentTypes,
      searchObject.searchedKeywords,
      FIRST_PAGE,
      (searchObject.numberResultsByPage * searchObject.currentPage),
      searchObject.showArchived,
      searchObject.showDeleted,
      searchObject.showActive
    ))

    switch (fetchGetSearchedKeywords.status) {
      case 200:
        props.dispatch(setSearchedKeywords(searchObject.searchedKeywords))
        props.dispatch(setSearchResultsList(fetchGetSearchedKeywords.json.contents))
        props.dispatch(setCurrentNumberPage(searchObject.currentPage))
        props.dispatch(setNumberResultsByPage(searchObject.numberResultsByPage))
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
    const searchObject = parseSearchUrl(qs.parse(props.location.search))

    const fetchGetSearchedKeywords = await props.dispatch(getSearchedKeywords(
      searchObject.contentTypes,
      props.searchResult.searchedKeywords,
      NEXT_PAGE,
      props.searchResult.numberResultsByPage,
      searchObject.showArchived,
      searchObject.showDeleted,
      searchObject.showActive
    ))

    switch (fetchGetSearchedKeywords.status) {
      case 200:
        props.dispatch(setCurrentNumberPage(NEXT_PAGE))
        props.dispatch(appendSearchResultsList(fetchGetSearchedKeywords.json.contents))
        this.setState({ totalHits: fetchGetSearchedKeywords.json.total_hits })
        props.history.push(PAGE.SEARCH_RESULT + '?' + qs.stringify({ ...qs.parse(props.location.search), p: NEXT_PAGE }, { encode: true }))
        break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
        break
    }
  }

  handleClickFilterMenu = () => this.setState(prev => ({ isFilterMenuOpen: !prev.isFilterMenuOpen }))

  handleClickSearch = searchedKeywords => {
    const { props } = this
    const FIRST_PAGE = 1

    props.dispatch(setSearchedKeywords(searchedKeywords))
    props.dispatch(setCurrentNumberPage(FIRST_PAGE))
    props.history.push(PAGE.SEARCH_RESULT + '?' + qs.stringify({
      ...qs.parse(props.location.search),
      q: searchedKeywords,
      p: FIRST_PAGE
    }, { encode: true }))
  }

  getDisplayDetail () {
    const { props } = this
    const totalResultsNumber = 10 // TODO - update after backend

    if (totalResultsNumber <= 0) return ''

    const displayedResultsNumber = props.searchResult.resultsList.length
    return props.t('Showing {{displayedResults}} of {{totalResults}} results', {
      displayedResults: displayedResultsNumber,
      totalResults: totalResultsNumber
    })
  }

  hasMoreResults () { // TODO - after backend, update to display < total
    const { props } = this
    const currentNumberSearchResults = this.state.totalHits
    return currentNumberSearchResults >= (props.searchResult.numberResultsByPage * props.searchResult.currentNumberPage)
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

            <PageContent parentClass='advancedSearch'>
              <Search
                onClickSearch={this.handleClickSearch}
              />

              <div className='advancedSearch__page'>
                <div className='advancedSearch__content'>
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

                  {currentNumberSearchResults > 0 && (
                    <ContentItemHeader showSearchDetails />
                  )}

                  {currentNumberSearchResults === 0 && (
                    <div className='advancedSearch__content__empty'>
                      {`${props.t('No results for the search terms')}: "${props.searchResult.searchedKeywords}"`}
                    </div>
                  )}

                  {props.searchResult.resultsList.map((searchItem, index) => (
                    <ListItemWrapper
                      label={searchItem.label}
                      read
                      contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === searchItem.contentType) : null}
                      isLast={index === props.searchResult.resultsList.length - 1}
                      key={searchItem.contentId}
                    >
                      <ContentItemSearch
                        label={searchItem.label}
                        path={searchItem.workspace.label}
                        lastModificationAuthor={searchItem.lastModifier}
                        lastModificationTime={displayDistanceDate(searchItem.modified, props.user.lang)}
                        lastModificationFormated={(new Date(searchItem.modified)).toLocaleString(props.user.lang)}
                        fileExtension={searchItem.fileExtension}
                        faIcon={props.contentType.length ? (props.contentType.find(ct => ct.slug === searchItem.contentType)).faIcon : null}
                        statusSlug={searchItem.status}
                        contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === searchItem.contentType) : null}
                        urlContent={`${PAGE.WORKSPACE.CONTENT(searchItem.workspaceId, searchItem.contentType, searchItem.contentId)}`}
                        key={searchItem.contentId}
                      />
                    </ListItemWrapper>
                  ))}
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
