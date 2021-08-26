import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import {
  FETCH_CONFIG,
  CONTENT_NAMESPACE
} from '../util/helper.js'
import {
  AVATAR_SIZE,
  CONTENT_TYPE,
  PROFILE,
  TLM_CORE_EVENT_TYPE as TLM_EVENT,
  TLM_ENTITY_TYPE as TLM_ENTITY,
  TLM_SUB_TYPE as TLM_SUB,
  SUBSCRIPTION_TYPE,
  GROUP_MENTION_TRANSLATION_LIST,
  TracimComponent,
  Avatar,
  formatAbsoluteDate,
  PAGE
} from 'tracim_frontend_lib'
import { escape as escapeHtml } from 'lodash'

export class NotificationItem extends React.Component {
  getNotificationDetails = notification => {
    const { t, user } = this.props

    const [entityType, eventType, contentType] = notification.type.split('.')

    const escapedAuthor = notification.author ? escapeHtml(notification.author.publicName) : ''
    const escapedUser = notification.user ? escapeHtml(notification.user.publicName) : ''

    const escapedContentLabel = (
      notification.content
        ? escapeHtml(
          ((contentType === TLM_SUB.COMMENT) || (entityType === TLM_ENTITY.MENTION && notification.content.type === CONTENT_TYPE.COMMENT))
            ? notification.content.parentLabel
            : notification.content.label
        )
        : ''
    )

    const i18nOpts = {
      user: `<span title='${escapedUser}'>${escapedUser}</span>`,
      author: `<span title='${escapedAuthor}'>${escapedAuthor}</span>`,
      content: `<span title='${escapedContentLabel}' class='contentTitle__highlight'>${escapedContentLabel}</span>`,
      interpolation: { escapeValue: false }
    }

    const isPublication = notification.content && notification.content.contentNamespace === CONTENT_NAMESPACE.PUBLICATION

    const contentUrl = (
      notification.content
        ? (
          isPublication
            ? PAGE.WORKSPACE.PUBLICATION(notification.workspace.id, notification.content.id)
            : PAGE.WORKSPACE.CONTENT(notification.workspace.id, notification.content.type, notification.content.id)
        )
        : ''
    )

    if (entityType === TLM_ENTITY.CONTENT) {
      switch (eventType) {
        case TLM_EVENT.CREATED: {
          if (contentType === TLM_SUB.COMMENT) {
            return {
              title: t('Comment_noun'),
              text: t('{{author}} commented on {{content}}', i18nOpts),
              url: this.linkToComment(notification)
            }
          }

          return {
            title: isPublication ? t('New publication') : t('New content'),
            text: t('{{author}} created {{content}}', i18nOpts),
            url: contentUrl
          }
        }
        case TLM_EVENT.MODIFIED: {
          if (notification.content.currentRevisionType === 'status-update') {
            return {
              title: t('Status updated'),
              text: t('{{author}} changed the status of {{content}}', i18nOpts),
              url: contentUrl
            }
          }

          return {
            title: isPublication ? t('Publication updated') : t('Content updated'),
            text: t('{{author}} updated {{content}}', i18nOpts),
            url: contentUrl
          }
        }
        case TLM_EVENT.DELETED: {
          return {
            title: isPublication ? t('Publication deleted') : t('Content deleted'),
            text: t('{{author}} deleted {{content}}', i18nOpts),
            url: contentUrl
          }
        }
        case TLM_EVENT.UNDELETED: {
          return {
            title: isPublication ? t('Publication restored') : t('Content restored'),
            text: t('{{author}} restored {{content}}', i18nOpts),
            url: contentUrl
          }
        }
      }
    }

    if (entityType === TLM_ENTITY.MENTION && eventType === TLM_EVENT.CREATED) {
      const groupMention = GROUP_MENTION_TRANSLATION_LIST.includes(notification.mention.recipient)
      const mentionEveryone = t('{{author}} mentioned everyone in {{content}}', i18nOpts)
      const mentionYou = t('{{author}} mentioned you in {{content}}', i18nOpts)
      return {
        title: t('Mention'),
        text: groupMention ? mentionEveryone : mentionYou,
        url: contentUrl,
        isMention: true
      }
    }

    if (entityType === TLM_ENTITY.USER) {
      const details = {
        url: (user.profile === PROFILE.administrator.slug)
          ? PAGE.ADMIN.USER_EDIT(notification.user.userId)
          : PAGE.PUBLIC_PROFILE(notification.user.userId),
        emptyUrlMsg: t("Only an administrator can see this user's account"),
        msgType: 'info'
      }

      switch (eventType) {
        case TLM_EVENT.CREATED: return {
          ...details,
          title: t('Account created'),
          text: t("{{author}} created <b>{{user}}</b>'s account", i18nOpts)
        }
        case TLM_EVENT.MODIFIED: return {
          ...details,
          title: t('Account updated'),
          text: t("{{author}} modified <b>{{user}}</b>'s account", i18nOpts)
        }
        case TLM_EVENT.DELETED: return {
          ...details,
          title: t('Account deleted'),
          text: t("{{author}} deleted <b>{{user}}</b>'s account", i18nOpts)
        }
        case TLM_EVENT.UNDELETED: return {
          ...details,
          title: t('Account restored'),
          text: t("{{author}} restored <b>{{user}}</b>'s account", i18nOpts)
        }
      }
    }

    const dashboardUrl = notification.workspace ? PAGE.WORKSPACE.DASHBOARD(notification.workspace.id) : ''

    if (entityType === TLM_ENTITY.SHAREDSPACE_MEMBER) {
      switch (eventType) {
        case TLM_EVENT.CREATED: {
          let notificationText
          if (user.userId === notification.user.userId) {
            notificationText = t('{{author}} added you to a space', i18nOpts)
          } else {
            if (notification.author.userId === notification.user.userId) {
              notificationText = t('{{author}} joined a space', i18nOpts)
            } else {
              notificationText = t('{{author}} added <b>{{user}}</b> to a space', i18nOpts)
            }
          }
          return {
            title: t('New access'),
            text: notificationText,
            url: dashboardUrl
          }
        }
        case TLM_EVENT.MODIFIED: return {
          title: t('Status updated'),
          text: user.userId === notification.user.userId
            ? t('{{author}} modified your role in a space', i18nOpts)
            : t("{{author}} modified <b>{{user}}</b>'s role in a space", i18nOpts),
          url: dashboardUrl
        }
        case TLM_EVENT.DELETED: return {
          title: t('Access removed'),
          text: user.userId === notification.user.userId
            ? t('{{author}} removed you from a space', i18nOpts)
            : t('{{author}} removed <b>{{user}}</b> from a space', i18nOpts),
          url: dashboardUrl
        }
      }
    }

    if (entityType === TLM_ENTITY.SHAREDSPACE) {
      switch (eventType) {
        case TLM_EVENT.CREATED: return {
          title: t('New space'),
          text: t('{{author}} created a space', i18nOpts),
          url: dashboardUrl
        }
        case TLM_EVENT.MODIFIED: return {
          title: t('Space updated'),
          text: t('{{author}} modified a space', i18nOpts),
          url: dashboardUrl
        }
        case TLM_EVENT.DELETED: return {
          title: t('Space deleted'),
          text: t('{{author}} deleted a space', i18nOpts),
          url: dashboardUrl
        }
        case TLM_EVENT.UNDELETED: return {
          title: t('Space restored'),
          text: t('{{author}} restored a space', i18nOpts),
          url: dashboardUrl
        }
      }
    }

    const defaultEmptyUrlMsg = t('This notification has no associated content')

    const subscriptionPageURL = '' // RJ - 2020-10-19 - FIXME: depends on https://github.com/tracim/tracim/issues/3594

    if (entityType === TLM_ENTITY.SHAREDSPACE_SUBSCRIPTION) {
      // INFO - GB - 2020-12-29 - MODIFIED.accepted and DELETED events do not make notifications

      if (user.userId === notification.subscription.author.userId) {
        // RJ - 2020-10-19 - NOTE
        // TLM_EVENT.CREATED notifications should not be shown, or even received
        // assuming that the author of a subscription is always the concerned user
        if (eventType === TLM_EVENT.MODIFIED) {
          if (notification.subscription.state === SUBSCRIPTION_TYPE.accepted.slug) return {}
          if (notification.subscription.state === SUBSCRIPTION_TYPE.rejected.slug) {
            return {
              title: t('Access removed'),
              text: t('{{author}} rejected your access to a space', i18nOpts),
              url: subscriptionPageURL,
              emptyUrlMsg: defaultEmptyUrlMsg
            }
          }
        }
      } else {
        switch (eventType) {
          case TLM_EVENT.CREATED: return {
            title: t('Requested access'),
            text: t('{{author}} requested access to a space', i18nOpts),
            url: dashboardUrl
          }
          case TLM_EVENT.MODIFIED: {
            if (notification.subscription.state === SUBSCRIPTION_TYPE.accepted.slug) return {}
            if (notification.subscription.state === SUBSCRIPTION_TYPE.rejected.slug) {
              return {
                title: t('Access removed'),
                text: t('{{author}} rejected access a space for <b>{{user}}</b>', i18nOpts),
                url: defaultEmptyUrlMsg
              }
            }

            if (notification.subscription.state === SUBSCRIPTION_TYPE.pending.slug) {
              return {
                title: t('Requested access'),
                text: t('{{author}} requested access to a space', i18nOpts),
                url: dashboardUrl
              }
            }
          }
        }
      }
    }

    if (entityType === TLM_ENTITY.REACTION) {
      i18nOpts.reaction = notification.reaction.value

      switch (eventType) {
        case TLM_EVENT.CREATED: return {
          title: t('Reaction created'),
          text: t('{{author}} reacted to {{content}} with {{reaction}}', i18nOpts),
          url: contentUrl
        }
        case TLM_EVENT.DELETED: return {
          title: t('Reaction deleted'),
          text: t('{{author}} removed their reaction {{reaction}} to {{content}}', i18nOpts),
          url: contentUrl
        }
      }
    }

    return {
      text: `${escapedAuthor} ${notification.type}`,
      url: contentUrl,
      emptyUrlMsg: defaultEmptyUrlMsg,
      msgType: 'warning'
    }
  }

  linkToComment (notification) {
    return (
      notification.content.parentContentNamespace === CONTENT_NAMESPACE.PUBLICATION
        ? PAGE.WORKSPACE.PUBLICATION(notification.workspace.id, notification.content.parentId)
        : PAGE.WORKSPACE.CONTENT(notification.workspace.id, notification.content.parentContentType, notification.content.parentId)
    )
  }

  render () {
    const { props } = this
    const { notification, user } = props
    const notificationDetails = this.getNotificationDetails(notification)
    if (Object.keys(notificationDetails).length === 0) return

    return (
      <Link
        to={notificationDetails.url || '#'}
        onClick={(e) => props.onClickNotification(e, notification.id, notificationDetails)}
        className={classnames('notification__list__item',
          { itemRead: notification.read, isMention: notificationDetails.isMention }
        )}
        key={notification.id}
      >
        <div className='notification__list__item__text'>
          <Avatar
            size={AVATAR_SIZE.SMALL}
            apiUrl={FETCH_CONFIG.apiUrl}
            user={notification.author}
          />
          <span
            className='notification__list__item__text__content'
            dangerouslySetInnerHTML={{
              __html: (
                notificationDetails.text + ' ' +
                `<span title='${escapeHtml(formatAbsoluteDate(notification.created, user.lang))}'>` +
                '</span>'
              )
            }}
          />
          {console.log(notification.group)}
        </div>
        <div className='notification__list__item__meta'>
          <div
            className='notification__list__item__meta__date'
            title={formatAbsoluteDate(notification.created, user.lang)}
          >
            {props.shortDate(notification.created)}
          </div>
          <div className='notification__list__item__meta__space'>
            {(notification.workspace &&
              notification.workspace.label
            )}
          </div>
        </div>
        <div className='notification__list__item__circle__wrapper'>
          {!notification.read && <i className='notification__list__item__circle fas fa-circle' />}
        </div>
      </Link>

    )
  }
}

const mapStateToProps = ({ user }) => ({ user })
export default connect(mapStateToProps)(translate()(TracimComponent(NotificationItem)))
