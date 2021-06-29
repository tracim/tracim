import React from 'react'
import { translate } from 'react-i18next'
import { Checkbox } from '../Input/Checkbox.jsx'
import PropTypes from 'prop-types'
import CloseButton from '../Button/CloseButton.jsx'
import IconButton from '../Button/IconButton.jsx'

require('./TagList.styl')

export const Tag = props => {
  return (
    <div className='tagList__list__item'>
      <Checkbox
        onClickCheckbox={props.onClickCheckbox}
        checked={props.checked}
        name={'tag-' + props.tagId}
        styleLabel={{ marginLeft: '5px', marginRight: '10px' }}
        styleCheck={{ top: '-5px' }}
      />
      <label
        htmlFor={'checkbox-tag-' + props.tagId}
        className='tagList__list__item__info'
        title={props.name}
      >
        {props.name}
      </label>
      {props.isContent
      ? (
        <IconButton
          customClass='personaldata__form__button'
          intent='secondary'
          // disabled={!props.isUsernameValid}
          // onClick={this.handleRemoveTag}
          icon='fas fa-times'
          title={props.t('Remove tag from content')}
          dataCy='IconButton_RemoveTagFromContent'
        />
        ) : (
        <IconButton
          customClass='personaldata__form__button'
          intent='secondary'
          // disabled={!props.isUsernameValid}
          // onClick={this.handleClickSubmit}
          icon='fas fa-trash-alt'
          title={props.t('Delete tag from space')}
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
  checked: PropTypes.bool,
  onClickCheckbox: PropTypes.func,
  isContent: PropTypes.bool
}

Tag.defaultProps = {
  checked: false,
  onClickCheckbox: () => { },
  isContent: true
}
