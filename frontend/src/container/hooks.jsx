import React, { useState } from 'react'

function Hooks (props) {
  if (props.qqch === true) {
    const [te, sete] = useState(0)
  }

  return (
    <div onClick={() => sete(3)}>test {te}</div>
  )
}

export default Hooks
