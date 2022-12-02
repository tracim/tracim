import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import FavoriteButton, { FAVORITE_STATE } from '../component/Button/FavoriteButton.jsx'

const favoriteButtonColumn = (settings, onClick) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => (
      <span>{settings.header}</span>
    ),
    id: 'favoriteButton',
    cell: props => (
      <FavoriteButton
        favoriteState={FAVORITE_STATE.FAVORITE}
        onClickRemoveFromFavoriteList={() => onClick(props.getValue())}
        onClickAddToFavoriteList={() => { }}
        customClass='favorites__item__favoriteButton'
      />
    ),
    className: settings.className
  })
}

export default favoriteButtonColumn
