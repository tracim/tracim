import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { DropdownMenu } from 'tracim_frontend_lib'

export const DropdownCreateButton = props => {
  return (
    <DropdownMenu
      buttonCustomClass='dropdownCreateBtn__label highlightBtn primaryColorBg primaryColorBorderDarkenHover primaryColorBgDarkenHover'
      buttonDataCy='dropdownCreateBtn'
      buttonLabel={`${props.t('Create')}...`}
      buttonTooltip={props.t('Create')}
      isButton
    >
      {props.availableApp.map(app =>
        <button
          className='transparentButton'
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            props.onClickCreateContent(e, props.folderId, app.slug)
          }}
          key={app.slug}
          childrenKey={app.slug}
        >
          <i
            className={`fa fa-fw fa-${app.faIcon}`}
            style={{ color: app.hexcolor }}
          />
          {props.t(app.creationLabel)}
        </button>
      )}
    </DropdownMenu>
  )
}

export default translate()(DropdownCreateButton)

DropdownCreateButton.propTypes = {
  availableApp: PropTypes.array.isRequired,
  onClickCreateContent: PropTypes.func.isRequired,
  folderId: PropTypes.number
}

DropdownCreateButton.defaultProps = {
  folderId: null
}
