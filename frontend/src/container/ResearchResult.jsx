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
import ContentItemResearch from '../component/ContentItemResearch.jsx'
import ContentItemHeader from '../component/Workspace/ContentItemHeader.jsx'
import {
  newFlashMessage,
  setNbPage,
  appendResearch,
  setNbElementsResearch,
  setBreadcrumbs
} from '../action-creator.sync.js'
import { getResearchKeyWord } from '../action-creator.async.js'

class ResearchResult extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showArchived: 0,
      contentTypes: ALL_CONTENT_TYPES,
      showDeleted: 0,
      showActive: 1
    }
  }

  customEventReducer = ({ detail: { type, data } }) => {
    switch (type) {
      case 'allApp_changeLang': this.buildBreadcrumbs(); break
    }
  }

  componentDidMount () {
    this.buildBreadcrumbs()
  }

  findPath = (parentsList) => {
    let parentPath = ''
    if (parentsList.length > 0) {
      parentPath = parentsList.reduce((acc, currentParent) => `${currentParent.label}/${acc}`, '')
    }
    return parentPath
  }

  putContentName = (content) => {
    // FIXME - GB - 2019-06-04 - we need to have a better way to check if it is a file than using contentType[1]
    // https://github.com/tracim/tracim/issues/1840
    const { props } = this

    if (props.contentType.length > 1) {
      return content.content_type === props.contentType[1].slug ? content.filename : content.label
    } else {
      props.dispatch(newFlashMessage(props.t('An error has happened'), 'error'))
    }
  }

  handleClickSeeMore = async () => {
    const { props, state } = this

    const fetchGetKeyWordResearch = await props.dispatch(getResearchKeyWord(
      state.showArchived, state.contentTypes, state.showDeleted, state.showActive,
      props.researchResult.keyWordResearch, props.researchResult.numberPage + 1, props.researchResult.numberElementsByPage
    ))

    switch (fetchGetKeyWordResearch.status) {
      case 200:
        props.dispatch(setNbPage(props.researchResult.numberPage + 1))
        props.dispatch(appendResearch(fetchGetKeyWordResearch.json.contents))
        props.dispatch(setNbElementsResearch(fetchGetKeyWordResearch.json.total_hits))
        break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
        break
    }
  }

  hasSubtitle () {
    const { props } = this
    const { researchResult } = props
    let subtitle = ''
    let nbResults = (researchResult.numberElementsByPage * researchResult.numberPage) > researchResult.totalElements
      ? researchResult.totalElements
      : researchResult.numberElementsByPage * researchResult.numberPage
    let text = researchResult.totalElements === 1
      ? props.t('best result for')
      : props.t('best results for')
    if (researchResult.totalElements !== 0) {
      subtitle = `${nbResults} ${text} "${researchResult.keyWordResearch}"`
    }
    return subtitle
  }

  buildBreadcrumbs = () => {
    const { props } = this

    props.dispatch(setBreadcrumbs([{
      link: <Link to={PAGE.HOME}><i className='fa fa-home' />{props.t('Home')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }, {
      link: <Link to={PAGE.RESEARCH_RESULT}>{props.t('Research results')}</Link>,
      type: BREADCRUMBS_TYPE.CORE
    }]))
  }

  render () {
    const { props } = this

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='ResearchResult'>
            <PageTitle
              parentClass={'ResearchResult'}
              title={props.researchResult.totalElements === 1
                ? props.t('Research result')
                : props.t('Research results')
              }
              icon='search'
              subtitle={this.hasSubtitle()}
              breadcrumbsList={props.breadcrumbs}
            />

            <PageContent parentClass='ResearchResult'>
              <div className='folder__content' data-cy={'research__content'}>
                <ContentItemHeader showResearchDetails />

                {props.researchResult.totalElements === 0 && (
                  <div className='ResearchResult__content__empty'>
                    {`${props.t('No documents found for the specified search terms')}: "${props.researchResult.keyWordResearch}"`}
                  </div>
                )}

                {props.researchResult.resultList.map((researchItem, index) => (
                  <ListItemWrapper
                    label={researchItem.label}
                    read
                    contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === researchItem.content_type) : null}
                    isLast={index === props.researchResult.resultList.length - 1}
                    key={researchItem.content_id}
                  >
                    <ContentItemResearch
                      label={researchItem.label}
                      path={`${researchItem.workspace.label}/${this.findPath(researchItem.parents)}${this.putContentName(researchItem)}`}
                      lastModificationAuthor={researchItem.last_modifier.public_name}
                      lastModificationTime={displayDistanceDate(researchItem.modified, this.props.user.lang)}
                      fileExtension={researchItem.file_extension}
                      faIcon={props.contentType.length ? (props.contentType.find(ct => ct.slug === researchItem.content_type)).faIcon : null}
                      statusSlug={researchItem.status}
                      contentType={props.contentType.length ? props.contentType.find(ct => ct.slug === researchItem.content_type) : null}
                      urlContent={`${PAGE.WORKSPACE.CONTENT(researchItem.workspace_id, researchItem.content_type, researchItem.content_id)}`}
                      key={researchItem.content_id}
                    />
                  </ListItemWrapper>
                ))}
              </div>
              <div className='ResearchResult__btnSeeMore'>
                { props.researchResult.totalElements >= (props.researchResult.numberElementsByPage * props.researchResult.numberPage)
                  ? <IconButton
                    className='outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
                    onClick={this.handleClickSeeMore}
                    icon='chevron-down'
                    text={props.t('See more')}
                  />
                  : props.researchResult.totalElements > props.researchResult.numberElementsByPage &&
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

const mapStateToProps = ({ breadcrumbs, researchResult, contentType, user }) => ({ breadcrumbs, researchResult, contentType, user })
export default connect(mapStateToProps)(translate()(ResearchResult))
