import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { translate } from 'react-i18next'

import {
  BREADCRUMBS_TYPE,
  Breadcrumbs,
  CONTENT_TYPE,
  DistanceDate,
  Icon,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET
} from 'tracim_frontend_lib'

import { PAGE } from '../../util/helper.js'

require('./ContentActivityHeader.styl')

export class ContentActivityHeader extends React.Component {
  getDisplayOperation (eventType) {
    const { props } = this
    const [entityType, coreEventType, subEntityType] = eventType.split('.')
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
    const workspaceLabel = props.workspace.label
    const contentId = props.content.content_id
    const contentLabel = props.content.label
    const contentType = props.content.content_type
    const breadcrumbsList = [
      {
        link: <Link to={PAGE.WORKSPACE.DASHBOARD(workspaceId)}>{workspaceLabel}</Link>,
        type: BREADCRUMBS_TYPE.CORE
      },
      {
        link: (
          <Link to={PAGE.WORKSPACE.CONTENT_LIST(workspaceId)}>
            {props.t('All contents')}
          </Link>
        ),
        type: BREADCRUMBS_TYPE.CORE
      },
      {
        link: <Link to={PAGE.WORKSPACE.CONTENT(workspaceId, contentType, contentId)}>{contentLabel}</Link>,
        type: BREADCRUMBS_TYPE.CORE
      }
    ]

    const newestMessage = props.newestMessage

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
            <span className='contentActivityHeader__label' data-cy='contentActivityHeader__label'>{contentLabel}</span>
          </Link>
          <Breadcrumbs breadcrumbsList={breadcrumbsList} />
        </div>
        <div className='contentActivityHeader__right'>
          <div>
            <span className='contentActivityHeader__operation'>{`${this.getDisplayOperation(newestMessage.event_type)} `}</span>
            <DistanceDate absoluteDate={newestMessage.created} lang={props.user.lang} />
          </div>
          <div>{props.t('by')} <span className='contentActivityHeader__author'>{newestMessage.fields.author.public_name}</span></div>
        </div>
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
  newestMessage: PropTypes.object.isRequired
}
