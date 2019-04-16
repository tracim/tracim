import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  setBreadcrumbs,
  appendBreadcrumbs
} from '../../action-creator.sync.js'

require('./Breadcrumbs.styl')

export class Breadcrumbs extends React.Component {
  constructor (props) {
    super(props)

    document.addEventListener('appCustomEvent', this.customEventReducer)
  }

  componentWillUnmount () {
    document.removeEventListener('appCustomEvent', this.customEventReducer)
  }

  customEventReducer = async ({ detail: { type, data } }) => {
    const { props } = this
    switch (type) {
      case 'setBreadcrumbs': props.dispatch(setBreadcrumbs(data.breadcrumbs)); break
      case 'appendBreadcrumbs': props.dispatch(appendBreadcrumbs(data.breadcrumbs)); break
    }
  }

  render () {
    const { props } = this

    return (
      <ul className='breadcrumbs'>
        {props.breadcrumbs.map((bc, i) =>
          <li
            className='breadcrumbs__item primaryColorFont primaryColorFontDarkenHover'
            key={`breacrumbs_${i}`}
          >
            <Link to={bc.url}>{bc.label}</Link>
          </li>
        )}
      </ul>
    )
  }
}

const mapStateToProps = ({ breadcrumbs }) => ({ breadcrumbs })
export default connect(mapStateToProps)(Breadcrumbs)
