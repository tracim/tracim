import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  PageWrapper,
  PageTitle,
  PageContent,
  ListItemWrapper,
  displayDistanceDate
} from 'tracim_frontend_lib'
import { PAGE } from '../helper.js'
import ContentItemResearch from '../component/ContentItemResearch.jsx'
import ContentItemHeader from '../component/Workspace/ContentItemHeader.jsx'
import {
  newFlashMessage,
  setNbPage,
  appendResearch
} from '../action-creator.sync.js'
import {
  getResearchKeyWord
} from '../action-creator.async.js'

require('../css/ResearchResult.styl')

class ResearchResult extends React.Component {
  findPath = (parentsList) => {
    let parentPath = ''
    if (parentsList.length > 0) {
      parentPath = parentsList.reduce(
        (parentPath, parent) => {
          return `${parent.label}/${parentPath}`
        }, ''
      )
    }
    return parentPath
  }

  putContentName = (content) => {
    // if it's a file we use the name with its extention
    return content.content_type === this.props.contentType[1].slug ? content.filename : content.label
    // return content.content_type === 'file' ? content.filename : content.label
  }

  handleClickSeeMore = async () => {
    const { props } = this

    const fetchGetStringResearch = await props.dispatch(getResearchKeyWord(
      props.researchResult.keyWordResearch, props.researchResult.numberPage + 1, props.researchResult.numberElementsByPage
    ))

    switch (fetchGetStringResearch.status) {
      case 200:
        props.dispatch(setNbPage(props.researchResult.numberPage + 1))
        props.dispatch(appendResearch(fetchGetStringResearch.json.contents))
        break
      default:
        props.dispatch(newFlashMessage(props.t('An error has happened'), 'warning'))
        break
    }
  }

  hasSubititle = () => {
    const { props } = this
    let subtitle = ''
    let nbResults = (props.researchResult.numberElementsByPage * props.researchResult.numberPage) > props.researchResult.totalElements
      ? props.researchResult.totalElements
      : props.researchResult.numberElementsByPage * props.researchResult.numberPage
    if (props.researchResult.totalElements !== 0) {
      subtitle = `${nbResults} ${props.t('best results for')} "${props.researchResult.keyWordResearch}"`
    }
    return subtitle
  }

  render () {
    const { props } = this

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='ResearchResult'>
            <div data-cy={'page__title__research'}>
              <PageTitle
                parentClass={'ResearchResult'}
                title={props.t('Research results')}
                icon='search'
                subtitle={this.hasSubititle()}
              />
            </div>

            <PageContent parentClass='ResearchResult'>
              <div className='folder__content' data-cy={'research__content'}>
                <ContentItemHeader showResearchDetails />

                {props.researchResult.totalElements === 0 && (
                  <div className='ResearchResult__content__empty'>
                    {props.t(`The research "${props.researchResult.keyWordResearch}" has no results. You can try using other or more general keywords.`)}
                  </div>
                )}

                {props.researchResult.resultList.map((researchItem, index) => (
                  <ListItemWrapper
                    label={researchItem.label}
                    read={false}
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
                {props.researchResult.totalElements > (props.researchResult.numberElementsByPage * props.researchResult.numberPage) && (
                  <button
                    className='btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
                    onClick={this.handleClickSeeMore}
                  >
                    <i className='fa fa-chevron-down' /> {props.t('See more')}
                  </button>
                )}
              </div>
            </PageContent>
          </PageWrapper>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ researchResult, contentType, user }) => ({ researchResult, contentType, user })
export default connect(mapStateToProps)(translate()(ResearchResult))
