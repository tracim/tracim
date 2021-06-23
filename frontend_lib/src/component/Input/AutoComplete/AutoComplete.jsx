import React from 'react'
import classnames from 'classnames'
import Avatar, { AVATAR_SIZE } from '../../Avatar/Avatar'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

export const AutoComplete = props => {
  return (
    <div className='autocomplete' style={props.style}>
      {props.autoCompleteItemList.map((autocompleteItem, i) => (
        <div key={autocompleteItem.mention || autocompleteItem.content_id}>
          <div
            className={
              classnames('autocomplete__item', {
                autocomplete__item__active: props.autoCompleteCursorPosition === i
              })
            }
            onClick={(e) => {
              props.onClickAutoCompleteItem(autocompleteItem)

              // HACK - RJ - 2021-06-23 (https://github.com/tracim/tracim/issues/4757)
              //
              // Clicking outside of TinyMCE seems to trigger some modifications
              // in TinyMCE (maybe some clean-up).
              // These modifications trigger a TinyMCE change event with the
              // current content and prevents the modifications done by the
              // autocompletion from producing a TinyMCE change event.
              //
              // This hack prevents these modifications from happening
              // We shall find out what really causes these modifications and
              // remove the following lines that cancel the click event.

              e.preventDefault()
              e.stopPropagation()
            }}
          >
            {autocompleteItem.username && (
              <Avatar
                user={{ ...autocompleteItem, publicName: autocompleteItem.detail }}
                apiUrl={props.apiUrl}
                size={AVATAR_SIZE.MINI}
                style={{ marginTop: '5px' }}
              />
            )}
            <b className='autocomplete__item__highlight'>
              {autocompleteItem.mention ? `@${autocompleteItem.mention}` : `#${autocompleteItem.content_id}`}
            </b>
            &nbsp;-&nbsp;
            {props.t(autocompleteItem.detail)}
          </div>
          {i === props.delimiterIndex && i !== props.autoCompleteItemList.length - 1 && (
            <div className='autocomplete__delimiter' key={`delimiter${i}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default translate()(AutoComplete)

AutoComplete.propTypes = {
  autoCompleteItemList: PropTypes.array,
  style: PropTypes.object,
  autoCompleteCursorPosition: PropTypes.number,
  onClickAutoCompleteItem: PropTypes.func,
  delimiterIndex: PropTypes.number
}

AutoComplete.defaultProps = {
  autoCompleteItemList: [],
  style: {},
  autoCompleteCursorPosition: 0,
  onClickAutoCompleteItem: () => {},
  delimiterIndex: -1
}
