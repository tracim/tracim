import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import CheckboxFilter from './CheckboxFilter.jsx'
import { SEARCH_CONTENT_FACETS } from '../../util/helper.js'

export class ContentFacets extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showWorkspaceList: true,
      showStatusList: true,
      showContentTypeList: true,
      showFileExtensionList: true,
      showAuthorList: true
    }
  }

  handleOpenOrCloseFilter = (filter) => {
    switch (filter) {
      case SEARCH_CONTENT_FACETS.SPACE.slug:
        this.setState(prev => ({ showWorkspaceList: !prev.showWorkspaceList }))
        break
      case SEARCH_CONTENT_FACETS.STATUS.slug:
        this.setState(prev => ({ showStatusList: !prev.showStatusList }))
        break
      case SEARCH_CONTENT_FACETS.TYPE.slug:
        this.setState(prev => ({ showContentTypeList: !prev.showContentTypeList }))
        break
      case SEARCH_CONTENT_FACETS.EXTENSION.slug:
        this.setState(prev => ({ showFileExtensionList: !prev.showFileExtensionList }))
        break
      case SEARCH_CONTENT_FACETS.AUTHOR.slug:
        this.setState(prev => ({ showAuthorList: !prev.showAuthorList }))
        break
    }
  }

  addIdToFilter = (filterList) => {
    return filterList.map(filter => ({
      ...filter,
      id: filter.value
    }))
  }

  render () {
    const { props, state } = this

    const showFileExtensionList = props.searchFacets.file_extensions
      ? props.searchFacets.file_extensions.filter(extension =>
        extension.value !== '' && extension.value !== '.document.html' && extension.value !== '.thread.html'
      )
      : []

    return (
      <div className='contentFacets'>
        {props.searchFacets.workspace_names && props.searchFacets.workspace_names.length > 0 && (
          <CheckboxFilter
            appliedFilterList={[{ id: props.appliedFilters.workspace_names }]}
            filterList={this.addIdToFilter(props.searchFacets.workspace_names)}
            label={props.t('Space')}
            onChangeSearchFacets={(value) => props.onChangeSearchFacets({ workspace_names: value })}
            onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.SPACE.slug)}
            showFilter={state.showWorkspaceList}
          />
        )}

        {props.searchFacets.statuses && props.searchFacets.statuses.length > 0 && (
          <CheckboxFilter
            appliedFilterList={[{ id: props.appliedFilters.statuses }]}
            filterList={this.addIdToFilter(props.searchFacets.statuses)}
            label={props.t('Status')}
            onChangeSearchFacets={(value) => props.onChangeSearchFacets({ statuses: value })}
            onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.STATUS.slug)}
            showFilter={state.showStatusList}
          />
        )}

        {props.searchFacets.content_types && props.searchFacets.content_types.length > 0 && (
          <CheckboxFilter
            appliedFilterList={[{ id: props.appliedFilters.content_types }]}
            filterList={this.addIdToFilter(props.searchFacets.content_types).map(type => ({
              ...type,
              value: `${type.value}_search`
            }))}
            label={props.t('Type')}
            onChangeSearchFacets={(value) => props.onChangeSearchFacets({ content_types: value.replace('_search', '') })}
            onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.TYPE.slug)}
            showFilter={state.showContentTypeList}
          />
        )}

        {props.searchFacets.file_extensions && showFileExtensionList.length > 0 && (
          <CheckboxFilter
            appliedFilterList={[{ id: props.appliedFilters.file_extensions }]}
            filterList={this.addIdToFilter(showFileExtensionList)}
            label={props.t('File extension')}
            onChangeSearchFacets={(value) => props.onChangeSearchFacets({ file_extensions: value })}
            onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.EXTENSION.slug)}
            showFilter={state.showFileExtensionList}
          />
        )}

        {props.searchFacets.author__public_names && props.searchFacets.author__public_names.length > 0 && (
          <CheckboxFilter
            appliedFilterList={[{ id: props.appliedFilters.author__public_names }]}
            filterList={this.addIdToFilter(props.searchFacets.author__public_names)}
            label={props.t('Author')}
            onChangeSearchFacets={(value) => props.onChangeSearchFacets({ author__public_names: value })}
            onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.AUTHOR.slug)}
            showFilter={state.showAuthorList}
          />
        )}
      </div>
    )
  }
}
export default translate()(ContentFacets)

ContentFacets.propTypes = {
  appliedFilters: PropTypes.object,
  onChangeSearchFacets: PropTypes.func,
  searchFacets: PropTypes.object
}

ContentFacets.defaultProps = {
  appliedFilters: {},
  onChangeSearchFacets: () => { },
  searchFacets: {}
}
