import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import IconButton from '../Button/IconButton.jsx'

require('./TagList.styl')

export const Tag = props => {
  return (
    <div className='tagList__list__item__wrapper'>
      <i className='fas fa-play tagList__list__item__triangle' />
      <div className='tagList__list__item'>
        <div className='tagList__list__item__circle' />
        <span
          className='tagList__list__item__info'
          title={props.name}
        >
          {props.name}
        </span>
        {!props.isReadOnlyMode && (
          <IconButton
            intent='link'
            onClick={props.onClickDeleteTag}
            icon={props.isContent ? 'fas fa-times' : 'far fa-trash-alt'}
            title={props.isContent ? props.t('Remove tag from content') : props.t('Delete tag from space')}
            dataCy='IconButton_DeleteTagFromSpace'
          />
        )}
      </div>
    </div>
  )
}

export default translate()(Tag)

Tag.propTypes = {
  name: PropTypes.string.isRequired,
  onClickDeleteTag: PropTypes.func.isRequired,
  isContent: PropTypes.bool,
  isReadOnlyMode: PropTypes.bool
}

Tag.defaultProps = {
  isContent: true,
  isReadOnlyMode: true
}
