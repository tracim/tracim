import React from 'react'

const EmptyListMessage = (props) => {
  return (
    <div className='emptyListMessage'>
      <div className='emptyListMessage__text'>
        {props.children}
      </div>
    </div>
  )
}

export default EmptyListMessage
