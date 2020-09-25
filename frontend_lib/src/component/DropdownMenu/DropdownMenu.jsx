import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import DropdownMenuItem from './DropdownMenuItem.jsx'

const DropdownMenu = props => {
  return (
    <div className='dropdown'>
      <button
        aria-expanded='false'
        aria-haspopup='true'
        className={classnames(
          'btn dropdown-toggle',
          props.isButton ? 'nohover primaryColorBorder' : 'transparentButton',
          props.customClassButton
        )}
        data-cy={props.dataCyButton}
        data-toggle='dropdown'
        disabled={props.buttonDisabled}
        id='dropdownMenuButton'
        onClick={e => e.stopPropagation()}
        title={props.buttonTooltip ? props.buttonTooltip : props.buttonLabel}
        type='button'
      >
        {props.buttonOpts}
        {props.buttonIcon && <i className={`fa fa-fw ${props.buttonIcon}`} />}
        {props.buttonImage && <img className='dropdownMenu__image' src={props.buttonImage} />}
        {props.buttonLabel && <span>{props.buttonLabel}</span>}
      </button>

      <div
        aria-labelledby='dropdownMenuButton'
        className={classnames('dropdownMenu dropdown-menu', props.customClassMenu)}
      >
        {props.children.length > 1
          ? props.children.map(child => <DropdownMenuItem customClass={props.customClassItem}> {child} </DropdownMenuItem>)
          : <DropdownMenuItem customClass={props.customClassItem}> {props.children} </DropdownMenuItem>
        }
      </div>
    </div>
  )
}

export default DropdownMenu

DropdownMenu.propTypes = {
  buttonDisabled: PropTypes.bool,
  buttonIcon: PropTypes.string,
  buttonImage: PropTypes.string,
  buttonLabel: PropTypes.string,
  buttonTooltip: PropTypes.string,
  customClassButton: PropTypes.string,
  customClassItem: PropTypes.string,
  customClassMenu: PropTypes.string,
  dataCyButton: PropTypes.string,
  isButton: PropTypes.bool
}

DropdownMenu.defaultProps = {
  buttonDisabled: false,
  buttonIcon: '',
  buttonImage: '',
  buttonLabel: '',
  buttonTooltip: '',
  customClassButton: '',
  customClassMenu: '',
  customClassItem: '',
  dataCyButton: '',
  isButton: false
}
