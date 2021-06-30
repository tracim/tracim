import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import IconButton from '../Button/IconButton.jsx'

require('./TagList.styl')

export const Tag = props => {
  return (
    <div className='tagList__list__item'>
      <label
        htmlFor={'checkbox-tag-' + props.tagId}
        className='tagList__list__item__info'
        title={props.name}
      >
        {props.name}
      </label>
      {!props.viewMode && (
        <IconButton
          intent='link'
          onClick={props.onClickDeleteTag}
          icon={props.isContent ? 'fas fa-times' : 'fas fa-trash-alt'}
          title={props.isContent ? props.t('Remove tag from content') : props.t('Delete tag from space')}
          dataCy='IconButton_DeleteTagFromSpace'
        />
      )}
    </div>
  )
}

export default translate()(Tag)

Tag.propTypes = {
  name: PropTypes.string.isRequired,
  tagId: PropTypes.number.isRequired,
  isContent: PropTypes.bool,
  onClickDeleteTag: PropTypes.func,
  viewMode: PropTypes.bool
}

Tag.defaultProps = {
  isContent: true,
  onClickDeleteTag: () => { },
  viewMode: true
}
