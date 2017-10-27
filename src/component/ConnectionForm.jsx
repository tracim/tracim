import React from 'react'

export const Connection = props => {
  return (
    <div>
      <input type='text' onChange={props.onChangeLogin} placeholder='Login' />
      <input type='text' onChange={props.onChangePassword} placeholder='Password' />
      <button type='button' onClick={props.onClickSubmit}>Connect</button>
    </div>
  )
}
