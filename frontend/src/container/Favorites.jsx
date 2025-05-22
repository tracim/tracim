import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CUSTOM_EVENT,
  PAGE,
  PageContent,
  PageTitle,
  PageWrapper,
  TracimComponent,
  getContentPath,
  Loading,
  handleFetchResult
} from 'tracim_frontend_lib'

import {
  newFlashMessage,
  setBreadcrumbs,
  setFavoriteList,
  removeFavorite,
  setHeadTitle
} from '../action-creator.sync.js'

import {
  getFavoriteContentList,
  deleteContentFromFavoriteList
} from '../action-creator.async.js'

import {
  FETCH_CONFIG
} from '../util/helper.js'

import FavoritesTable from './tables/FavoritesTable/FavoritesTable.jsx'

export class Favorites extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      isLoading: true,
      favoriteList: []
    }

    props.registerCustomEventHandlerList([
      { name: CUSTOM_EVENT.ALL_APP_CHANGE_LANGUAGE, handler: this.handleAllAppChangeLanguage }
    ])
  }

  handleAllAppChangeLanguage = () => {
    this.setHeadTitle()
    this.buildBreadcrumbs()
  }

  setHeadTitle = () => {
    const { props } = this
    const headTitle = buildHeadTitle([props.t('My favorites')])
    props.dispatch(setHeadTitle(headTitle))
  }

  buildBreadcrumbs = () => {
    const { props } = this

    props.dispatch(setBreadcrumbs([{
      link: PAGE.FAVORITES,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('My favorites'),
      isALink: true
    }]))
  }

  componentDidMount () {
    this.setHeadTitle()
    this.buildBreadcrumbs()
    this.loadFavoriteList()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.workspaceList.length === 0 && this.props.workspaceList.length > 0) {
      this.addWorkspaceToBreadcrumbsPath()
    }
  }

  addWorkspaceToBreadcrumbsPath () {
    const { props, state } = this
    if (props.workspaceList.length === 0 || state.favoriteList.length === 0) return

    const favoriteWithFullBreadcrumbsList = state.favoriteList
      .map(favorite => {
        const workspace = props.workspaceList.find(ws => ws.id === favorite.content.workspace_id)
        return {
          ...favorite,
          breadcrumbs: [{ label: workspace.label }].concat(favorite.breadcrumbs)
        }
      })

    this.setState({ isLoading: false })
    props.dispatch(setFavoriteList(favoriteWithFullBreadcrumbsList))
  }

  loadFavoriteList = async () => {
    const { props } = this

    const fetchFavoriteList = await props.dispatch(
      getFavoriteContentList(props.user.userId)
    )

    if (!fetchFavoriteList.ok) {
      props.dispatch(newFlashMessage(props.t('An error has happened while fetching favorites'), 'warning'))
      return
    }

    // INFO - Ch - 2023-11-29 - Get the contents' paths (for breadcrumbs)
    const favoriteWithIncompleteBreadcrumbsList = await Promise.all(fetchFavoriteList.json.items
      .filter(f => f.content !== null && f.content !== undefined)
      .map(async favorite => {
        try {
          const response = await handleFetchResult(
            await getContentPath(FETCH_CONFIG.apiUrl, favorite.content_id)
          )
          return { ...favorite, breadcrumbs: response.body.items }
        } catch (e) {
          console.error('Error in loadFavoriteList', favorite, e)
          return { ...favorite, breadcrumbs: [] }
        }
      }))

    this.setState({ favoriteList: favoriteWithIncompleteBreadcrumbsList })
    this.addWorkspaceToBreadcrumbsPath()
  }

  handleClickRemoveFromFavoriteList = async (favorite) => {
    const { props } = this
    const deleteFromFavoriteList = await props.dispatch(
      deleteContentFromFavoriteList(props.user.userId, favorite.contentId)
    )
    if (!deleteFromFavoriteList.ok) {
      props.dispatch(newFlashMessage(props.t('An error has happened while removing the favorite'), 'warning'))
      return
    }
    props.dispatch(removeFavorite(favorite))
    props.dispatch(newFlashMessage(props.t(
      '{{contentLabel}} has been removed from your favorites.',
      { contentLabel: this.getAvailableLabel(favorite) }
    ), 'info'))
  }

  getAvailableLabel = (favorite) => {
    return favorite.content ? favorite.content.label : favorite.originalLabel
  }

  render () {
    const { props, state } = this

    return (
      <div className='tracim__content-scrollview'>
        <PageWrapper customClass='favorites__wrapper'>
          <PageTitle
            title={props.t('My favorites')}
            icon='far fa-star'
            breadcrumbsList={props.breadcrumbs}
            isEmailNotifActivated={props.system.config.email_notification_activated}
          />

          {state.isLoading
            ? <Loading />
            : (
              <PageContent>
                <FavoritesTable
                  favoriteList={props.favoriteList}
                  onFavoriteButtonClick={this.handleClickRemoveFromFavoriteList}
                />
              </PageContent>
            )}
        </PageWrapper>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, favoriteList, system, workspaceList }) => ({
  breadcrumbs,
  user,
  favoriteList,
  system,
  workspaceList
})
export default connect(mapStateToProps)(translate()(TracimComponent(Favorites)))
