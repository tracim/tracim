import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { translate } from 'react-i18next'
import { humanAndList } from '../../helper.js'
import { getEmojiDataFromNative } from 'emoji-mart'
import emojiData from 'emoji-mart/data/all.json'
import Radium from 'radium'

const color = require('color')

const primaryColor = GLOBAL_primaryColor // eslint-disable-line camelcase
const HIGHLIGHTED_BUTTON_STYLE = {
  backgroundColor: color(primaryColor).lighten(1.85).hex(),
  ':hover:not(:disabled)': {
    backgroundColor: color(primaryColor).lighten(1.5).hex()
  }
}

function getEmojiReactionButtonTitle (reactionList, userReactionId, t) {
  // INFO - RJ - 2021-03-18 - this function builds a title like:
  //  - X, Y, Z and W reacted with joy
  //  - You, X and Z reacted with joy
  //  - X, you and Z reacted with joy

  // INFO - RJ - 2021-03-18 - if the first reaction belongs to the user,
  // "you" will be capitalized ("You")
  const youLabel = (
    reactionList[0].reaction_id === userReactionId
      ? t('You')
      : t('you')
  )

  const value = reactionList[0].value
  const emoji = getEmojiDataFromNative(value, '', emojiData)

  // INFO - RJ - 2021-03-18 - We build the list of users who reacted
  const users = humanAndList(
    reactionList.map(
      ({ author, reaction_id: reactionId }) => (
        reactionId === userReactionId
          ? youLabel
          : (author.public_name || author.username)
      )
    )
  )

  const i18nOpts = {
    reaction: emoji ? (emoji.id || emoji.name) : value,
    users: users,
    interpolation: { escapeValue: false }
  }

  return (
    userReactionId === -1
      ? (
        reactionList.length === 1
          ? t('{{users}} reacted with {{reaction}}', i18nOpts)
          : t('{{users}} reacted with {{reaction}}_them', i18nOpts)
      )
      : (
        reactionList.length === 1
          ? t('You reacted with {{reaction}}', i18nOpts)
          : t('{{users}} reacted with {{reaction}}_you', i18nOpts)
      )
  )
}

function EmojiReactionButton (props) {
  const { reactionList, userReactionId, t } = props
  const highlighted = userReactionId !== -1
  const title = getEmojiReactionButtonTitle(reactionList, userReactionId, t)
  return (
    <button
      onClick={highlighted ? props.onRemoveReaction : props.onAddReaction}
      title={title}
      disabled={props.readOnly}
      className={classnames(
        'EmojiReactionButton__button', {
          primaryColorBorder: highlighted,
          highlighted
        }
      )}
      style={highlighted ? HIGHLIGHTED_BUTTON_STYLE : {}}
    >
      <span className='EmojiReactionButton__button__value'>{reactionList[0].value}</span>
      <span className='EmojiReactionButton__button__count'>{reactionList.length}</span>
    </button>
  )
}

EmojiReactionButton.propTypes = {
  reactionList: PropTypes.array.isRequired,
  userReactionId: PropTypes.number.isRequired,
  onRemoveReaction: PropTypes.func.isRequired,
  readOnly: PropTypes.bool.isRequired,
  onAddReaction: PropTypes.func.isRequired
}

export default translate()(Radium(EmojiReactionButton))
