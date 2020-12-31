import React from 'react'
import classnames from 'classnames'
import Avatar, { AVATAR_SIZE } from '../../Avatar/Avatar'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

export const MentionAutoComplete = props => {
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
            {m.username && <Avatar size={AVATAR_SIZE.MINI} style={{ marginTop: '5px' }} publicName={m.detail} />}
            <b className='autocomplete__item__mention'>@{m.mention}</b>&nbsp;-&nbsp;{props.t(m.detail)}
          </div>
          {i === props.delimiterIndex && i !== props.autoCompleteItemList.length - 1 && (
            <div className='autocomplete__delimiter' />
          )}
        </>
      ))}
    </div>
  )
}

export default translate()(MentionAutoComplete)

MentionAutoComplete.propTypes = {
  autoCompleteItemList: PropTypes.array,
  style: PropTypes.object,
  autoCompleteCursorPosition: PropTypes.number,
  onClickAutoCompleteItem: PropTypes.func,
  delimiterIndex: PropTypes.number
}

MentionAutoComplete.defaultProps = {
  autoCompleteItemList: [],
  style: {},
  autoCompleteCursorPosition: 0,
  onClickAutoCompleteItem: () => {},
  delimiterIndex: -1
}
