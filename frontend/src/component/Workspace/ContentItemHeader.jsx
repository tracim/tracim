import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { SORT_BY, TitleListHeader } from 'tracim_frontend_lib'

export const ContentItemHeader = props => {
  return (
    <div className='content__header'>
      <TitleListHeader
        title={props.t('Type')}
        onClickTitle={() => props.onClickTitle(SORT_BY.CONTENT_TYPE)}
        customClass='content__header__type'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriteria === SORT_BY.CONTENT_TYPE}
        tootltip={props.t('Sort by type')}
      />

      <TitleListHeader
        title={props.t('Title')}
        onClickTitle={() => props.onClickTitle(SORT_BY.LABEL)}
        customClass='content__header__name'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriteria === SORT_BY.LABEL}
        tootltip={props.t('Sort by title')}
      />

      {props.showSearchDetails && ( // GIULIA use TitleListHeader
        <div className='content__header__search'>
          <div className='content__header__search__path'>
            {props.t('Path')}
          </div>

          <TitleListHeader
            title={props.t('Last Modification')}
            onClickTitle={() => props.onClickTitle(SORT_BY.MODIFICATION_DATE)}
            customClass='content__header__search__modif'
            isOrderAscending={props.isOrderAscending}
            isSelected={props.selectedSortCriteria === SORT_BY.MODIFICATION_DATE}
            tootltip={props.t('Sort by last Modification')}
          />
        </div>
      )}

      <TitleListHeader
        title={props.t('Status')}
        onClickTitle={() => props.onClickTitle(SORT_BY.STATUS)}
        customClass='content__header__status'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriteria === SORT_BY.STATUS}
        tootltip={props.t('Sort by status')}
      />
    </div>
  )
}

export default translate()(ContentItemHeader)

ContentItemHeader.propTypes = {
  isOrderAscending: PropTypes.bool,
  onClickTitle: PropTypes.func,
  selectedSortCriteria: PropTypes.string,
  showSearchDetails: PropTypes.bool
}

ContentItemHeader.defaultProps = {
  isOrderAscending: true,
  onClickTitle: () => { },
  selectedSortCriteria: SORT_BY.LABEL,
  showSearchDetails: false
}
