import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

import IconButton from './IconButton.jsx'

export const FAVORITE_STATE = {
  FAVORITE: 'favorite',
  NOT_FAVORITE: 'not-favorite'
}

const getIconButtonProps = (props) => {
  switch (props.favoriteState) {
    case FAVORITE_STATE.FAVORITE:
      return {
        icon: 'fas fa-star',
        onClick: props.onClickRemoveFromFavoriteList,
        title: props.t('Remove from favorites')
      }
    case FAVORITE_STATE.NOT_FAVORITE:
      return {
        icon: 'far fa-star',
        onClick: props.onClickAddToFavoriteList,
        title: props.t('Add to favorites')
      }
  }
}

const FavoriteButton = (props) => {
  return (
    <IconButton
      intent='link'
      dataCy={props.dataCy}
      customClass={props.customClass}
      {...getIconButtonProps(props)}
    />
  )
}

FavoriteButton.propTypes = {
  onClickAddToFavoriteList: PropTypes.func.isRequired,
  onClickRemoveFromFavoriteList: PropTypes.func.isRequired,
  favoriteState: PropTypes.oneOf(Object.values(FAVORITE_STATE)).isRequired,
  customClass: PropTypes.string,
  dataCy: PropTypes.string
}

FavoriteButton.defaultProps = {
  customClass: 'favoriteButton',
  dataCy: 'favoriteButton'
}

export default translate()(FavoriteButton)
