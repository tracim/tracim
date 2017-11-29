import React from 'react'
import PropTypes from 'prop-types'

const Help = props => {
  return (
    <li className='header__menu__rightside__itemquestion'>
      <button
        type='button'
        className='header__menu__rightside__itemquestion__btnquestion btnnavbar btn btn-primary'
        onClick={props.onClickHelp}
      >
        <i className='btnquestion__icon fa fa-question' />
      </button>
    </li>
  )
}
export default Help

Help.PropTypes = {
  onClickHelp: PropTypes.func.isRequired
}
