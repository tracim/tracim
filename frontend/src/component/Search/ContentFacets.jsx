import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Icon } from 'tracim_frontend_lib'
import DateFilter from '../component/Search/DateFilter.jsx'
import {
  ADVANCED_SEARCH_TYPE,
  DATE_FILTER_ELEMENT,
  SEARCH_FIELD_LIST
} from '../util/helper.js'

export class ContentFacets extends React.Component {
  render() {
    const { props } = this
    let currentSearch
    if (props.searchType === ADVANCED_SEARCH_TYPE.CONTENT) {
      currentSearch = props.contentSearch
    }
    /*
      if (state.searchType === ADVANCED_SEARCH_TYPE.USER) {
        currentSearch = props.userSearch
      }

      if (state.searchType === ADVANCED_SEARCH_TYPE.SPACE) {
        currentSearch = props.spaceSearch
      }
    */

    return (

      <div className='searchFilterMenu__content__item__checkbox' key={`item__${field}`}>
        <input type='checkbox' id={`item__${field}`} onClick={() => props.onClickSearchField(field)} />
        <label htmlFor={`item__${field}`}>
          {(SEARCH_FIELD_LIST.find(searchField => searchField.slug === field) || { label: '' }).label}
        </label>
      </div>
    )
  }
}

const mapStateToProps = ({ contentSearch, spaceSearch, userSearch }) => ({ contentSearch, spaceSearch, userSearch })
export default connect(mapStateToProps)(translate()(ContentFacets))

ContentFacets.propTypes = {
}

ContentFacets.defaultProps = {
}
