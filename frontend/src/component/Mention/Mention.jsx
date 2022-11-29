import React from 'react'
import { connect, Provider } from 'react-redux'
import classnames from 'classnames'
import { store } from '../../store.js'
import { ROLE_LIST } from 'tracim_frontend_lib'

const MentionWrapped = props => {
  return (
    <Provider store={store}>
      <ConnectedMention {...props} />
    </Provider>
  )
}

export const Mention = props => {
  const mention = {
    id: undefined,    // User id of the mention
    level: undefined, // 0: all, 1: reader, 2: contributor, 4: content manager, 8: workspace manager
    isToMe: false,    // true: mention to me, false: mention to someone else
    text: undefined,  // Text to display in the mention
  }

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

        if (mention.text === undefined) {
          // Fetch from API
        }
      } else {
        mention.text = user.username
      }
    }

    // We really don't know who this guy is
    if (mention.text === undefined) {
      mention.text = 'Unknown'
    }
  } else if (props.rolelevel) {
    mention.level = Number(props.rolelevel)

    const currentRoleList = store.getState().system.config.mention__default_roles
    const role = currentRoleList.find(r => Number(r.level) === mention.level)

    if (role === undefined) {
      mention.text = 'UnknownRole'
    } else {
      mention.text = role.label
    }

    if (mention.level === 0) {
      mention.isToMe = true
    } else {
      // FIXME - Doesn't work in recent activities
      const myRole = props.currentWorkspace.memberList.find(m => m.id === props.user.userId).role
      const myRoleLevel = ROLE_LIST.find(r => r.slug === myRole).id
      mention.isToMe = (myRoleLevel === mention.level)
    }
  } else if (props.rolename) {
      mention.text = props.rolename
  }


  const data = classnames(
    'mention',
    'mention-v2',
    { 'mention-me': mention.isToMe }
  )

  return (
    <span className={data}>@{mention.text}</span>
  )
}

const mapStateToProps = (
  { currentWorkspace, workspaceList, user }
) => (
  { currentWorkspace, workspaceList, user }
)
const ConnectedMention = connect(mapStateToProps)(Mention)

export default MentionWrapped
