import React from 'react'
import PropTypes from 'prop-types'

// require('./Breadcrumbs.styl')

export const Breadcrumbs = props => {
  return (
    <ul className='breadcrumbs'>
      {props.breadcrumbsList.map((bc, i) =>
        <li
          className={`breadcrumbs__item primaryColorFont ${bc.notALink ? '' : 'primaryColorFontDarkenHover'}`}
          key={`breacrumbs_${i}`}
        >
          {bc.link}
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
