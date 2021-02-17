import React from 'react'
import { translate } from 'react-i18next'
import {
  Badge,
  Breadcrumbs,
  CONTENT_TYPE,
  Icon,
  ListItemWrapper,
  PAGE
} from 'tracim_frontend_lib'
import { Link } from 'react-router-dom'
import TimedEvent from '../TimedEvent.jsx'
import PropTypes from 'prop-types'

require('./AdvancedSearchContentList.styl')

export const AdvancedSearchContentList = props => {
  const resultList = props.contentSearch.resultList.map((searchItem) => {
    return {
      ...searchItem,
      contentType: {
        ...props.contentType.find(ct => ct.slug === searchItem.contentType) || { hexcolor: '', label: '', faIcon: '' },
        status: props.contentType.find(ct => ct.slug === searchItem.contentType).availableStatuses.find(s => s.slug === searchItem.status) || { hexcolor: '', label: '', faIcon: '' }
      }
    }
  })

  return (
    <>
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

      {resultList.map((searchItem, index) => (
        <ListItemWrapper
          label={searchItem.label}
          read
          contentType={searchItem.contentType}
          isLast={index === resultList.length - 1}
          key={searchItem.contentId}
        >
          <Link
            to={`${PAGE.WORKSPACE.CONTENT(searchItem.workspaceId, searchItem.contentType.slug, searchItem.contentId)}`}
            className='advancedSearchContent'
          >
            <div
              className='advancedSearchContent__type__content'
              style={{ color: searchItem.contentType.hexcolor }}
              title={props.t(searchItem.contentType.label)}
            >
              <Icon
                icon={`fa-fw ${searchItem.contentType.faIcon}`}
                color={searchItem.contentType.hexcolor}
              />
              <span>{props.t(searchItem.contentType.label)}</span>
            </div>

            <div
              className='advancedSearchContent__title'
              title={searchItem.label}
            >
              {searchItem.label}
              {searchItem.contentType.slug === CONTENT_TYPE.FILE && (
                <Badge text={searchItem.fileExtension} customClass='badgeBackgroundColor' />
              )}
            </div>

            {searchItem.contentType.slug !== CONTENT_TYPE.FOLDER && (
              <div className='advancedSearchContent__information'>
                <span title={props.t(searchItem.contentType.status.label)}>
                  {props.t(searchItem.contentType.status.label)}
                </span>
                <Icon
                  icon={`fa-fw ${searchItem.contentType.status.faIcon}`}
                  title={props.t(searchItem.contentType.status.label)}
                  color={searchItem.contentType.status.hexcolor}
                />
                <span
                  title={props.t('{{numberComments}} comments', { numberComments: searchItem.commentCount })}
                >
                  {searchItem.commentCount}
                </span>
                <Icon
                  icon='fa-fw far fa-comment'
                  title={props.t('{{numberComments}} comments', { numberComments: searchItem.commentCount })}
                />
              </div>
            )}
          </Link>

          <Breadcrumbs
            breadcrumbsList={searchItem.breadcrumbsList || []}
            keepLastBreadcrumbAsLink
          />

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
        </ListItemWrapper>
      ))}
    </>
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
