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
  TLM_CORE_EVENT_TYPE as TLM_CET
} from 'tracim_frontend_lib'
import TimedEvent from '../TimedEvent.jsx'

require('./ContentActivityHeader.styl')

export class ContentActivityHeader extends React.Component {
  getDisplayOperation (message) {
    const { props } = this
    if (message.fields.content.current_revision_type === 'status-update') return props.t('status modified')
    const [entityType, coreEventType, subEntityType] = message.event_type.split('.')
    if (TLM_ET.MENTION === entityType) return props.t('mention made')
    if (CONTENT_TYPE.COMMENT === subEntityType) return props.t('commented')

    switch (coreEventType) {
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

  render () {
    const { props } = this
    const workspaceId = props.workspace.workspace_id
    const contentId = props.content.content_id
    const contentLabel = props.content.label
    const contentType = props.content.content_type

    const newestMessage = props.newestMessage
    console.log('hjklçlkjhgvfcd')
    const app = (
      props.appList.find(a => a.slug === `contents/${contentType}`) ||
      { label: props.t(`No App for content-type ${contentType}`), faIcon: 'question', hexcolor: '#000000' }
    )

    return (
      <div className='contentActivityHeader'>
        <Icon
          customClass='contentActivityHeader__icon'
          color={app.hexcolor}
          title={app.label}
          icon={app.faIcon}
        />
        <div className='contentActivityHeader__title'>
          <Link to={PAGE.WORKSPACE.CONTENT(workspaceId, contentType, contentId)}>
            <span className='contentActivityHeader__label' data-cy='contentActivityHeader__label' title={contentLabel}>{contentLabel}</span>
          </Link>
          <Breadcrumbs breadcrumbsList={props.breadcrumbsList} />
        </div>
        <TimedEvent
          customClass='contentActivityHeader__right'
          operation={this.getDisplayOperation(newestMessage)}
          date={newestMessage.created}
          lang={props.user.lang}
          authorName={newestMessage.fields.author.public_name}
          eventList={props.eventList}
          onEventClicked={props.onEventClicked}
          dataCy='contentActivityTimedEvent'
        />
        <DropdownMenu
          buttonCustomClass='contentActivityHeader__actionMenu'
          buttonIcon='fa-ellipsis-v'
          buttonTooltip={props.t('Actions')}
        >
          <IconButton
            customClass='contentActivityHeader__actionMenu__item'
            icon='link'
            onClick={props.onClickCopyLink}
            text={props.t('Copy content link')}
            key={`link-${contentId}`}
          />

          <Link
            className='contentActivityHeader__actionMenu__item'
            title={props.t('Open content')}
            to={PAGE.WORKSPACE.CONTENT(workspaceId, contentType, contentId)}
          >
            <i className={`fa fa-fw fa-${app.faIcon}`} />
            {props.t('Open content')}
          </Link>
        </DropdownMenu>
      </div>
    )
  }
}

const mapStateToProps = ({ user, appList }) => ({ user, appList })
export default connect(mapStateToProps)(translate()(ContentActivityHeader))

ContentActivityHeader.propTypes = {
  content: PropTypes.object.isRequired,
  workspace: PropTypes.object.isRequired,
  eventList: PropTypes.array.isRequired,
  newestMessage: PropTypes.object.isRequired,
  onClickCopyLink: PropTypes.func.isRequired,
  breadcrumbsList: PropTypes.array,
  onEventClicked: PropTypes.func
}

ContentActivityHeader.defaultProps = {
  breadcrumbsList: []
}
