import React from 'react'
import PropTypes from 'prop-types'
import EmojiReactionButton from './EmojiReactionButton.jsx'
import EmojiPickerButton from './EmojiPickerButton.jsx'
import { isBefore, compareAsc, parseISO } from 'date-fns'

function groupReactionsByValue (reactionList) {
  const reactionListsByValueObject = {}

  for (const reaction of reactionList) {
    const group = (
      reactionListsByValueObject[reaction.value] || (
        reactionListsByValueObject[reaction.value] = {
          oldest: reaction.created,
          reactionList: []
        }
      )
    )

    group.reactionList.push(reaction)

    const reactionDate = parseISO(reaction.created)
    if (!group.oldest || isBefore(reactionDate, group.oldest)) {
      group.oldest = reactionDate
    }
  }

  return Object.values(reactionListsByValueObject)
}

const EmojiReactions = (props) => {
  const reactionListsByCreation = groupReactionsByValue(props.reactionList).sort(
    (groupA, groupB) => compareAsc(groupA.smallestId, groupB.smallestId)
  )

  return (
    <div className='EmojiReactions'>
      {
        reactionListsByCreation.map(({ reactionList }) => {
          const userReaction = reactionList.find(
            reaction => reaction.author.user_id === props.loggedUserId
          )

          // INFO - RJ - 2021-03-17
          // userReactionId is -1 if the user hasn't reacted with this emoji
          const userReactionId = userReaction ? userReaction.reaction_id : -1

          const value = reactionList[0].value

          return (
            <EmojiReactionButton
              key={value}
              onRemoveReaction={() => props.onRemoveReaction(userReactionId)}
              onAddReaction={() => props.onAddReaction(value)}
              reactionList={reactionList}
              userReactionId={userReactionId}
            />
          )
        })
      }
      {(props.readOnly  || true) && <EmojiPickerButton onAddReaction={props.onAddReaction} />}
    </div>
  )
}

EmojiReactions.propTypes = {
  loggedUserId: PropTypes.number.isRequired,
  contentId: PropTypes.number.isRequired,
  workspaceId: PropTypes.number.isRequired,
  reactionList: PropTypes.array.isRequired,
  onRemoveReaction: PropTypes.func.isRequired,
  onAddReaction: PropTypes.func.isRequired,
  readOnly: PropTypes.bool.isRequired
}

export default EmojiReactions
