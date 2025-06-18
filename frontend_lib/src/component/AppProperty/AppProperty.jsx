import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

export const AppProperty = props => {
  return (
    <div className='appProperty'>
      {props.readOnlyFieldList.map((field, i) => (
        <div
          className='appProperty__item'
          title={field.title ?? ''}
          key={`appProperty__item_${i}`}
        >
          <div className='appProperty__item__label'>{field.label ?? ''}</div>
          <div className='appProperty__item__value'>{field.value ?? ''}</div>
        </div>
      ))}
    </div>
  )
}

export default translate()(AppProperty)

AppProperty.propTypes = {
  readOnlyFieldList: PropTypes.array
}

AppProperty.defaultProps = {
  readOnlyFieldList: []
}
