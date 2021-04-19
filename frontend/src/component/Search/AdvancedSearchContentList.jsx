import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  Breadcrumbs,
  CONTENT_TYPE,
  Icon,
  ListItemWrapper,
  FilenameWithExtension,
  PAGE
} from 'tracim_frontend_lib'
import { Link } from 'react-router-dom'
import TimedEvent from '../TimedEvent.jsx'
import { getRevisionTypeLabel } from '../../util/helper.js'

require('./AdvancedSearchContentList.styl')

export const AdvancedSearchContentList = props => {
  const resultList = props.contentSearch.resultList.map((searchItem) => {
    const searchContentType = props.contentType.find(ct => ct.slug === searchItem.contentType)
    return {
      ...searchItem,
      contentType: {
        ...searchContentType || { hexcolor: '', label: '', faIcon: '' },
        status: searchContentType.availableStatuses.find(s => s.slug === searchItem.status) || { hexcolor: '', label: '', faIcon: '' }
      }
    }
  })

  const numberCommentsTitle = (numberComments) => {
    if (numberComments === 0) return props.t('0 comments')
    if (numberComments === 1) return props.t('{{numberComments}} comment', { numberComments: numberComments })
    else return props.t('{{numberComments}} comments', { numberComments: numberComments })
  }

  return (
    <div className='advancedSearchContent'>
      {resultList.length > 0 && (
        <div className='content__header'>
          <div className='advancedSearchContent__type__header'>
            {props.t('Type')}
          </div>
          <div className='advancedSearchContent__title'>
            {props.t('Title and path')}
          </div>
          <div className='advancedSearchContent__typeAndTitle'>
            {props.t('Title')}
          </div>
          <div className='advancedSearchContent__modification'>
            {props.t('Last Modification')}
          </div>
          <div className='advancedSearchContent__information'>
            {props.t('Information_plural')}
          </div>
        </div>
      )}

      {resultList.map((searchItem, index) => {
        const searchItemUrl = PAGE.WORKSPACE.CONTENT(
          searchItem.workspaceId,
          searchItem.contentType.slug,
          searchItem.contentId
        )

        return (
          <ListItemWrapper
            label={searchItem.label}
            read
            contentType={searchItem.contentType}
            isLast={index === resultList.length - 1}
            key={searchItem.contentId}
          >
            <Link
              to={searchItemUrl}
              className='advancedSearchContent'
            >
              <div className='advancedSearchContent__wrapper'>
                <div
                  className='advancedSearchContent__type__content'
                  style={{ color: searchItem.contentType.hexcolor }}
                >
                  <Icon
                    icon={`fa-fw ${searchItem.contentType.faIcon}`}
                    title={props.t(searchItem.contentType.label)}
                    color={searchItem.contentType.hexcolor}
                  />
                  <span>{props.t(searchItem.contentType.label)}</span>
                </div>

                <div className='advancedSearchContent__name_path'>
                  <FilenameWithExtension file={searchItem} />
                  <Breadcrumbs
                    breadcrumbsList={searchItem.breadcrumbsList || []}
                    keepLastBreadcrumbAsLink
                  />
                </div>

                <TimedEvent
                  customClass='advancedSearchContent__modification'
                  operation={getRevisionTypeLabel(searchItem.currentRevisionType, props.t)}
                  date={searchItem.modified}
                  lang={props.userLang}
                  author={{
                    publicName: searchItem.lastModifier.public_name,
                    userId: searchItem.lastModifier.user_id
                  }}
                />

                <div className='advancedSearchContent__information'>
                  {searchItem.contentType.slug !== CONTENT_TYPE.FOLDER && (
                    <div>
                      <span className='advancedSearchContent__information__comments'>
                        <Icon
                          icon='fa-fw far fa-comment'
                          title={numberCommentsTitle(searchItem.commentCount)}
                        />
                        <span
                          title={numberCommentsTitle(searchItem.commentCount)}
                        >
                          {searchItem.commentCount}
                        </span>
                      </span>
                      <span className='advancedSearchContent__information__status'>
                        <Icon
                          icon={`fa-fw ${searchItem.contentType.status.faIcon}`}
                          title={props.t(searchItem.contentType.status.label)}
                          color={searchItem.contentType.status.hexcolor}
                        />
                        <span
                          title={props.t(searchItem.contentType.status.label)}
                        >
                          {props.t(searchItem.contentType.status.label)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </ListItemWrapper>
        )
      })}
    </div>
  )
}

export default translate()(AdvancedSearchContentList)

AdvancedSearchContentList.propTypes = {
  contentSearch: PropTypes.object.isRequired,
  contentType: PropTypes.array.isRequired,
  userLang: PropTypes.string
}

AdvancedSearchContentList.defaultProps = {
  userLang: 'en'
}
