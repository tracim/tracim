import React from 'react'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'
import { Icon } from 'tracim_frontend_lib'
import {
  ADVANCED_SEARCH_TYPE,
  SEARCH_FIELD_LIST
} from '../../util/helper.js'

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
    switch(filter) {
      case 'workspace':
        this.setState(prev => ({ showWorkspaceList: !prev.showWorkspaceList }))
        break
      case 'status':
        this.setState(prev => ({ showStatusList: !prev.showStatusList }))
        break
      case 'type':
        this.setState(prev => ({ showContentTypeList: !prev.showContentTypeList }))
        break
      case 'extention':
        this.setState(prev => ({ showFileExtentionList: !prev.showFileExtentionList }))
        break
      case 'author':
        this.setState(prev => ({ showAuthorList: !prev.showAuthorList }))
        break
    }
  }

  render() {
    const { props, state } = this
    return (
      <>
        {props.searchFacets.workspace_names && (
          <div className='searchFilterMenu__content__item__title'>
            <button
              className='transparentButton'
              onClick={() => this.handleOpenOrCloseFilter('workspace')}
            >
              <Icon
                icon={state.showWorkspaceList
                  ? 'fa-fw fas fa-caret-down'
                  : 'fa-fw fas fa-caret-right'}
                title={state.showWorkspaceList
                  ? props.t('Hide {{filter}}', { filter: props.t('Space') })
                  : props.t('Show {{filter}}', { filter: props.t('Space') })}
              />
            </button>
            {props.t('Space')}
          </div>
        )}
        {props.searchFacets.workspace_names &&
          state.showWorkspaceList &&
          props.searchFacets.workspace_names.map(workspace =>
            <div className='searchFilterMenu__content__item__checkbox' key={`item__${workspace.value}`}>
              <input
                type='checkbox'
                id={`item__${workspace.value}`}
                onChange={(e) => {
                  if (e.currentTarget.checked) props.onChangeSearchFacets({ workspace_names: workspace.value })
                }} />
              <label htmlFor={`item__${workspace.value}`}>
                {props.t(`${workspace.value}`)} ({workspace.count})
            </label>
            </div>
          )}

        {props.searchFacets.statuses && (
          <div className='searchFilterMenu__content__item__title'>
            <button
              className='transparentButton'
              onClick={() => this.handleOpenOrCloseFilter('status')}
            >
              <Icon
                icon={state.showStatusList
                  ? 'fa-fw fas fa-caret-down'
                  : 'fa-fw fas fa-caret-right'}
                title={state.showStatusList
                  ? props.t('Hide {{filter}}', { filter: props.t('Status') })
                  : props.t('Show {{filter}}', { filter: props.t('Status') })}
              />
            </button>
            {props.t('Status')}
          </div>
        )}
        {props.searchFacets.statuses &&
          state.showStatusList &&
          props.searchFacets.statuses.map(status =>
            <div className='searchFilterMenu__content__item__checkbox' key={`item__${status.value}`}>
              <input
                type='checkbox'
                id={`item__${status.value}`}
                onChange={(e) => {
                  e.currentTarget.checked
                    ? props.onChangeSearchFacets({ statuses: status.value })
                    : props.onChangeSearchFacets({})
                }} />
              <label htmlFor={`item__${status.value}`}>
                {props.t(`${status.value}`)} ({status.count})
            </label>
            </div>
          )}

        {props.searchFacets.content_types && (
          <div className='searchFilterMenu__content__item__title'>
            <button
              className='transparentButton'
              onClick={() => this.handleOpenOrCloseFilter('type')}
            >
              <Icon
                icon={state.showContentTypeList
                  ? 'fa-fw fas fa-caret-down'
                  : 'fa-fw fas fa-caret-right'}
                title={state.showContentTypeList
                  ? props.t('Hide {{filter}}', { filter: props.t('Type') })
                  : props.t('Show {{filter}}', { filter: props.t('Type') })}
              />
            </button>
            {props.t('Type')}
          </div>
        )}
        {props.searchFacets.content_types &&
          state.showContentTypeList &&
          props.searchFacets.content_types.map(type =>
            <div className='searchFilterMenu__content__item__checkbox' key={`item__${type.value}`}>
              <input
                type='checkbox'
                id={`item__${type.value}`}
                onChange={(e) => {
                  e.currentTarget.checked
                    ? props.onChangeSearchFacets({ content_types: type.value })
                    : props.onChangeSearchFacets({})
                }} />
              <label htmlFor={`item__${type.value}`}>
                {props.t(`${type.value}`)} ({type.count})
            </label>
            </div>
          )}

        {props.searchFacets.file_extensions && (
          <div className='searchFilterMenu__content__item__title'>
            <button
              className='transparentButton'
              onClick={() => this.handleOpenOrCloseFilter('extention')}
            >
              <Icon
                icon={state.showFileExtentionList
                  ? 'fa-fw fas fa-caret-down'
                  : 'fa-fw fas fa-caret-right'}
                title={state.showFileExtentionList
                  ? props.t('Hide {{filter}}', { filter: props.t('File extention') })
                  : props.t('Show {{filter}}', { filter: props.t('File extention') })}
              />
            </button>
            {props.t('File extention')}
          </div>
        )}
        {props.searchFacets.file_extensions &&
          state.showFileExtentionList &&
          props.searchFacets.file_extensions.map(extension =>
            <div className='searchFilterMenu__content__item__checkbox' key={`item__${extension.value}`}>
              <input
                type='checkbox'
                id={`item__${extension.value}`}
                onChange={(e) => {
                  e.currentTarget.checked
                    ? props.onChangeSearchFacets({ file_extensions: extension.value })
                    : props.onChangeSearchFacets({})
                }} />
              <label htmlFor={`item__${extension.value}`}>
                {props.t(`${extension.value}`)} ({extension.count})
            </label>
            </div>
          )}

        {props.searchFacets.workspace_names && (
          <div className='searchFilterMenu__content__item__title'>
            <button
              className='transparentButton'
              onClick={() => this.handleOpenOrCloseFilter('author')}
            >
              <Icon
                icon={state.showAuthorList
                  ? 'fa-fw fas fa-caret-down'
                  : 'fa-fw fas fa-caret-right'}
                title={state.showAuthorList
                  ? props.t('Hide {{filter}}', { filter: props.t('Author') })
                  : props.t('Show {{filter}}', { filter: props.t('Author') })}
              />
            </button>
            {props.t('Author')}
          </div>
        )}
        {props.searchFacets.author__public_names &&
          state.showAuthorList &&
          props.searchFacets.author__public_names.map(author =>
            <div className='searchFilterMenu__content__item__checkbox' key={`item__${author.value}`}>
              <input
                type='checkbox'
                id={`item__${author.value}`}
                onChange={(e) => {
                  e.currentTarget.checked
                    ? props.onChangeSearchFacets({ author__public_names: author.value })
                    : props.onChangeSearchFacets({})
                }} />
              <label htmlFor={`item__${author.value}`}>
                {props.t(`${author.value}`)} ({author.count})
            </label>
            </div>
          )}
      </>
    )
  }
}
export default translate()(ContentFacets)

ContentFacets.propTypes = {
}

ContentFacets.defaultProps = {
}
