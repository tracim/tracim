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
  appendSearchResultList,
  setSearchResultList,
  setNumberResultsByPage,
  setSearchedKeywords,
  setBreadcrumbs,
  setHeadTitle
} from '../action-creator.sync.js'
import { getSearchedKeywords } from '../action-creator.async.js'
import { parseSearchUrl, SEARCH_TYPE } from '../util/helper.js'

const qs = require('query-string')

export class SearchResult extends React.Component {
  constructor (props) {
    super(props)
    // FIXME - GB - 2019-06-26 - this state is needed to know if there are still any results not sent from the backend
    // https://github.com/tracim/tracim/issues/1973
    this.state = {
      totalHits: 0
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  handleAllAppChangeLanguage = data => {
    console.log('%c<Search> Custom event', 'color: #28a745', CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, data)
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
    const hasFirstPage = !(props.simpleSearch.resultList.length < searchObject.numberResultsByPage * (searchObject.currentPage - 1))

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
        props.dispatch(setCurrentNumberPage(searchObject.currentPage, SEARCH_TYPE.SIMPLE))
        props.dispatch(setNumberResultsByPage(searchObject.numberResultsByPage))
        if (searchObject.currentPage === FIRST_PAGE || !hasFirstPage) {
          props.dispatch(setSearchResultList(fetchGetSearchedKeywords.json.contents, SEARCH_TYPE.SIMPLE))
        } else {
          props.dispatch(appendSearchResultList(fetchGetSearchedKeywords.json.contents, SEARCH_TYPE.SIMPLE))
        }
        this.setState({ totalHits: fetchGetSearchedKeywords.json.total_hits })
        break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
        break
    }
  }

  getPath = (path) => path.map(c => c.label).join(' / ')

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
    const NEXT_PAGE = props.simpleSearch.currentNumberPage + 1
    props.history.push(
      `${PAGE.SEARCH_RESULT}?${qs.stringify({ ...qs.parse(props.location.search), p: NEXT_PAGE }, { encode: true })}`
    )
  }

  setSubtitle () {
    const { props } = this
    const { simpleSearch } = props

    const numberResults = simpleSearch.resultList.length
    const text = numberResults === 1 ? props.t('best result for') : props.t('best results for')

    const subtitle = `${numberResults} ${text} "${simpleSearch.searchedKeywords}"`

    return subtitle
  }

  getSubtitle () {
    let subtitle = ''
    const currentNumberSearchResults = this.props.simpleSearch.resultList.length
    if (currentNumberSearchResults > 0) {
      subtitle = this.setSubtitle()
    }

    return subtitle
  }

  hasMoreResults () {
    const { props } = this
    const currentNumberSearchResults = this.state.totalHits
    return currentNumberSearchResults >= (props.simpleSearch.numberResultsByPage * props.simpleSearch.currentNumberPage)
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
    const currentNumberSearchResults = props.simpleSearch.resultList.length

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='searchResult'>
            <PageTitle
              parentClass='searchResult'
              title={(currentNumberSearchResults === 1
                ? props.t('Search result')
                : props.t('Search results')
              )}
              icon='fas fa-search'
              breadcrumbsList={props.breadcrumbs}
            />

            <PageContent parentClass='searchResult'>
              <div>{this.getSubtitle()}</div>

              <div className='folder__content' data-cy='search__content'>
                {currentNumberSearchResults > 0 && (
                  <ContentItemHeader showSearchDetails />
                )}

                {currentNumberSearchResults === 0 && (
                  <div className='searchResult__content__empty'>
                    {`${props.t('No results for the search terms')}: "${props.simpleSearch.searchedKeywords}"`}
                  </div>
                )}

                {props.simpleSearch.resultList.map((searchItem, index) => (
                  <ListItemWrapper
                    label={searchItem.label}
                    read
                    contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === searchItem.contentType) : null}
                    isLast={index === props.simpleSearch.resultList.length - 1}
                    key={searchItem.contentId}
                  >
                    <ContentItemSearch
                      label={searchItem.label}
                      path={`${searchItem.workspace.label} > ${this.getPath(searchItem.path)}`}
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
              <div className='searchResult__btnSeeMore'>
                {(this.hasMoreResults()
                  ? (
                    <IconButton
                      onClick={this.handleClickSeeMore}
                      icon='chevron-down'
                      text={props.t('See more')}
                    />
                  )
                  : currentNumberSearchResults > props.simpleSearch.numberResultsByPage &&
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

const mapStateToProps = ({ breadcrumbs, simpleSearch, contentType, system, user }) => ({ breadcrumbs, simpleSearch, contentType, system, user })
export default connect(mapStateToProps)(translate()(TracimComponent(SearchResult)))
