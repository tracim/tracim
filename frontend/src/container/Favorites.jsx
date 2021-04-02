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
  FavoriteButton,
  FAVORITE_STATE,
  getContentComment,
  getContentPath,
  Icon,
  ListItemWrapper
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

import ContentListItem from '../component/ContentListItem.jsx'
import ContentType from '../component/ContentType.jsx'

require('../css/Favorites.styl')

const FavoritesHeader = translate()(props => {
  return (
    <div className='favoritesHeader content__header'>
      <div className='favoritesHeader__type'>
        {props.t('Type')}
      </div>
      <div className='favoritesHeader__title'>
        {props.t('Title and path')}
      </div>
      {/* Header for windows smaller than max-sm */}
      <div className='favoritesHeader__title-max-sm'>
        {props.t('Title')}
      </div>
      <div className='favoritesHeader__modification'>
        {props.t('Last Modification')}
      </div>
      <div className='favoritesHeader__information'>
        {props.t('Information_plural')}
      </div>
      <div className='favoritesHeader__favoriteButton'>
        {props.t('Favorite')}
      </div>
    </div>
  )
})

const UnavailableContent = translate()(props => {
  return (
    <ListItemWrapper
      label={props.label}
      read
      contentType={props.contentTypeInfo}
      isLast={props.isLast}
      customClass='unavailableContent contentListItem'
    >
      <ContentType
        contentTypeInfo={props.contentTypeInfo}
        customClass='contentListItem__type'
      />
      <div className='contentListItem__name_path unavailableContent__name_warning'>
        {props.label}
        <span className='unavailableContent__warning'>
          <Icon
            icon='fa-fw fas fa-exclamation-triangle'
            title={props.t('Warning')}
          />
          &nbsp;
          {props.t('content is not available')}
        </span>
      </div>
      {props.children}
    </ListItemWrapper>
  )
})

export class Favorites extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      contentCommentsCountList: [],
      contentBreadcrumbsList: []
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
    const headTitle = buildHeadTitle([props.t('Favorites')])
    props.dispatch(setHeadTitle(headTitle))
  }

  buildBreadcrumbs = () => {
    const { props } = this

    props.dispatch(setBreadcrumbs([{
      link: PAGE.FAVORITES,
      type: BREADCRUMBS_TYPE.CORE,
      label: props.t('Favorites'),
      isALink: true
    }]))
  }

  componentDidMount () {
    this.setHeadTitle()
    this.buildBreadcrumbs()
    this.loadFavoriteList()
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
    const favoriteList = fetchFavoriteList.json.items
    // Get comments (for their count in info)
    const commentsFetchList = favoriteList.map(async favorite => {
      if (!favorite.content) return null
      // NOTE - S.G. - 2021-04-01 - here we have the favorite as returned by the backend
      // hence the snake-case properties
      const response = await getContentComment(
        FETCH_CONFIG.apiUrl,
        favorite.content.workspace_id,
        favorite.content_id
      )
      if (!response.ok) return null
      return (await response.json()).length
    })
    const contentCommentsCountList = await Promise.all(commentsFetchList)

    // Get the contents' paths (for breadcrumbs)
    const contentBreadcrumbsFetchList = favoriteList.map(async favorite => {
      if (!favorite.content) return null
      // NOTE - S.G. - 2021-04-01 - here we have the favorite as returned by the backend
      // hence the snake-case properties
      const response = await getContentPath(
        FETCH_CONFIG.apiUrl,
        favorite.content.workspace_id,
        favorite.content_id
      )
      if (!response.ok) return []

      const workspace = props.workspaceList.find(ws => ws.id === favorite.content.workspace_id)

      return [{ label: workspace.label }].concat((await response.json()).items)
    })
    const contentBreadcrumbsList = await Promise.all(contentBreadcrumbsFetchList)

    this.setState({ contentCommentsCountList, contentBreadcrumbsList })
    props.dispatch(setFavoriteList(favoriteList))
  }

  getAvailableFavoriteList = (favoriteList) => favoriteList.filter(favorite => favorite.content)

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

  getAvailableContentType = (favorite) => {
    return favorite.content ? favorite.content.type : favorite.originalType
  }

  getFavoriteComponent = (favorite, index) => {
    // A favorite can point to an unavailable content (changed space access, deleted…)
    // In this case a special component is displayed for the favorite
    const { props, state } = this
    const favoriteButton = (
      <FavoriteButton
        favoriteState={FAVORITE_STATE.FAVORITE}
        onClickRemoveFromFavoriteList={() => this.handleClickRemoveFromFavoriteList(favorite)}
        onClickAddToFavoriteList={() => {}}
        customClass='favorites__item__favoriteButton'
      />
    )
    const isLast = index === props.favoriteList.length - 1
    if (!favorite.content) {
      const contentTypeInfo = props.contentType.find(info => info.slug === favorite.originalType)
      return (
        <UnavailableContent
          contentTypeInfo={contentTypeInfo}
          label={favorite.originalLabel}
          key={favorite.contentId}
          isLast={isLast}
        >
          {favoriteButton}
        </UnavailableContent>
      )
    }
    const contentTypeInfo = props.contentType.find(info => info.slug === favorite.content.type)
    return (
      <ContentListItem
        content={favorite.content}
        contentTypeInfo={contentTypeInfo}
        userLang={props.user.lang}
        key={favorite.contentId}
        isLast={isLast}
        breadcrumbsList={state.contentBreadcrumbsList[index]}
        commentsCount={state.contentCommentsCountList[index]}
        customClass='favorites__item'
        dataCy='favorites__item'
      >
        {favoriteButton}
      </ContentListItem>
    )
  }

  render () {
    const { props } = this
    return (
      <div className='tracim__content-scrollview'>
        <PageWrapper customClass='favorites__wrapper'>
          <PageTitle
            title={props.t('Favorites')}
            icon='far fa-star'
            breadcrumbsList={props.breadcrumbs}
          />
          {props.favoriteList.length > 0
            ? (
              <PageContent>
                <FavoritesHeader />
                {props.favoriteList.map((favorite, index) => this.getFavoriteComponent(favorite, index))}
              </PageContent>
            )
            : (
              <span className='favorites__no_favorite'>
                {props.t('You did not add any content as favorite yet.')}
              </span>
            )}
        </PageWrapper>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, favoriteList, contentType, workspaceList }) => ({
  breadcrumbs,
  user,
  favoriteList,
  contentType,
  workspaceList
})
export default connect(mapStateToProps)(translate()(TracimComponent(Favorites)))
