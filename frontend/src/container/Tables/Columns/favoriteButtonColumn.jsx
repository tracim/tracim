import React from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import {
  FAVORITE_STATE,
  FavoriteButton
} from 'tracim_frontend_lib'

const favoriteButtonColumn = (header, onClick) => {
  const columnHelper = createColumnHelper()
  return columnHelper.accessor(row => row, {
    header: () => (
      <span>{header}</span>
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
    className: 'TracimTable__styles__flex__1'
  })
}

export default favoriteButtonColumn
