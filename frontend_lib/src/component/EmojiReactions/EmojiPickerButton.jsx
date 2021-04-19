import React from 'react'
import { translate } from 'react-i18next'
import { Popover, PopoverBody } from 'reactstrap'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { Picker } from 'emoji-mart'
import 'emoji-mart/css/emoji-mart.css'
import onClickOutside from 'react-onclickoutside'

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

  handleClickOutside = (e) => {
    if (!this.state.pickerDisplayed) return

    let parent = e.target
    while (parent) {
      if (parent.classList && parent.classList.contains('EmojiPickerPopover')) {
        return
      }
      parent = parent.parentNode
    }

    this.handleCancel()
    e.preventDefault()
    e.stopPropagation()
  }

  handleCancel = () => {
    this.setState({ pickerDisplayed: false })
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
          className={classnames(
            'EmojiReactionButton__buttonpicker',
            { active: this.state.pickerDisplayed }
          )}
          onClick={() => this.setState(
            prev => ({
              pickerDisplayed: !prev.pickerDisplayed
            })
          )}
        >
          <i className='far fa-smile' />
        </button>
        <Popover
          className='EmojiPickerPopover'
          toggle={this.handleCancel} // eslint-disable-line react/jsx-handler-names
          placement='left'
          boundariesElement='viewport'
          isOpen={this.state.pickerDisplayed}
          target={() => this.buttonRef.current}
        >
          <PopoverBody>
            <Picker
              native
              emojiTooltip
              autoFocus
              title=''
              i18n={emojiMartI18n}
              onSelect={this.handleSelect}
            />
          </PopoverBody>
        </Popover>
      </>
    )
  }
}

EmojiPickerButton.propTypes = {
  onAddReaction: PropTypes.func.isRequired
}

export default translate()(onClickOutside(EmojiPickerButton))
