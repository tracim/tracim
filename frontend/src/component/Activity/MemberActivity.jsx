import React from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { escape as escapeHtml } from 'lodash'

import {
  Avatar,
  DistanceDate,
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET,
  ROLE_LIST,
  SUBSCRIPTION_TYPE_LIST
} from 'tracim_frontend_lib'

require('./MemberActivity.styl')

export class MemberActivity extends React.Component {
  getSpaceMemberText (coreEventType, i18nOpts) {
    const { props } = this
    const role = ROLE_LIST.find(r => r.slug === props.activity.newestMessage.fields.member.role)

    i18nOpts = {
      ...i18nOpts,
      role: props.t(role.label)
    }
    switch (coreEventType) {
      case TLM_CET.CREATED:
        return props.t('{{user}} joined the space', i18nOpts)
      case TLM_CET.MODIFIED:
        return props.t("{{user}}'s role has been changed to {{role}}", i18nOpts)
    }
  }

  getSpaceSubscriptionText (coreEventType, i18nOpts) {
    const { props } = this
    const subscription = SUBSCRIPTION_TYPE_LIST.find(s => s.slug === props.activity.newestMessage.fields.subscription.state)
    i18nOpts = {
      ...i18nOpts,
      state: props.t(subscription.label)
    }
    switch (coreEventType) {
      case TLM_CET.CREATED:
        return props.t('{{user}} wants to join the space', i18nOpts)
      case TLM_CET.MODIFIED:
        return props.t("{{user}}'s request to join the space has been {{state}}", i18nOpts)
    }
  }

  getText () {
    const { props } = this
    const userPublicName = escapeHtml(props.activity.newestMessage.fields.user.public_name)
    const [entityType, coreEventType] = props.activity.newestMessage.event_type.split('.')
    const i18nOpts = {
      user: `<span title='${userPublicName}' className='member_activity__user'>${userPublicName}</span>`,
      interpolation: { escapeValue: false }
    }
    switch (entityType) {
      case TLM_ET.SHAREDSPACE_MEMBER:
        return this.getSpaceMemberText(coreEventType, i18nOpts)
      case TLM_ET.SHAREDSPACE_SUBSCRIPTION:
        return this.getSpaceSubscriptionText(coreEventType, i18nOpts)
    }
    return 'FUCK'
  }

  render () {
    const { props } = this
    const newestMessage = props.activity.newestMessage
    return (
      <div className='member_activity'>
        <div className='member_activity__left'>
          <Avatar publicName={newestMessage.fields.user.public_name} width={32} style={{ marginRight: '5px' }} />
          <div dangerouslySetInnerHTML={{ __html: this.getText() }} />
        </div>
        <div className='member_activity__right'>
          <DistanceDate absoluteDate={newestMessage.created} lang={props.user.lang} /><br />
          {props.t('by')} <span className='member_activity__user'>{newestMessage.fields.author.public_name}</span>
        </div>
      </div>
    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(MemberActivity))

MemberActivity.propTypes = {
  activity: PropTypes.object.isRequired
}
