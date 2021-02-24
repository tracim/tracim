import React from 'react'
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
import PropTypes from 'prop-types'

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

  return (
    <div className='advancedSearchContent'>
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
          {props.t('Last modification')}
        </div>
        <div className='advancedSearchContent__information'>
          {props.t('Information_plural')}
        </div>
      </div>

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
              className='advancedSearchContent__link'
            />
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
                <Link to={searchItemUrl}>
                  <FilenameWithExtension file={searchItem} />
                </Link>
                <Breadcrumbs
                  breadcrumbsList={searchItem.breadcrumbsList || []}
                  keepLastBreadcrumbAsLink
                />
              </div>

              <TimedEvent
                customClass='advancedSearchContent__modification'
                operation={searchItem.currentRevisionType}
                date={searchItem.modified}
                lang={props.userLang}
                author={{
                  publicName: searchItem.lastModifier.public_name,
                  userId: searchItem.lastModifier.user_id
                }}
              />

              {searchItem.contentType.slug !== CONTENT_TYPE.FOLDER && (
                <div className='advancedSearchContent__information'>
                  <span className='advancedSearchContent__information__comments'>
                    <Icon
                      icon='fa-fw far fa-comment'
                      title={props.t('{{numberComments}} comments', { numberComments: searchItem.commentCount })}
                    />
                    <span
                      title={props.t('{{numberComments}} comments', { numberComments: searchItem.commentCount })}
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
                      title={props.t(searchItem.contentType.status.label)}>
                      {props.t(searchItem.contentType.status.label)}
                    </span>
                  </span>
                </div>
              )}
            </div>
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
