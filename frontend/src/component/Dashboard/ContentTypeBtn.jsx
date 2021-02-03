import React from 'react'
import PropTypes from 'prop-types'
import Radium from 'radium'
import classnames from 'classnames'
const color = require('color')

require('./ContentTypeBtn.styl')

export const ContentTypeBtn = props =>
  <div
    className={classnames(`${props.customClass}`, 'contentTypeBtn')}
    data-cy={`contentTypeBtn_${props.appSlug}`}
    style={{
      backgroundColor: props.hexcolor,
      ':hover': {
        backgroundColor: color(props.hexcolor).darken(0.15).hex()
      }
    }}
    onClick={props.onClickBtn}
  >
    <div className={classnames(`${props.customClass}__text`)}>
      <div className={classnames(`${props.customClass}__text__icon`)}>
        <i className={`${props.faIcon}`} />
      </div>
      <div className={classnames(`${props.customClass}__text__title`)}>
        {props.creationLabel}
      </div>
    </div>
  </div>

export default Radium(ContentTypeBtn)

ContentTypeBtn.propTypes = {
  hexcolor: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  faIcon: PropTypes.string.isRequired,
  creationLabel: PropTypes.string.isRequired,
  customClass: PropTypes.string,
  onClickBtn: PropTypes.func,
  appSlug: PropTypes.string
}

ContentTypeBtn.defaultProps = {
  customClass: ''
}
