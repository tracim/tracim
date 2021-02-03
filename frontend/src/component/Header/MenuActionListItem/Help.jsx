import React from 'react'
import PropTypes from 'prop-types'

const Help = props => {
  return (
    <li className='header__menu__rightside__itemquestion'>
      <button
        type='button'
        className='header__menu__rightside__itemquestion__btnquestion btnnavbar btn btn-outline-primary'
        onClick={props.onClickHelp}
      >
        <i className='btnquestion__icon fas fa-question' />
      </button>
    </li>
  )
}
export default Help

Help.propTypes = {
  onClickHelp: PropTypes.func.isRequired
}
