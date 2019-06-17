import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  PageWrapper,
  PageTitle,
  PageContent,
  ListItemWrapper,
  displayDistanceDate,
  IconButton,
  BREADCRUMBS_TYPE
} from 'tracim_frontend_lib'
import {
  PAGE,
  ALL_CONTENT_TYPES
} from '../helper.js'
import ContentItemSearch from '../component/ContentItemSearch.jsx'
import ContentItemHeader from '../component/Workspace/ContentItemHeader.jsx'
import {
  newFlashMessage,
  setCurrentNumberPage,
  setCurrentNumberSearchResults,
  appendSearchResultsList,
  setBreadcrumbs
} from '../action-creator.sync.js'
import { getSearchedKeywords } from '../action-creator.async.js'

class searchResult extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      contentTypes: ALL_CONTENT_TYPES,
      showArchived: false,
      showDeleted: false,
      showActive: true
    }

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case 'allApp_changeLang':
        console.log('%c<Search> Custom event', 'color: #28a745', type, data)
        this.buildBreadcrumbs(); break
    }
  }

  componentDidMount () {
    this.buildBreadcrumbs()
  }

  componentWillUnmount () {
    document.removeEventListener('appCustomEvent', this.customEventReducer)
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
    const { props, state } = this

    const fetchGetSearchedKeywords = await props.dispatch(getSearchedKeywords(
      state.contentTypes, props.searchResult.searchedKeywords, props.searchResult.currentNumberPage + 1,
      props.searchResult.numberResultsByPage, state.showArchived, state.showDeleted, state.showActive
    ))

    switch (fetchGetSearchedKeywords.status) {
      case 200:
        props.dispatch(setCurrentNumberPage(props.searchResult.currentNumberPage + 1))
        props.dispatch(appendSearchResultsList(fetchGetSearchedKeywords.json.contents))
        props.dispatch(setCurrentNumberSearchResults(fetchGetSearchedKeywords.json.total_hits))
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
    let numberResults = searchResult.currentNumberSearchResults
    let text = numberResults === 1 ? props.t('best result for') : props.t('best results for')

    subtitle = `${numberResults} ${text} "${searchResult.searchedKeywords}"`

    return subtitle
  }

  getSubtitle () {
    let subtitle = ''
    if (this.props.searchResult.currentNumberSearchResults > 0) {
      subtitle = this.setSubtitle()
    }

    return subtitle
  }

  hasMoreResults () {
    const { props } = this
    return props.searchResult.currentNumberSearchResults >= (props.searchResult.numberResultsByPage * props.searchResult.currentNumberPage)
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

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='searchResult'>
            <PageTitle
              parentClass={'searchResult'}
              title={props.searchResult.currentNumberSearchResults === 1
                ? props.t('Search result')
                : props.t('Search results')
              }
              icon='search'
              subtitle={this.getSubtitle()}
              breadcrumbsList={props.breadcrumbs}
            />

            <PageContent parentClass='searchResult'>
              <div className='folder__content' data-cy={'search__content'}>
                {props.searchResult.currentNumberSearchResults > 0 &&
                  <ContentItemHeader showSearchDetails />
                }

                {props.searchResult.currentNumberSearchResults === 0 && (
                  <div className='searchResult__content__empty'>
                    {`${props.t('No documents found for the specified search terms')}: "${props.searchResult.searchedKeywords}"`}
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
                  : props.searchResult.currentNumberSearchResults > props.searchResult.numberResultsByPage &&
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
export default connect(mapStateToProps)(translate()(searchResult))
