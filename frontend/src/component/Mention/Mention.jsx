import React, { useEffect, useState } from 'react'
import { connect, Provider } from 'react-redux'
import { translate } from 'react-i18next'
import classnames from 'classnames'
import { DEFAULT_ROLE_LIST } from 'tracim_frontend_lib'
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

const calculateUserMention = (props) => {
  const mention = {
    isToMe: false, // true: mention to me, false: mention to someone else
    text: 'UndefinedUser' // Text to display in the mention
  }
  const userId = Number(props.userid) // User id of the mention

  if (userId === props.user.userId) {
    // No need to fetch the user if it's the current user
    mention.text = props.user.username
    mention.isToMe = true
    return mention
  }

  // Fetch from current space
  const user = props.currentWorkspace.memberList.find(m => m.id === userId)
  if (user) {
    mention.text = user.username
    return mention
  }

  // Fetch from other spaces
  for (const space of props.workspaceList) {
    const user = space.memberList.find(m => m.id === userId)
    if (user) {
      mention.text = user.username
      return mention
    }
  }

  // Fetch from API (can't use async since it's used to render)
  props.dispatch(getUser(userId)).then(
    (response) => {
      if (response.status === 200) {
        const user = response.json
        mention.text = user.username
      }
    },
    (error) => {
      console.error('Error in Mention.jsx, fetching from API went wrong: ', error.message)
    }
  )
  return mention
}

const calculateRoleMention = (props) => {
  const mention = {
    isToMe: false, // true: mention to me, false: mention to someone else
    text: undefined // Text to display in the mention
  }
  // 0: all, 1: reader, 2: contributor, 4: content manager, 8: workspace manager
  const roleId = Number(props.roleid)
  const role = DEFAULT_ROLE_LIST.find(r => Number(r.id) === roleId)

  if (role) {
    mention.text = props.t(role.slug)
  }

  // NOTE - MP - 2023-01-11 - So far we don't support other roles than `all`
  if (roleId === 0) {
    mention.isToMe = true
  }

  return mention
}

export const Mention = props => {
  const DEFAULT_MENTION_USER = props.t('UnknownUser')
  const DEFAULT_MENTION_ROLE = props.t('UnknownRole')

  const [text, setText] = useState('')
  const [isToMe, setIsToMe] = useState(false)

  useEffect(() => {
    if (props.userid) {
      const mention = calculateUserMention(props)
      setIsToMe(mention.isToMe)
      if (text === undefined) {
        setText(DEFAULT_MENTION_USER)
      } else {
        setText(mention.text)
      }
    } else if (props.roleid) {
      const mention = calculateRoleMention(props)
      setIsToMe(mention.isToMe)
      if (mention.text === undefined) {
        setText(DEFAULT_MENTION_ROLE)
      } else {
        setText(mention.text)
      }
    }
  }, [props.user.username, props.currentWorkspace.memberList, props.workspaceList])

  const data = classnames(
    'mention',
    { 'mention-me': isToMe === true }
  )

  return (
    <span className={data}>@{text}</span>
  )
}

const mapStateToProps = (
  { currentWorkspace, system, user, workspaceList }
) => (
  { currentWorkspace, system, user, workspaceList }
)
const ConnectedMention = translate()(connect(mapStateToProps)(Mention))

export default MentionWrapped
