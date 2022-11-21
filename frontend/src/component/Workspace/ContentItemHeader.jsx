import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import { SORT_BY, TitleListHeader } from 'tracim_frontend_lib'
import PropTypes from 'prop-types'

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
          <div className='content__header__search__modification'>
            {props.t('Last Modification')}
          </div>
        </div>
      )}

      {props.showLastModification && !props.showSearchDetails && (
        //  INFO - ML - 2022-15-11 - 'Last Modification' appears twice in the code because depending
        //  on the context it has a different positioning and class
        <div className='content__header__modification'>
          {props.t('Last Modification')}
        </div>
      )}
      {!props.showSearchDetails && (
        <div className='content__header__actions'>
          {props.t('Actions')}
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
  showSearchDetails: PropTypes.bool,
  showLastModification: PropTypes.bool
}

ContentItemHeader.defaultProps = {
  isOrderAscending: true,
  onClickTitle: () => { },
  selectedSortCriteria: '',
  showSearchDetails: false,
  showLastModification: false
}
