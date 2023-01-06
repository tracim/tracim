import React, { useState } from 'react'
import { connect, Provider } from 'react-redux'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import { ROLE_LIST } from 'tracim_frontend_lib'
import { store } from '../../store.js'

import {
  getUser
} from '../../action-creator.async.js'

const MentionWrapped = props => {
  return (
    <Provider store={store}>
      <ConnectedMention {...props} />
    </Provider>
  )
}

export const Mention = props => {
  const DEFAULT_MENTION = props.t('UnknownUser')

  const [mention, setMention] = useState({
    id: undefined, // User id of the mention
    level: undefined, // 0: all, 1: reader, 2: contributor, 4: content manager, 8: workspace manager
    isToMe: false, // true: mention to me, false: mention to someone else
    text: DEFAULT_MENTION // Text to display in the mention
  })

  const completeRoleList = ROLE_LIST.concat([{
    id: 0,
    label: props.t('All'),
    slug: props.t('all')
  }])

  if (props.userid) {
    mention.id = Number(props.userid)

    if (mention.id === props.user.userId) {
      // No need to fetch the user if it's the current user
      mention.text = props.user.username
      mention.isToMe = true
    } else {
      // Fetch from current space
      const user = props.currentWorkspace.memberList.find(m => m.id === mention.id)

      if (user === undefined) {
        // Fetch from other spaces
        let testedSpace = 0
        while ((mention.text === undefined) && (testedSpace < props.workspaceList.length)) {
          mention.text = props.workspaceList[testedSpace].memberList.find(m => m.id === mention.id).username
          testedSpace++
        }

        if (mention.text === DEFAULT_MENTION) {
          // Fetch from API
          props.dispatch(getUser(mention.id)).then((response) => {
            if (response.status === 200) {
              const user = response.json
              setMention({ ...mention, text: user.username })
            }
          })
        }
      } else {
        mention.text = user.username
      }
    }
  } else if (props.roleid) {
    mention.level = Number(props.roleid)
    mention.text = props.t('UnknownRole')

    const role = completeRoleList.find(r => Number(r.id) === mention.level)

    if (role) {
      mention.text = role.slug
    }

    if (mention.level === 0) {
      mention.isToMe = true
    } else {
      // FIXME - Doesn't work in recent activities
      const myRole = props.currentWorkspace.memberList.find(m => m.id === props.user.userId).role
      const myRoleLevel = completeRoleList.find(r => r.slug === myRole).id
      mention.isToMe = (myRoleLevel >= mention.level)
    }
  }

  const data = classnames(
    'mention',
    'mention-v2', // NOTE - MP - 2023-01-02 - Not used yet
    { 'mention-me': mention.isToMe }
  )

  return (
    <span className={data}>@{mention.text}</span>
  )
}

const mapStateToProps = (
  { currentWorkspace, system, user, workspaceList }
) => (
  { currentWorkspace, system, user, workspaceList }
)
const ConnectedMention = translate()(connect(mapStateToProps)(Mention))

export default MentionWrapped
