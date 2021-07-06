import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import IconButton from '../Button/IconButton.jsx'
import Icon from '../Icon/Icon.jsx'

require('./TagList.styl')

export const Tag = props => {
  return (
    <div className='tagList__list__item__wrapper'>
      <div className='tagList__list__item'>
        <Icon
          icon='fas fa-circle'
          color='#f0f0f0'
          className='tagList__list__item__circle'
        />
        <label
          className='tagList__list__item__info'
          title={props.name}
        >
          {props.name}
        </label>
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
  isContent: PropTypes.bool,
  onClickDeleteTag: PropTypes.func,
  isReadOnlyMode: PropTypes.bool
}

Tag.defaultProps = {
  isContent: true,
  onClickDeleteTag: () => { },
  isReadOnlyMode: true
}
