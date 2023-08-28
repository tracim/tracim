import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import {
  Breadcrumbs,
  CONTENT_NAMESPACE,
  CONTENT_TYPE,
  DropdownMenu,
  Icon,
  IconButton,
  PAGE,
  ROLE,
  ROLE_LIST,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  FilenameWithBadges,
  TimedEvent
} from 'tracim_frontend_lib'
import { findUserRoleIdInWorkspace } from '../../util/helper.js'

require('./FeedItemHeader.styl')

export class FeedItemHeader extends React.Component {
  getDisplayOperation (lastModificationType, lastModificationEntityType, lastModificationSubEntityType, currentRevisionType) {
    const { props } = this

    if (currentRevisionType === 'status-update') return props.t('status modified')
    if (TLM_ET.MENTION === lastModificationEntityType) return props.t('mention made')
    if (CONTENT_TYPE.COMMENT === lastModificationSubEntityType) {
      switch (lastModificationType) {
        case TLM_CET.CREATED:
          return props.t('commented')
        case TLM_CET.MODIFIED:
          return props.t('comment modified')
        case TLM_CET.DELETED:
          return props.t('comment deleted')
        case TLM_CET.UNDELETED:
          return props.t('comment restored ')
      }
    }
    switch (lastModificationType) {
      case TLM_CET.CREATED:
        return props.t('created')
      case TLM_CET.MODIFIED:
        return props.t('modified')
      case TLM_CET.DELETED:
        return props.t('deleted')
      case TLM_CET.UNDELETED:
        return props.t('restored')
      case TLM_CET.COPIED:
        return props.t('copied')
      case TLM_CET.MOVED:
        return props.t('moved')
    }
    return props.t('unknown')
  }

  render () {
    const { props } = this
    const contentId = props.content.id
    const showLastModification = (
      props.contentAvailable &&
      props.lastModificationType &&
      props.lastModificationEntityType &&
      props.lastModificationSubEntityType &&
      props.content.currentRevisionType &&
      props.lastModifier
    )
    const shouldShowChangeTypeButton = findUserRoleIdInWorkspace(
      props.user.userId,
      (props.workspaceList.find(workspace => workspace.id === props.workspaceId) || {}).memberList || [],
      ROLE_LIST
    ) >= ROLE.contentManager.id && props.content.contentNamespace === CONTENT_NAMESPACE.PUBLICATION && props.onClickChangeType !== undefined

    return (
      <div className='feedItemHeader'>
        <Icon
          color={props.contentType.hexcolor}
          customClass='feedItemHeader__icon'
          icon={props.contentType.faIcon}
          title={props.contentType.label}
        />
        <div className='feedItemHeader__title'>
          {props.titleLink
            ? (
              <Link to={props.titleLink}>
                <FilenameWithBadges file={props.content} isTemplate={props.content.isTemplate} customClass='content__name' />
              </Link>
            )
            : <FilenameWithBadges file={props.content} isTemplate={props.content.isTemplate} customClass='content__name' />}
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
              textMobile={props.t('Copy content link')}
              key={`link-${contentId}`}
            />

            {props.allowEdition && (
              <IconButton
                customClass='feedItemHeader__actionMenu__item'
                icon='fas fa-pencil-alt'
                onClick={props.onClickEdit}
                text={props.t('Edit')}
                textMobile={props.t('Edit')}
                key={`edit-${contentId}`}
              />
            )}

            {shouldShowChangeTypeButton && (
              <IconButton
                customClass='feedItemHeader__actionMenu__item'
                disabled={props.content.is_archived || props.content.is_deleted}
                icon='fa-fw fas fa-fw fa-th'
                text={props.t('Change into content')}
                textMobile={props.t('Change into content')}
                label={props.t('Change into content')}
                key={`change-type-${contentId}`}
                onClick={props.onClickChangeType}
                dataCy='popinListItem__change_type'
              />
            )}

            <Link
              className='feedItemHeader__actionMenu__item'
              title={props.t('Open as content')}
              to={PAGE.WORKSPACE.CONTENT(props.workspaceId, props.content.type, contentId)}
              key={`open-${contentId}`}
            >
              <i className={`fa-fw ${props.contentType.faIcon}`} />
              {props.t('Open as content')}
            </Link>
          </DropdownMenu>
        )}
      </div>
    )
  }
}

const mapStateToProps = ({ user, workspaceList }) => ({ user, workspaceList })
export default connect(mapStateToProps)(translate()(FeedItemHeader))

FeedItemHeader.propTypes = {
  content: PropTypes.object.isRequired,
  contentAvailable: PropTypes.bool,
  onClickCopyLink: PropTypes.func.isRequired,
  workspaceId: PropTypes.number.isRequired,
  allowEdition: PropTypes.bool,
  breadcrumbsList: PropTypes.array,
  contentType: PropTypes.object,
  eventList: PropTypes.array,
  lastModificationEntityType: PropTypes.string,
  lastModificationSubEntityType: PropTypes.string,
  lastModificationType: PropTypes.string,
  lastModifier: PropTypes.object,
  modifiedDate: PropTypes.string,
  onEventClicked: PropTypes.func,
  onClickEdit: PropTypes.func,
  titleLink: PropTypes.string,
  onClickChangeType: PropTypes.func
}

FeedItemHeader.defaultProps = {
  allowEdition: false,
  breadcrumbsList: [],
  contentType: {
    label: '',
    faIcon: '',
    hexcolor: ''
  },
  eventList: [],
  lastModificationEntityType: '',
  lastModificationSubEntityType: '',
  lastModificationType: '',
  lastModifier: {},
  modifiedDate: '',
  onClickEdit: () => {},
  titleLink: null
}
