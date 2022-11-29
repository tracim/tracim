import React from 'react'
import FavoritesTable from './FavoritesTable.jsx'

const FavoriteTableMockData = (props) => {
  const defaultContent = {
    content: {
      fileExtension: '.txt',
      fileName: 'myFileWithASuperLongTitleLikeItIsVeryLongAsYouCanSee.txt',
      currentRevisionType: 'revision',
      label: 'myFileWithASuperLongTitleLikeItIsVeryLongAsYouCanSee',
      statusSlug: 'open',
      modified: '2022-11-07T14:35:36Z',
      lastModifier: {
        publicName: 'Global Manager',
        username: 'TheAdmin'
      },
      type: 'file'
    },
    breadcrumbs: [
      { label: 'asfsaf' },
      {
        label: 'build_full_frontend',
        content_id: 155,
        slug: 'build-full-frontend',
        content_type: 'file'
      }
    ]
  }

  const defaultData = [
    defaultContent,
    defaultContent,
    defaultContent,
    defaultContent,
    defaultContent
  ]

  return (
    <FavoritesTable favoriteList={defaultData} onFavoriteButtonClick={props.onClick} />
  )
}

export default FavoriteTableMockData
