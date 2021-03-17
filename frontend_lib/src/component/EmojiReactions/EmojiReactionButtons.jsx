import React from 'react'
import { translate } from 'react-i18next'
import 'emoji-mart/css/emoji-mart.css'
import emojiData from 'emoji-mart/data/all.json'
import { getEmojiDataFromNative, Picker } from 'emoji-mart'

import { UncontrolledPopover, PopoverBody } from 'reactstrap'

import PropTypes from 'prop-types'
import classnames from 'classnames'

import { andList } from '../../helper.js'

class EmojiPickerButton extends React.Component {
  constructor (props) {
    super(props)
    this.state = { pickerDisplayed: false }
    this.buttonRef = React.createRef()
  }

  handleSelect = (emoji) => {
    this.props.onAddReaction(emoji.native)
    this.setState({ pickerDisplayed: false })
  }

  handleBodyClick = (e) => {
    if (!this.state.pickerDisplayed) return

    let parent = e.target
    while (parent) {
      if (parent.classList && parent.classList.contains('EmojiPickerPopover')) {
        return
      }
      parent = parent.parentNode
    }

    this.setState({ pickerDisplayed: false })
    e.preventDefault()
    e.stopPropagation()
  }

  componentDidMount () {
    document.body.addEventListener('click', this.handleBodyClick)
    document.body.addEventListener('touch', this.handleBodyClick)
  }

  componentWillUnmount () {
    document.body.removeEventListener('click', this.handleBodyClick)
    document.body.addEventListener('touch', this.handleBodyClick)
  }

  render () {
    const { props } = this

    const emojiMartI18n = {
      search: props.t('Search'),
      clear: props.t('Clear'),
      notfound: props.t('No Emoji Found'),
      skintext: props.t('Choose your default skin tone'),
      categories: {
        search: props.t('Search Results'),
        recent: props.t('Frequently Used'),
        smileys: props.t('Smileys & Emotion'),
        people: props.t('People & Body'),
        nature: props.t('Animals & Nature'),
        foods: props.t('Food & Drink'),
        activity: props.t('Activity'),
        places: props.t('Travel & Places'),
        objects: props.t('Objects'),
        symbols: props.t('Symbols'),
        flags: props.t('Flags'),
        custom: props.t('Custom')
      },
      categorieslabel: props.t('Emoji categories'),
      skintones: {
        1: props.t('Default Skin Tone'),
        2: props.t('Light Skin Tone'),
        3: props.t('Medium-Light Skin Tone'),
        4: props.t('Medium Skin Tone'),
        5: props.t('Medium-Dark Skin Tone'),
        6: props.t('Dark Skin Tone')
      }
    }

    return (
      <>
        <button
          title={props.t('React')}
          ref={this.buttonRef}
          className={classnames('ReactionButton__buttonpicker', { active: this.state.pickerDisplayed })}
          onClick={() => this.setState(
            prev => ({
              pickerDisplayed: !prev.pickerDisplayed
            })
          )}
        >
          <i className='far fa-smile' />
        </button>
        {(this.state.pickerDisplayed
          ? (
            <UncontrolledPopover
              className='EmojiPickerPopover'
              toggle={props.onCancel} // eslint-disable-line react/jsx-handler-names
              placement='left'
              isOpen
              target={() => this.buttonRef.current}
            >
              <PopoverBody>
                <Picker
                  native
                  emojiTooltip
                  title=''
                  i18n={emojiMartI18n}
                  onSelect={this.handleSelect}
                />
              </PopoverBody>
            </UncontrolledPopover>
          )
          : undefined
        )}
      </>
    )
  }
}

const TranslatedEmojiPickerButton = translate()(EmojiPickerButton)

function getReactionButtonTitle (props) {
  const reactionList = props.reactionList

  const you = (
    reactionList[0].reaction_id === props.userReactionId
      ? props.t('You')
      : props.t('you')
  )

  const value = props.reactionList[0].value
  const emoji = getEmojiDataFromNative(value, 'apple', emojiData)

  const users = andList(
    props.reactionList.map(
      ({ author, reaction_id: reactionId }) => (
        reactionId === props.userReactionId
          ? you
          : (author.public_name || author.username)
      )
    )
  )

  const l10nOpts = {
    reaction: emoji ? (emoji.id || emoji.name) : value,
    users: users,
    user: users
  }

  return (
    props.userReactionId === -1
      ? (
        props.reactionList.length === 1
          ? props.t('{{user}} reacted with {{reaction}}', l10nOpts)
          : props.t('{{users}} reacted with {{reaction}}_them', l10nOpts)
      )
      : (
        props.reactionList.length === 1
          ? props.t('You reacted with {{reaction}}', l10nOpts)
          : props.t('{{users}} reacted with {{reaction}}_you', l10nOpts)
      )
  )
}

const ReactionButton = translate()(function ReactionButton (props) {
  const highlighted = props.userReactionId !== -1
  const title = getReactionButtonTitle(props)

  return (
    <button
      onClick={highlighted ? props.onRemoveReaction : props.onAddReaction}
      title={title}
      className={classnames('ReactionButton__button', { highlighted })}
    >
      <span className='ReactionButton__button__value'>{props.reactionList[0].value}</span>
      <span className='ReactionButton__button__count'>{props.reactionList.length}</span>
    </button>
  )
})

ReactionButton.propTypes = {
  reactionList: PropTypes.array.isRequired,
  userReactionId: PropTypes.number.isRequired,
  onRemoveReaction: PropTypes.func.isRequired,
  onAddReaction: PropTypes.func.isRequired
}

function groupReactionsByValue (reactionList) {
  const reactionListsByValue = {}

  for (const reaction of reactionList) {
    const bucket = (
      reactionListsByValue[reaction.value] || (
        reactionListsByValue[reaction.value] = {
          firstCreation: reaction.created,
          reactionList: []
        }
      )
    )

    bucket.reactionList.push(reaction)

    if (!bucket.firstCreation || bucket.firstCreation > reaction.created) {
      bucket.firstCreation = reaction.created
    }
  }

  return Object.values(reactionListsByValue)
}

const EmojiReactionButtons = (props) => {
  const reactionListsByCreation = groupReactionsByValue(props.reactionList).sort(
    (bucketA, bucketB) => bucketA.firstCreation < bucketB.firstCreation
  )

  return (
    <div className='EmojiReactionButtons'>
      {
        reactionListsByCreation.map(({ reactionList }) => {
          const userReaction = reactionList.find(
            reaction => reaction.author.user_id === props.loggedUserId
          )
          const userReactionId = userReaction ? userReaction.reaction_id : -1
          const value = reactionList[0].value

          return (
            <ReactionButton
              key={value}
              onRemoveReaction={() => props.onRemoveReaction(userReactionId)}
              onAddReaction={() => props.onAddReaction(value)}
              reactionList={reactionList}
              userReactionId={userReactionId}
            />
          )
        })
      }
      <TranslatedEmojiPickerButton onAddReaction={props.onAddReaction} />
    </div>
  )
}

EmojiReactionButtons.propTypes = {
  loggedUserId: PropTypes.number.isRequired,
  contentId: PropTypes.number.isRequired,
  workspaceId: PropTypes.number.isRequired,
  reactionList: PropTypes.array.isRequired,
  onRemoveReaction: PropTypes.func.isRequired,
  onAddReaction: PropTypes.func.isRequired
}

export default EmojiReactionButtons
