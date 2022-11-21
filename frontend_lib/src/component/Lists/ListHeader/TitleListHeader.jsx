import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Icon from '../../Icon/Icon.jsx'

const TitleListHeader = props =>
  <button
    onClick={props.onClickTitle}
    title={props.tootltip}
    className={classnames('titleListHeader transparentButton btn', props.customClass)}
  >
    <span>{props.title}</span>
    {props.isSelected && (
      <Icon
        icon={props.isOrderAscending ? 'fas fa-sort-amount-down-alt' : 'fas fa-sort-amount-up-alt'}
        customClass='titleListHeader__icon'
        title={props.tootltip}
      /> // GIULIA fix css, title without icon
    )}
  </button>
export default TitleListHeader

TitleListHeader.propTypes = {
  title: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  isOrderAscending: PropTypes.bool,
  isSelected: PropTypes.bool,
  onClickTitle: PropTypes.func,
  tootltip: PropTypes.string
}

TitleListHeader.defaultProps = {
  customClass: '',
  isOrderAscending: true,
  isSelected: false,
  onClickTitle: () => { },
  tootltip: ''
}
