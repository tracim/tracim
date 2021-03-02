import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import CheckboxFilter from './CheckboxFilter.jsx'
import { SEARCH_USER_FACETS } from '../../util/helper.js'

export class UserFacets extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showWorkspaceList: true
    }
  }

  handleOpenOrCloseFilter = (filter) => {
    switch (filter) {
      case SEARCH_USER_FACETS.SPACE.slug:
        this.setState(prev => ({ showWorkspaceList: !prev.showWorkspaceList }))
        break
    }
  }

  render () {
    const { props, state } = this
    const workspaceNames = (props.searchFacets.workspaces || []).map(
      workspace => ({
        value: workspace.value.label,
        id: workspace.value.workspace_id,
        count: workspace.count
      })
    )

    return (
      <div className='userFacets'>
        {props.searchFacets.workspaces && props.searchFacets.workspaces.length > 0 && (
          <CheckboxFilter
            appliedFilterList={props.appliedFilters.workspace_ids &&
              props.appliedFilters.workspace_ids.map(workspaceId => ({ id: workspaceId }))
            }
            filterList={workspaceNames}
            label={props.t('Member of')}
            onChangeSearchFacets={(value) => props.onChangeSearchFacets({ workspace_ids: [value] })}
            onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_USER_FACETS.SPACE.slug)}
            showFilter={state.showWorkspaceList}
          />
        )}
      </div>
    )
  }
}
export default translate()(UserFacets)

UserFacets.propTypes = {
  appliedFilters: PropTypes.object,
  onChangeSearchFacets: PropTypes.func,
  searchFacets: PropTypes.object
}

UserFacets.defaultProps = {
  appliedFilters: {},
  onChangeSearchFacets: () => { },
  searchFacets: {}
}
