import React from 'react'
import PropTypes from 'prop-types'

// require('./Breadcrumbs.styl') // CH - 2019-04-30 - see https://github.com/tracim/tracim/issues/1156

export const Breadcrumbs = props => {
  return (
    <ul className='breadcrumbs'>
      {props.breadcrumbsList.map((crumb, i) =>
        <li
          className={`breadcrumbs__item primaryColorFont ${crumb.notALink ? '' : 'primaryColorFontDarkenHover'}`}
          key={`breacrumbs_${i}`}
        >
          {crumb.link}
        </li>
      )}
    </ul>
  )
}

export default Breadcrumbs

Breadcrumbs.propTypes = {
  breadcrumbsList: PropTypes.array
}

Breadcrumbs.defaultProps = {
  breadcrumbsList: []
}
