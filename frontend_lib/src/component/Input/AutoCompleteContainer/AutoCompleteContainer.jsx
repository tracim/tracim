import React from 'react'
import classnames from 'classnames'
import Avatar from '../../Avatar/Avatar'
import PropTypes from 'prop-types'

export const AutoCompleteContainer = props => {
  return (
    <div className='autocomplete' style={props.style}>
      {props.autoCompleteItemList.map((m, i) => (
        <>
          <div
            className={
              classnames('autocomplete__item', { autocomplete__item__active: props.autoCompleteCursorPosition === i })
            }
            key={m.mention}
            onClick={() => props.onClickAutoCompleteItem(m)}
          >
            {m.username && <Avatar width='15px' style={{ 'margin-top': '5px' }} publicName={m.detail} />}
            <b className='autocomplete__item__mention'>@{m.mention}</b> - {m.detail}
          </div>
          {i === props.delimiterIndex && i !== props.autoCompleteItemList.length - 1 && (
            <div className='autocomplete__delimiter' />
          )}
        </>
      ))}
    </div>
  )
}

export default AutoCompleteContainer

AutoCompleteContainer.propTypes = {
  autoCompleteItemList: PropTypes.array,
  style: PropTypes.object,
  autoCompleteCursorPosition: PropTypes.number,
  onClickAutoCompleteItem: PropTypes.func,
  delimiterIndex: PropTypes.number
}

AutoCompleteContainer.defaultProps = {
  autoCompleteItemList: [],
  style: {},
  autoCompleteCursorPosition: 0,
  onClickAutoCompleteItem: () => {},
  delimiterIndex: -1
}
