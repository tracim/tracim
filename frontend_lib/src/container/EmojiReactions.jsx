import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import {
  postContentReaction,
  deleteContentReaction,
  getContentReactionList
} from '../action.async.js'

import { sendGlobalFlashMessage, handleFetchResult } from '../helper.js'
import { TracimComponent } from '../tracimComponent.js'

import {
  TLM_ENTITY_TYPE as TLM_ET,
  TLM_CORE_EVENT_TYPE as TLM_CET
} from '../tracimLiveMessage.js'

import EmojiReactionsComponent from '../component/EmojiReactions/EmojiReactions.jsx'

const ERR_REACTION_ALREADY_EXISTS = 3013
const ERR_REACTION_NOT_FOUND = 1022

class EmojiReactions extends React.Component {
  constructor (props) {
    super(props)
    this.state = { reactionList: [] }
    props.registerLiveMessageHandlerList([
      { entityType: TLM_ET.REACTION, coreEntityType: TLM_CET.CREATED, handler: this.handleLiveMessageReactionAdded },
      { entityType: TLM_ET.REACTION, coreEntityType: TLM_CET.DELETED, handler: this.handleLiveMessageReactionDeleted },
      { entityType: TLM_ET.REACTION, coreEntityType: TLM_CET.UNDELETED, handler: this.handleLiveMessageReactionAdded }
    ])
  }

  async updateReactionList () {
    const { props } = this

    const fetchGetContentReactionList = await handleFetchResult(
      await getContentReactionList(props.apiUrl, props.workspaceId, props.contentId)
    )

    if (fetchGetContentReactionList.apiResponse.ok) {
      this.setState({ reactionList: fetchGetContentReactionList.body })
    } else {
      sendGlobalFlashMessage(props.t('Error while fetching a list of reactions'))
    }
  }

  componentDidMount () {
    this.updateReactionList()
  }

  componentDidUpdate (prevProps) {
    const { props } = this

    if (prevProps.contentId !== props.contentId || prevProps.loggedUser.userId !== props.loggedUser.userId) {
      this.updateReactionList()
    }
  }

  handleLiveMessageReactionAdded = (data) => {
    const reaction = data.fields.reaction
    if (reaction.content_id !== this.props.contentId) return

    this.setState(prev => ({
      reactionList: [
        ...prev.reactionList,
        reaction
      ]
    }))
  }

  handleLiveMessageReactionDeleted = (data) => {
    const reaction = data.fields.reaction
    if (reaction.content_id !== this.props.contentId) return

    const reactionId = reaction.reaction_id

    this.setState(prev => ({
      reactionList: prev.reactionList.filter(
        reaction => reactionId !== reaction.reaction_id
      )
    }))
  }

  handleAddReaction = async (value) => {
    const { props } = this
    const fetchPostReaction = await handleFetchResult(
      await postContentReaction(props.apiUrl, props.workspaceId, props.contentId, value)
    )

    if (!fetchPostReaction.apiResponse.ok && !(fetchPostReaction.body && fetchPostReaction.body.code === ERR_REACTION_ALREADY_EXISTS)) {
      sendGlobalFlashMessage(props.t('Error while adding your reaction'))
    }
  }

  handleRemoveReaction = async (reactionId) => {
    const { props } = this
    const fetchDeleteReaction = await handleFetchResult(
      await deleteContentReaction(props.apiUrl, props.workspaceId, props.contentId, reactionId)
    )

    if (!fetchDeleteReaction.ok && !(fetchDeleteReaction.body && fetchDeleteReaction.body.code === ERR_REACTION_NOT_FOUND)) {
      sendGlobalFlashMessage(props.t('Error while removing your reaction'))
    }
  }

  render () {
    const { props, state } = this
    return (
      <EmojiReactionsComponent
        loggedUser={props.loggedUser}
        contentId={props.contentId}
        workspaceId={props.workspaceId}
        reactionList={state.reactionList}
        onAddReaction={this.handleAddReaction}
        onRemoveReaction={this.handleRemoveReaction}
      />
    )
  }
}

EmojiReactions.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  loggedUser: PropTypes.object.isRequired,
  contentId: PropTypes.number.isRequired,
  workspaceId: PropTypes.number.isRequired,
}

export default translate()(TracimComponent(EmojiReactions))
