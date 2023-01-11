import React from 'react'
import classnames from 'classnames'
import { createColumnHelper } from '@tanstack/react-table'
import FavoriteButton, { FAVORITE_STATE } from '../../component/Button/FavoriteButton.jsx'

const favoriteButtonColumn = (settings, onClick) => {
  const columnHelper = createColumnHelper()
  return columnHelper.display({
    header: () => (
      <span>{settings.header}</span>
    ),
    id: settings.id,
    cell: props => (
      <FavoriteButton
        favoriteState={FAVORITE_STATE.FAVORITE}
        onClickRemoveFromFavoriteList={() => onClick(props.row.original)}
        onClickAddToFavoriteList={() => { }}
        customClass='favorites__item__favoriteButton'
      />
    ),
    className: settings.className,
    style: classnames(settings.style)
  })
}

export default favoriteButtonColumn
