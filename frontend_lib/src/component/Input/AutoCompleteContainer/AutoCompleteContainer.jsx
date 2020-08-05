import React from 'react'
import classnames from 'classnames'
import Avatar from '../../Avatar/Avatar'

export const AutoCompleteContainer = props => {
  return (
    <div className='autocomplete' style={{ ...props.style }}>
      {props.autoCompleteItemList.map((m, i) => (
        <>
          {i === props.delimiterIndex && (
            <div className='autocomplete__delimiter' />
          )}
          <div
            className={
              classnames(
                'autocomplete__item',
                props.autoCompleteCursorPosition === i ? 'autocomplete__item__active' : null
              )
            }
            key={m.mention}
            onClick={() => props.onClickAutoCompleteItem(m)}
            onPointerEnter={() => props.onPointerEnter(i)}
          >
            {m.username && <Avatar width='15px' style={{ margin: '5px' }} publicName={m.detail} />}
            <b>@{m.mention}</b> - {m.detail}
          </div>
        </>
      ))}
    </div>
  )
}

export default AutoCompleteContainer
