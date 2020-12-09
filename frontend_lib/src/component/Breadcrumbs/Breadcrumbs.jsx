import React from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'

export const Breadcrumbs = props => {
  const MAX_NUMBER_OF_LAYERS = 6
  const LAST_VISIBLE_LAYERS = 3
  let breadcrumbsList = props.breadcrumbsList

  if (props.breadcrumbsList.length >= MAX_NUMBER_OF_LAYERS) {
    const beginingList = props.breadcrumbsList[0].label === props.t('Home')
      ? [props.breadcrumbsList[0], props.breadcrumbsList[1]]
      : [props.breadcrumbsList[0]]
    breadcrumbsList = [
      ...beginingList,
      {
        label: props.breadcrumbsList.map(crumb => crumb.label).join(' > '),
        link: <span>...</span>,
        notALink: true
      },
      ...props.breadcrumbsList.slice(Math.max(props.breadcrumbsList.length - LAST_VISIBLE_LAYERS, 0))
    ]
  }

  return (
    <ul className='breadcrumbs'>
      {breadcrumbsList.map((crumb, i) =>
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
  breadcrumbsList: PropTypes.array.isRequired,
}
