import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

export const Breadcrumbs = props => {
  return (
    <ul className='breadcrumbs'>
      {props.breadcrumbsList.map((crumb, i) =>
        <li
          className={`breadcrumbs__item ${crumb.notALink ? '' : 'primaryColorFont primaryColorFontDarkenHover'}`}
          key={`breacrumbs_${i}`}
          title={crumb.label || ''}
        >
          {crumb.link}
        </li>
      )}
    </ul>
  )
}

export default translate()(Breadcrumbs)

Breadcrumbs.propTypes = {
  breadcrumbsList: PropTypes.array.isRequired
}
