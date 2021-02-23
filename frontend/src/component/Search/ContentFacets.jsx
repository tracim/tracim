import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import CheckboxFilter from './CheckboxFilter.jsx'
import { SEARCH_CONTENT_FACETS } from '../../util/helper.js'

export class ContentFacets extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showWorkspaceList: true,
      showStatusList: true,
      showContentTypeList: true,
      showFileExtentionList: true,
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
        this.setState(prev => ({ showFileExtentionList: !prev.showFileExtentionList }))
        break
      case SEARCH_CONTENT_FACETS.AUTHOR.slug:
        this.setState(prev => ({ showAuthorList: !prev.showAuthorList }))
        break
    }
  }

  render() {
    const { props, state } = this

    const showFileExtentionList = props.searchFacets.file_extensions
      ? props.searchFacets.file_extensions.filter(extension =>
        extension.value !== '' && extension.value !== '.document.html' && extension.value !== '.thread.html'
      )
      : []

    return (
      <>
        {props.searchFacets.workspace_names && (
          <CheckboxFilter
            filterList={props.searchFacets.workspace_names}
            label={SEARCH_CONTENT_FACETS.SPACE.label}
            onChangeSearchFacets={(value) => props.onChangeSearchFacets({ workspace_names: value })}
            onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.SPACE.slug)}
            showFilter={state.showWorkspaceList}
          />
        )}

        {props.searchFacets.statuses && (
          <CheckboxFilter
            filterList={props.searchFacets.statuses}
            label={SEARCH_CONTENT_FACETS.STATUS.label}
            onChangeSearchFacets={(value) => props.onChangeSearchFacets({ statuses: value })}
            onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.STATUS.slug)}
            showFilter={state.showStatusList}
          />
        )}

        {props.searchFacets.content_types && (
          <CheckboxFilter
            filterList={props.searchFacets.content_types}
            label={SEARCH_CONTENT_FACETS.TYPE.label}
            onChangeSearchFacets={(value) => props.onChangeSearchFacets({ content_types: value })}
            onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.TYPE.slug)}
            showFilter={state.showContentTypeList}
          />
        )}

        {props.searchFacets.file_extensions && showFileExtentionList.length > 0 && (
            <CheckboxFilter
              filterList={showFileExtentionList}
              label={SEARCH_CONTENT_FACETS.EXTENSION.label}
              onChangeSearchFacets={(value) => props.onChangeSearchFacets({ file_extensions: value })}
              onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.EXTENSION.slug)}
              showFilter={state.showFileExtentionList}
            />
          )}

        {props.searchFacets.author__public_names && (
          <CheckboxFilter
            filterList={props.searchFacets.author__public_names}
            label={SEARCH_CONTENT_FACETS.AUTHOR.label}
            onChangeSearchFacets={(value) => props.onChangeSearchFacets({ author__public_names: value })}
            onClickOpenOrCloseFilter={() => this.handleOpenOrCloseFilter(SEARCH_CONTENT_FACETS.AUTHOR.slug)}
            showFilter={state.showAuthorList}
          />
        )}
      </>
    )
  }
}
export default translate()(ContentFacets)

ContentFacets.propTypes = {
  onChangeSearchFacets: PropTypes.func,
  searchFacets: PropTypes.object
}

ContentFacets.defaultProps = {
  onChangeSearchFacets: () => { },
  searchFacets: {}
}
