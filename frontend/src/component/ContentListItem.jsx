import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { Link } from 'react-router-dom'

import {
  Breadcrumbs,
  CONTENT_TYPE,
  Icon,
  ListItemWrapper,
  FilenameWithExtension,
  PAGE
} from 'tracim_frontend_lib'
import ContentType from './ContentType.jsx'
import TimedEvent from './TimedEvent.jsx'

require('./ContentListItem.styl')

const getRevisionTypeLabel = (revisionType, t) => {
  switch (revisionType) {
    case 'revision':
      return t('modified')
    case 'creation':
      return t('created')
    case 'edition':
      return t('modified')
    case 'undeletion':
      return t('undeleted')
    case 'mention':
      return t('mention made')
    case 'content-comment':
      return t('commented')
    case 'status-update':
      return t('status modified')
    case 'unknown':
      return t('unknown')
  }

  return revisionType
}

const numberCommentsTitle = (numberComments, t) => {
  if (numberComments === 0) return t('0 comments')
  if (numberComments === 1) return t('{{numberComments}} comment', { numberComments: numberComments })
  else return t('{{numberComments}} comments', { numberComments: numberComments })
}

const ContentListItem = (props) => {
  const { content } = props
  const contentAppUrl = PAGE.WORKSPACE.CONTENT(
    content.workspaceId,
    props.contentTypeInfo.slug,
    content.id
  )
  const commentCountTitle = Number.isInteger(props.commentsCount)
    ? numberCommentsTitle(props.commentsCount, props.t)
    : null

  const statusInfo = props.contentTypeInfo.availableStatuses.find(
    s => s.slug === content.statusSlug
  )
  return (
    <ListItemWrapper
      label={content.label}
      read
      contentType={props.contentTypeInfo}
      isLast={props.isLast}
      customClass='contentListItem'
    >
      <ContentType
        contentTypeInfo={props.contentTypeInfo}
        customClass='contentListItem__type'
      />

      <div className='contentListItem__name_path'>
        <FilenameWithExtension file={content} />
        <Breadcrumbs
          breadcrumbsList={props.breadcrumbsList}
          keepLastBreadcrumbAsLink
        />
      </div>

      <TimedEvent
        customClass='contentListItem__modification'
        operation={getRevisionTypeLabel(content.currentRevisionType, props.t)}
        date={content.modified}
        lang={props.userLang}
        author={content.lastModifier}
      />

      <div className='contentListItem__information'>
        {props.contentTypeInfo.slug !== CONTENT_TYPE.FOLDER && (
          <>
            {commentCountTitle && (
              <span className='contentListItem__information__comments'>
                <Icon
                  icon='fa-fw far fa-comment'
                  title={commentCountTitle}
                />
                <span title={commentCountTitle}>{props.commentsCount}</span>
              </span>
            )}
            <span className='contentListItem__information__status'>
              <Icon
                icon={`fa-fw ${statusInfo.faIcon}`}
                title={props.t(statusInfo.label)}
                color={statusInfo.hexcolor}
              />
              <span
                title={props.t(statusInfo.label)}
              >
                {props.t(statusInfo.label)}
              </span>
            </span>
          </>
        )}
      </div>
      {props.children}
      <Link to={contentAppUrl} className='contentListItem__link' />
    </ListItemWrapper>
  )
}

ContentListItem.propTypes = {
  content: PropTypes.object.isRequired,
  contentTypeInfo: PropTypes.object.isRequired,
  userLang: PropTypes.string.isRequired,
  breadcrumbsList: PropTypes.arrayOf(PropTypes.string),
  commentsCount: PropTypes.number,
  isLast: PropTypes.bool
}

ContentListItem.defaultProps = {
  breadcrumbsList: [],
  commentsCount: null,
  isLast: false
}

export default translate()(ContentListItem)
