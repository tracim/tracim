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
  TLM_CORE_EVENT_TYPE as TLM_CET
} from 'tracim_frontend_lib'

import { PAGE } from '../../util/helper.js'

require('./ContentActivityHeader.styl')

export class ContentActivityHeader extends React.Component {

  getDisplayOperation (eventType) {
    const { props } = this
    const [entityType, coreEventType] = eventType.split('.')
    if (CONTENT_TYPE.COMMENT === entityType) return props.t('commented')
    switch (coreEventType) {
      case TLM_CET.CREATED:
        return props.t('created')
      case TLM_CET.MODIFIED:
        return props.t('modified')
      case TLM_CET.DELETED:
        return props.t('deleted')
      case TLM_CET.UNDELETED:
        return props.t('deleted')
    }
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

    const newestEvent = props.eventList[0]

    return (
      <div className='content_activity_header'>
        <div className='content_activity_header__left'>
          <div className='content_activity_header__left__label'>
            <Link to={PAGE.WORKSPACE.CONTENT(workspaceId, contentType, contentId)}>{contentLabel}</Link>
          </div>
          <Breadcrumbs breadcrumbsList={breadcrumbsList} />
        </div>
        <div className='content_activity_header__right'>
          <div>
            {`${this.getDisplayOperation(newestEvent.eventType)} `}
            <DistanceDate absoluteDate={newestEvent.created} lang={props.user.lang} />
          </div>
          <div>{props.t('by')} <span className='content_activity_header__author'>{newestEvent.author.publicName}</span></div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(ContentActivityHeader))

ContentActivityHeader.propTypes = {
  content: PropTypes.object.isRequired,
  workspace: PropTypes.object.isRequired,
  eventList: PropTypes.array.isRequired
}
