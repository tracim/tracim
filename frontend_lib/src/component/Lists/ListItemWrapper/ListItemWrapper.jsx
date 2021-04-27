import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const ListItemWrapper = props => {
  if (props.contentType === null) return null // INFO - CH - 2019-06-10 - this means the endpoint system/content_type hasn't responded yet

  return (
    <div
      className={
        classnames('content', { 'item-last': props.isLast, read: props.read }, props.customClass)
      }
      title={props.label}
      id={props.id}
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
  isLast: PropTypes.bool,
  read: PropTypes.bool,
  id: PropTypes.string,
  dataCy: PropTypes.string
}

ListItemWrapper.defaultProps = {
  label: '',
  customClass: '',
  isLast: false,
  read: false,
  id: undefined,
  dataCy: null
}
