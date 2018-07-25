import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const CardBody = props => {
  return (
    <div className='card-body'>
      <form className={classnames(props.formClass)}>
        {props.children}
      </form>
    </div>
  )
}

export default CardBody

CardBody.propTypes = {
  children: PropTypes.element.isRequired,
  formClass: PropTypes.string
}

CardBody.defaultProps = {
  formClass: ''
}
