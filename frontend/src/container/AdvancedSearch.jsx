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
import ContentItemSearch from '../component/ContentItemSearch.jsx'
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
import Search from '../component/Header/Search.jsx'

const qs = require('query-string')

export class AdvancedSearch extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      totalHits: 0
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  handleAllAppChangeLanguage = () => {
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  parseUrl () {
    const parsed = qs.parse(this.props.location.search)
    const searchObject = {}

    searchObject.contentTypes = parsed.t
    searchObject.searchedKeywords = parsed.q
    searchObject.numberResultsByPage = parseInt(parsed.nr)
    searchObject.currentPage = parseInt(parsed.p)
    searchObject.showArchived = !!(parseInt(parsed.arc))
    searchObject.showDeleted = !!(parseInt(parsed.del))
    searchObject.showActive = !!(parseInt(parsed.act))

    return searchObject
  }

  componentDidMount () {
    this.setHeadTitle()
    this.buildBreadcrumbs()
    this.loadSearchUrl()
  }

  componentDidUpdate (prevProps) {
    const prevSearchedKeywords = qs.parse(prevProps.location.search).q
    const currentSearchedKeywords = this.parseUrl().searchedKeywords

    if (prevSearchedKeywords !== currentSearchedKeywords) {
      this.loadSearchUrl()
    }
    if (prevProps.system.config.instance_name !== this.props.system.config.instance_name || prevSearchedKeywords !== currentSearchedKeywords) {
      this.setHeadTitle()
    }
  }

  setHeadTitle = () => {
    const { props } = this
    const headTitle = buildHeadTitle(
      [`${props.t('Search results')} : ${this.parseUrl().searchedKeywords}`]
    )

    props.dispatch(setHeadTitle(headTitle))
  }

  loadSearchUrl = async () => {
    const { props } = this
    const searchObject = this.parseUrl()
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

  getPath = (parentsList) => {
    let parentPath = ''
    if (parentsList.length > 0) {
      parentPath = parentsList.reduce((acc, currentParent) => `${currentParent.label} / ${acc}`, '')
    }
    return parentPath
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
    const searchObject = this.parseUrl()

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

  getSubtitle () {
    const { props } = this
    const totalResultsNumber = 10 // TODO - update after backend

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
    const { props } = this
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

              <div className='advancedSearch__description'>
                {this.getSubtitle()}
              </div>

              <div className='folder__content' data-cy='search__content'>
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
                      path={`${searchItem.workspace.label} > ${this.getPath(searchItem.parents)}${this.getContentName(searchItem)}`}
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
              </div>
              <div className='advancedSearch__btnSeeMore'>
                {(this.hasMoreResults()
                  ? (
                    <IconButton
                      onClick={this.handleClickSeeMore}
                      icon='chevron-down'
                      text={props.t('See more')}
                    />
                  )
                  : currentNumberSearchResults > props.searchResult.numberResultsByPage &&
                    props.t('No more results')
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
