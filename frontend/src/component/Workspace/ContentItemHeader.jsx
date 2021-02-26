import React from 'react'
import { translate } from 'react-i18next'

export const FileItemHeader = props => {
  return (
    <div className='content__header'>
      <div className='content__header__type'>
        {props.t('Type')}
      </div>
      <div className='content__header__name'>
        {props.t('Title')}
      </div>
      {props.showSearchDetails && (
        <div className='content__header__search'>
          <div className='content__header__search__path'>
            {props.t('Path')}
          </div>
          <div className='content__header__search__modif'>
            {props.t('Last Modification')}
          </div>
        </div>
      )}
      <div className='content__header__status'>
        {props.t('Status')}
      </div>
    </div>
  )
}

export default translate()(FileItemHeader)
