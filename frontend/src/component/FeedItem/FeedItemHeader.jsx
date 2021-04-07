import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import {
  Breadcrumbs,
  CONTENT_TYPE,
  DropdownMenu,
  Icon,
  IconButton,
  PAGE,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  FilenameWithExtension
} from 'tracim_frontend_lib'
import TimedEvent from '../TimedEvent.jsx'
import { publicationColor } from '../../util/helper.js'

require('./FeedItemHeader.styl')

export class FeedItemHeader extends React.Component {
  getDisplayOperation (lastModificationType, lastModificationEntityType, lastModificationSubEntityType, currentRevisionType) {
    const { props } = this

    if (currentRevisionType === 'status-update') return props.t('status modified')
    if (TLM_ET.MENTION === lastModificationEntityType) return props.t('mention made')
    if (CONTENT_TYPE.COMMENT === lastModificationSubEntityType) return props.t('commented')

    switch (lastModificationType) {
      case TLM_CET.CREATED:
        return props.t('created')
      case TLM_CET.MODIFIED:
        return props.t('modified')
      case TLM_CET.DELETED:
        return props.t('deleted')
      case TLM_CET.UNDELETED:
        return props.t('restored')
    }
    return props.t('unknown')
  }

  getTitleComponent (contentType, contentLabel) {
    const { props } = this
    return contentType === CONTENT_TYPE.FILE
      ? <FilenameWithExtension file={props.content} customClass='content__name' />
      : <span className='feedItemHeader__label' data-cy='feedItemHeader__label' title={contentLabel}>{contentLabel}</span>
  }

  render () {
    const { props } = this
    const contentId = props.content.id
    const contentLabel = props.content.label
    const contentType = props.content.type
    const showLastModification = (
      props.contentAvailable &&
      props.lastModificationType &&
      props.lastModificationEntityType &&
      props.lastModificationSubEntityType &&
      props.content.currentRevisionType &&
      props.lastModifier
    )

    const app = (
      props.appList.find(a => a.slug === `contents/${contentType}`) ||
      { label: props.t(`No App for content-type ${contentType}`), faIcon: 'fas fa-question', hexcolor: '#000000' }
    )

    const icon = (props.isPublication && contentType === CONTENT_TYPE.THREAD) ? 'fas fa-stream' : app.faIcon

    return (
      <div className='feedItemHeader'>
        <Icon
          customClass='feedItemHeader__icon'
          color={props.isPublication ? publicationColor : app.hexcolor}
          title={props.isPublication ? props.t('Publication') : app.label}
          icon={`fa-fw ${icon}`}
        />
        <div className='feedItemHeader__title'>
          {props.titleLink
            ? <Link to={props.titleLink}>{this.getTitleComponent(contentType, contentLabel)}</Link>
            : <span>{this.getTitleComponent(contentType, contentLabel)}</span>}
          {props.breadcrumbsList && (
            <Breadcrumbs breadcrumbsList={props.breadcrumbsList} keepLastBreadcrumbAsLink />
          )}
        </div>

        {showLastModification && (
          <TimedEvent
            customClass='feedItemHeader__right'
            operation={this.getDisplayOperation(
              props.lastModificationType,
              props.lastModificationEntityType,
              props.lastModificationSubEntityType,
              props.content.currentRevisionType
            )}
            date={props.modifiedDate}
            lang={props.user.lang}
            author={{
              publicName: props.lastModifier.public_name,
              userId: props.lastModifier.user_id
            }}
            eventList={props.eventList}
            onEventClicked={props.onEventClicked}
            dataCy='feedItemTimedEvent'
          />
        )}

        {!props.contentAvailable && (
          <span className='feedItemHeader__unavailable'>
            {props.t('This content is not available')}
          </span>
        )}

        {props.contentAvailable && (
          <DropdownMenu
            buttonCustomClass='feedItemHeader__actionMenu'
            buttonIcon='fas fa-ellipsis-v'
            buttonTooltip={props.t('Actions')}
          >
            <IconButton
              customClass='feedItemHeader__actionMenu__item'
              icon='fas fa-link'
              onClick={props.onClickCopyLink}
              text={props.t('Copy content link')}
              key={`link-${contentId}`}
            />
            <Link
              className='feedItemHeader__actionMenu__item'
              title={props.t('Open content')}
              to={PAGE.WORKSPACE.CONTENT(props.workspaceId, contentType, contentId)}
              key={`open-${contentId}`}
            >
              <i className={`fa-fw ${app.faIcon}`} />
              {props.t('Open as content')}
            </Link>
          </DropdownMenu>
        )}
      </div>
    )
  }
}

const mapStateToProps = ({ user, appList }) => ({ user, appList })
export default connect(mapStateToProps)(translate()(FeedItemHeader))

FeedItemHeader.propTypes = {
  content: PropTypes.object.isRequired,
  contentAvailable: PropTypes.bool.isRequired,
  onClickCopyLink: PropTypes.func.isRequired,
  workspaceId: PropTypes.number.isRequired,
  breadcrumbsList: PropTypes.array,
  eventList: PropTypes.array,
  isPublication: PropTypes.bool.isRequired,
  lastModificationEntityType: PropTypes.string,
  lastModificationSubEntityType: PropTypes.string,
  lastModificationType: PropTypes.string,
  lastModifier: PropTypes.object,
  modifiedDate: PropTypes.string,
  onEventClicked: PropTypes.func,
  titleLink: PropTypes.string
}

FeedItemHeader.defaultProps = {
  breadcrumbsList: [],
  eventList: [],
  isPublication: false,
  lastModificationEntityType: '',
  lastModificationSubEntityType: '',
  lastModificationType: '',
  lastModifier: {},
  modifiedDate: '',
  titleLink: null
}
