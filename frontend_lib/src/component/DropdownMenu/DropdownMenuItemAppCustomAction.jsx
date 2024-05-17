import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export const DropdownMenuItemAppCustomAction = props => {
  if (!props.action.actionLink) return null
  const isImage = props.action.icon === '' && props.action.image !== ''
  return (
    <a
      href={props.action.actionLink}
      onClick={e => e.stopPropagation()}
      className={classnames(
        'wsContentGeneric__header__actions__item',
        { dropdownMenuSeparatorLine: props.action.addSeparator === true, isImage: isImage }
      )}
      target='_blank'
      rel='noopener noreferrer'
      download
      title={props.action.label}
      key={props.action.label}
      data-cy={props.action.dataCy}
    >
      {(isImage
        ? (
          <img
            src={props.action.image}
            className='wsContentGeneric__header__actions__item__image'
            alt=''
          />
        )
        : <i className={`fa-fw ${props.action.icon}`} />
      )}
      <span className='wsContentGeneric__header__actions__item__text'>
        {props.action.label}
      </span>
    </a>
  )
}

export default DropdownMenuItemAppCustomAction

// INFO - CH - 2024-05-16 - action must be an element of redux system.config.app_custom_actions that went through
// buildAppCustomActionLinkList from frontend_lib
DropdownMenuItemAppCustomAction.propTypes = {
  action: PropTypes.object.isRequired
}
