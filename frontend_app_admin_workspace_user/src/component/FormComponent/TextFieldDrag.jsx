import React from 'react'
import { useDrag } from 'react-dnd'

const id = 'textField'
const type = 'formComponent'

function TextFieldDrag(props) {
  const [collectedProps, drag] = useDrag({
    item: { id, type },
  })
  return <div ref={drag}>TextField</div>
}

export default TextFieldDrag
