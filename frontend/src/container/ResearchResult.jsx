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
  getResearchString
} from '../action-creator.async.js'

class ResearchResult extends React.Component {
  findPath = (parentsList) => {
    var parentPath = ''
    parentsList.forEach(parent => {
      parentPath = parent.label + '/' + parentPath
    })
    return parentPath
  }

  handleClickSeeMore = async () => {
    const { researchResultList, dispatch, t } = this.props

    const fetchGetStringResearch = await dispatch(getResearchString(
      researchResultList.string_research, researchResultList.number_page + 1, researchResultList.number_elements_by_page
    ))

    switch (fetchGetStringResearch.status) {
      case 200:
        dispatch(setNbPage(researchResultList.number_page + 1))
        dispatch(appendResearch(fetchGetStringResearch.json.contents))
        break
      default:
        dispatch(newFlashMessage(t('An error has happened'), 'warning'))
        break
    }
  }

  render () {
    const { t, contentType, researchResultList } = this.props

    return (
      <div className='tracim__content fullWidthFullHeight'>
        <div className='tracim__content-scrollview'>
          <PageWrapper customClass='ResearchResult'>
            <PageTitle
              parentClass={'ResearchResult'}
              title={t('Research results')}
              icon='search'
              subtitle={t('10 best results for') + ' "' + researchResultList.string_research + '"'}
            />

            <PageContent parentClass='ResearchResult'>
              <div className='folder__content'>
                <ContentItemHeader showResearchDetails />

                {researchResultList.result_list.map((researchItem, index) => (
                  <ListItemWrapper
                    label={researchItem.label}
                    read={false}
                    contentType={contentType.length ? contentType.find(ct => ct.slug === researchItem.content_type) : null}
                    isLast={index === researchResultList.result_list.length - 1}
                    key={researchItem.content_id}
                  >
                    <ContentItemResearch
                      label={researchItem.label}
                      path={researchItem.workspace.label + '/' +
                        this.findPath(researchItem.parents) +
                        (researchItem.content_type === 'file' ? researchItem.filename : researchItem.label)
                      }
                      lastModificationAuthor={researchItem.last_modifier.public_name}
                      lastModificationTime={displayDistanceDate(researchItem.modified, this.props.user.lang)}
                      fileExtension={researchItem.file_extension}
                      faIcon={contentType.length ? (contentType.find(ct => ct.slug === researchItem.content_type)).faIcon : null}
                      statusSlug={researchItem.status}
                      contentType={contentType.length ? contentType.find(ct => ct.slug === researchItem.content_type) : null}
                      urlContent={`${PAGE.WORKSPACE.CONTENT(researchItem.workspace_id, researchItem.content_type, researchItem.content_id)}`}
                      key={researchItem.content_id}
                    />
                  </ListItemWrapper>
                ))}
              </div>
              {researchResultList.total_elements > (researchResultList.number_elements_by_page * researchResultList.number_page) && (
                <button
                  className='btn outlineTextBtn primaryColorBorder primaryColorBgHover primaryColorBorderDarkenHover'
                  onClick={this.handleClickSeeMore}
                >
                  {t('See more')}
                </button>
              )}
            </PageContent>
          </PageWrapper>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ researchResultList, contentType, user }) => ({ researchResultList, contentType, user })
export default connect(mapStateToProps)(translate()(ResearchResult))
