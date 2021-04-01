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
  FAVORITE_STATE
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
  removeContentFromFavoriteList
} from '../action-creator.async.js'

import ContentListItem from '../component/ContentListItem.jsx'

require('../css/Favorites.styl')

const FavoritesHeader = translate()((props) => {
  return (
    <div className='favoritesHeader content__header'>
      <div className='favoritesHeader__type'>
        {props.t('Type')}
      </div>
      <div className='favoritesHeader__title'>
        {props.t('Title and path')}
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

export class Favorites extends React.Component {
  constructor (props) {
    super(props)
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
    props.dispatch(setFavoriteList(fetchFavoriteList.json.items))
  }

  handleClickRemoveFromFavoriteList = async (favorite) => {
    const { props } = this
    const removeFromFavoriteList = await props.dispatch(
      removeContentFromFavoriteList(props.user.userId, favorite.contentId)
    )
    if (!removeFromFavoriteList.ok) {
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

  render () {
    const { props } = this
    return (
      <div className='tracim__content-scrollview'>
        <PageWrapper customClass='advancedSearch__wrapper'>
          <PageTitle
            title={props.t('Favorites')}
            icon='far fa-star'
            breadcrumbsList={props.breadcrumbs}
          />
          <PageContent>
            <FavoritesHeader />
            {props.favoriteList.map((favorite, index) => (
              <ContentListItem
                content={favorite.content}
                contentTypeInfo={props.contentType.find(info => info.slug === favorite.content.type)}
                userLang={props.user.lang}
                key={favorite.contentId}
                isLast={index === props.favoriteList.length - 1}
              >
                <FavoriteButton
                  // By definition a favorite is in the favorite list :-)
                  favoriteState={FAVORITE_STATE.FAVORITE}
                  onClickRemoveFromFavoriteList={() => this.handleClickRemoveFromFavoriteList(favorite)}
                  onClickAddToFavoriteList={() => {}}
                  customClass='contentListItem__favoriteButton'
                />
              </ContentListItem>
            ))}
          </PageContent>
        </PageWrapper>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, favoriteList, contentType }) => ({
  breadcrumbs,
  user,
  favoriteList,
  contentType
})
export default connect(mapStateToProps)(translate()(TracimComponent(Favorites)))
