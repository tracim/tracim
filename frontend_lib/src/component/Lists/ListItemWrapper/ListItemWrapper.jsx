import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const ListItemWrapper = props => {
  if (props.contentType === null) return null // INFO - CH - 2019-06-10 - this means the endpoint system/content_type hasn't responded yet

  return (
    <div
      className={
        classnames(
          'content',
          {
            'item-last': props.isLast,
            'item-first': props.isFirst,
            read: props.read
          },
          props.customClass)
      }
      title={props.label}
      id={props.id}
      ref={props.connectDragSource}
      data-cy={props.dataCy}
    >
      {props.children}
    </div>
  )
}

export default ListItemWrapper

ListItemWrapper.propTypes = {
  customClass: PropTypes.string,
  label: PropTypes.string,
  contentType: PropTypes.object,
  connectDragSource: PropTypes.func,
  isLast: PropTypes.bool,
  isFirst: PropTypes.bool,
  read: PropTypes.bool,
  id: PropTypes.string,
  dataCy: PropTypes.string
}

ListItemWrapper.defaultProps = {
  label: '',
  customClass: '',
  isLast: false,
  isFirst: false,
  read: false,
  id: undefined,
  dataCy: null
}
