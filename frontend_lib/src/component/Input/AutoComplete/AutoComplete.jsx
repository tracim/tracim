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
              {props.t(autocompleteItem.detail)}
            </b>
            &nbsp;-&nbsp;
            {autocompleteItem.mention ? `@${autocompleteItem.mention}` : `#${autocompleteItem.content_id}`}
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
