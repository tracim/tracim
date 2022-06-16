import React from 'react'
import PropTypes from 'prop-types'

const ToDoItem = props => {
  return <div>{props.todo}</div>
}
export default ToDoItem

ToDoItem.propTypes = {
  todo: PropTypes.object.isRequired
}

ToDoItem.defaultProps = {
}
