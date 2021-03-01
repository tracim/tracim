import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import CheckboxFilter from './CheckboxFilter.jsx'
import { SEARCH_SPACE_FACETS } from '../../util/helper.js'

export class SpaceFacets extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showMemberList: true,
      showAuthorList: true
    }
  }

  handleOpenOrCloseFilter = (filter) => {
    switch (filter) {
      case SEARCH_SPACE_FACETS.MEMBER.slug:
        this.setState(prev => ({ showMemberList: !prev.showMemberList }))
        break
      case SEARCH_SPACE_FACETS.AUTHOR.slug:
        this.setState(prev => ({ showAuthorList: !prev.showAuthorList }))
        break
    }
  }

  render () {
    const { props, state } = this

    return (
      <div className='SpaceFacets'>
        {props.searchFacets.members && props.searchFacets.members.length > 0 && (
          <CheckboxFilter
            appliedFilterList={props.appliedFilters.members && props.appliedFilters.members.map(filter => ({ id: filter }))}
            filterList={props.searchFacets.members.map(filter => ({
              value: filter.value.public_name,
              count: filter.count,
              id: filter.value.user_id
            }))}
            label={props.t('Member')}
            onChangeSearchFacets={(value) => {
              props.onChangeSearchFacets({
                members: [value]
              })
            }}
            onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_SPACE_FACETS.MEMBER.slug)}
            showFilter={state.showMemberList}
          />
        )}

        {props.searchFacets.author && props.searchFacets.author.length > 0 && (
          <CheckboxFilter
            appliedFilterList={[{ value: props.appliedFilters.author }]}
            filterList={props.searchFacets.author}
            label={props.t('Author')}
            onChangeSearchFacets={(value) => props.onChangeSearchFacets({ author: value })}
            onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_SPACE_FACETS.AUTHOR.slug)}
            showFilter={state.showAuthorList}
          />
        )}
      </div>
    )
  }
}
export default translate()(SpaceFacets)

SpaceFacets.propTypes = {
  appliedFilters: PropTypes.object,
  onChangeSearchFacets: PropTypes.func,
  searchFacets: PropTypes.object
}

SpaceFacets.defaultProps = {
  appliedFilters: {},
  onChangeSearchFacets: () => { },
  searchFacets: {}
}
