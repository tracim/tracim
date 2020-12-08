import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { translate, Trans } from 'react-i18next'

import {
  Avatar,
  BREADCRUMBS_TYPE,
  Breadcrumbs,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  ROLE_LIST,
  SUBSCRIPTION_TYPE_LIST
} from 'tracim_frontend_lib'
import { PAGE } from '../../util/helper.js'

import TimedEvent from '../TimedEvent.jsx'
require('./MemberActivity.styl')

export class MemberActivity extends React.Component {
  getSpaceMemberText (coreEventType, userPublicName, workspaceLabel, workspaceId) {
    const { props } = this
    const r = ROLE_LIST.find(r => r.slug === props.activity.newestMessage.fields.member.role)
    const role = props.t(r.label)
    switch (coreEventType) {
      case TLM_CET.CREATED:
        return (
          <Trans>
            <span className='memberActivity__user'>{{ userPublicName }}</span>&nbsp;
            joined the space&nbsp;
            <Link to={PAGE.WORKSPACE.DASHBOARD(workspaceId)}>
              <span className='memberActivity__workspace'>{{ workspaceLabel }}</span>
            </Link>
          </Trans>
        )
      case TLM_CET.MODIFIED:
        return (
          <Trans>
            <span className='memberActivity__user'>{{ userPublicName }}</span>'s&nbsp;
            role has been changed to {{ role }}
          </Trans>
        )
    }
    return ''
  }

  getSpaceSubscriptionText (coreEventType, userPublicName, workspaceLabel, workspaceId) {
    const { props } = this
    const s = SUBSCRIPTION_TYPE_LIST.find(s => s.slug === props.activity.newestMessage.fields.subscription.state)
    const state = props.t(s.label)
    switch (coreEventType) {
      case TLM_CET.CREATED:
        return (
          <Trans>
            <span className='memberActivity__user'>{{ userPublicName }}</span>&nbsp;
            wants to join the space&nbsp;
            <Link to={PAGE.WORKSPACE.DASHBOARD(workspaceId)}>
              <span className='memberActivity__workspace'>{{ workspaceLabel }}</span>
            </Link>
          </Trans>
        )
      case TLM_CET.MODIFIED:
        return (
          <Trans>
            <span className='memberActivity__user'>{{ userPublicName }}</span>'s&nbsp;
            request to join the space has been {{ state }}
          </Trans>
        )
    }
    return ''
  }

  getText () {
    const { props } = this
    const userPublicName = props.activity.newestMessage.fields.user.public_name
    const workspaceLabel = props.activity.newestMessage.fields.workspace.label
    const workspaceId = props.activity.newestMessage.fields.workspace.workspace_id
    const [entityType, coreEventType] = props.activity.newestMessage.event_type.split('.')
    switch (entityType) {
      case TLM_ET.SHAREDSPACE_MEMBER:
        return this.getSpaceMemberText(coreEventType, userPublicName, workspaceLabel, workspaceId)
      case TLM_ET.SHAREDSPACE_SUBSCRIPTION:
        return this.getSpaceSubscriptionText(coreEventType, userPublicName, workspaceLabel, workspaceId)
    }
    return <Trans>Unknown entity type</Trans>
  }

  render () {
    const { props } = this
    const newestMessage = props.activity.newestMessage

    const workspaceId = newestMessage.fields.workspace.workspace_id
    const workspaceLabel = newestMessage.fields.workspace.label
    const breadcrumbsList = [
      {
        link: <Link to={PAGE.WORKSPACE.DASHBOARD(workspaceId)}>{workspaceLabel}</Link>,
        type: BREADCRUMBS_TYPE.CORE,
        label: workspaceLabel
      }
    ]

    return (
      <div className='memberActivity'>
        <Avatar publicName={newestMessage.fields.user.public_name} width='32px' style={{ marginRight: '5px' }} />
        <div className='memberActivity__title'>
          {this.getText()}
          <Breadcrumbs breadcrumbsList={breadcrumbsList} />
        </div>
        <TimedEvent
          customClass='memberActivity__right'
          date={newestMessage.created}
          lang={props.user.lang}
          authorName={newestMessage.fields.author.public_name}
        />
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(MemberActivity))

MemberActivity.propTypes = {
  activity: PropTypes.object.isRequired
}
