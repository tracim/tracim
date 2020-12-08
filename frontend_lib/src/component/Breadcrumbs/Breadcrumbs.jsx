import React from 'react'
import PropTypes from 'prop-types'

// require('./Breadcrumbs.styl') // CH - 2019-04-30 - see https://github.com/tracim/tracim/issues/1156

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

export default Breadcrumbs

Breadcrumbs.propTypes = {
  breadcrumbsList: PropTypes.array.isRequired
}
