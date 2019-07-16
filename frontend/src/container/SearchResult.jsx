import React from 'react'
import { connect } from 'react-redux'
import { withTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  PageWrapper,
  PageTitle,
  PageContent,
  ListItemWrapper,
  displayDistanceDate,
  IconButton,
  BREADCRUMBS_TYPE,
  CUSTOM_EVENT
} from 'tracim_frontend_lib'
import {
  PAGE
} from '../helper.js'
import ContentItemSearch from '../component/ContentItemSearch.jsx'
import ContentItemHeader from '../component/Workspace/ContentItemHeader.jsx'
import {
  newFlashMessage,
  setCurrentNumberPage,
  appendSearchResultsList,
  setSearchResultsList,
  setNumberResultsByPage,
  setSearchedKeywords,
  setBreadcrumbs
} from '../action-creator.sync.js'
import { getSearchedKeywords } from '../action-creator.async.js'

const qs = require('query-string')

class SearchResult extends React.Component {
  constructor (props) {
    super(props)
    // FIXME - GB - 2019-06-26 - this state is needed to know if there are still any results not sent from the backend
    // https://github.com/tracim/tracim/issues/1973
    this.state = {
      totalHits: 0
    }

    document.addEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
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

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE:
        console.log('%c<Search> Custom event', 'color: #28a745', type, data)
        this.buildBreadcrumbs(); break
    }
  }

  componentDidMount () {
    this.buildBreadcrumbs()
    this.loadSearchUrl()
  }

  componentWillUnmount () {
    document.removeEventListener(CUSTOM_EVENT.APP_CUSTOM_EVENT_LISTENER, this.customEventReducer)
  }

  componentDidUpdate (prevProps) {
    let prevSearchedKeywords = qs.parse(prevProps.location.search).q
    let currentSearchedKeywords = this.parseUrl().searchedKeywords

    if (prevSearchedKeywords !== currentSearchedKeywords) {
      this.loadSearchUrl()
    }
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
        this.setState({totalHits: fetchGetSearchedKeywords.json.total_hits})
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
      contentName = content.content_type === props.contentType[1].slug ? content.filename : content.label
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
        this.setState({totalHits: fetchGetSearchedKeywords.json.total_hits})
        props.history.push(PAGE.SEARCH_RESULT + '?' + qs.stringify({...qs.parse(props.location.search), p: NEXT_PAGE}, {encode: true}))
        break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
        break
    }
  }

  setSubtitle () {
    const { props } = this
    const { searchResult } = props

    let subtitle
    let numberResults = searchResult.resultsList.length
    let text = numberResults === 1 ? props.t('best result for') : props.t('best results for')

    subtitle = `${numberResults} ${text} "${searchResult.searchedKeywords}"`

    return subtitle
  }

  getSubtitle () {
    let subtitle = ''
    const currentNumberSearchResults = this.props.searchResult.resultsList.length
    if (currentNumberSearchResults > 0) {
      subtitle = this.setSubtitle()
    }

    return subtitle
  }

  hasMoreResults () {
    const { props } = this
    const currentNumberSearchResults = this.state.totalHits
    return currentNumberSearchResults >= (props.searchResult.numberResultsByPage * props.searchResult.currentNumberPage)
  }

  buildBreadcrumbs = () => {
    const { props } = this

    props.dispatch(setBreadcrumbs([{
      link: <Link to={PAGE.HOME}><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: <Link to={PAGE.SEARCH_RESULT}>{props.t('Search results')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }]))
  }

  render () {
    const { props } = this
    const currentNumberSearchResults = props.searchResult.resultsList.length

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='searchResult'>
            <PageTitle
              parentClass={'searchResult'}
              title={currentNumberSearchResults === 1
                ? props.t('Search result')
                : props.t('Search results')
              }
              icon='search'
              subtitle={this.getSubtitle()}
              breadcrumbsList={props.breadcrumbs}
            />

            <PageContent parentClass='searchResult'>
              <div className='folder__content' data-cy={'search__content'}>
                {currentNumberSearchResults > 0 &&
                  <ContentItemHeader showSearchDetails />
                }

                {currentNumberSearchResults === 0 && (
                  <div className='searchResult__content__empty'>
                    {`${props.t('No results for the search terms')}: "${props.searchResult.searchedKeywords}"`}
                  </div>
                )}

                {props.searchResult.resultsList.map((searchItem, index) => (
                  <ListItemWrapper
                    label={searchItem.label}
                    read
                    contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === searchItem.content_type) : null}
                    isLast={index === props.searchResult.resultsList.length - 1}
                    key={searchItem.content_id}
                  >
                    <ContentItemSearch
                      label={searchItem.label}
                      path={`${searchItem.workspace.label} > ${this.getPath(searchItem.parents)}${this.getContentName(searchItem)}`}
                      lastModificationAuthor={searchItem.last_modifier.public_name}
                      lastModificationTime={displayDistanceDate(searchItem.modified, this.props.user.lang)}
                      lastModificationFormated={(new Date(searchItem.modified)).toLocaleString(props.user.lang)}
                      fileExtension={searchItem.file_extension}
                      faIcon={props.contentType.length ? (props.contentType.find(ct => ct.slug === searchItem.content_type)).faIcon : null}
                      statusSlug={searchItem.status}
                      contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === searchItem.content_type) : null}
                      urlContent={`${PAGE.WORKSPACE.CONTENT(searchItem.workspace_id, searchItem.content_type, searchItem.content_id)}`}
                      key={searchItem.content_id}
                    />
                  </ListItemWrapper>
                ))}
              </div>
              <div className='searchResult__btnSeeMore'>
                { this.hasMoreResults()
                  ? <IconButton
                    className='outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
                    onClick={this.handleClickSeeMore}
                    icon='chevron-down'
                    text={props.t('See more')}
                  />
                  : currentNumberSearchResults > props.searchResult.numberResultsByPage &&
                    props.t('No more results')
                }
              </div>
            </PageContent>
          </PageWrapper>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, searchResult, contentType, user }) => ({ breadcrumbs, searchResult, contentType, user })
export default connect(mapStateToProps)(withTranslation()(SearchResult))
