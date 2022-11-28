import React from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import {
  BREADCRUMBS_TYPE,
  buildHeadTitle,
  CUSTOM_EVENT,
  EmptyListMessage,
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
  ListItemWrapper,
  Loading,
  SORT_BY,
  SORT_ORDER,
  sortListBy,
  TitleListHeader,
  FilterBar,
  handleFetchResult,
  stringIncludes
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

const FavoritesHeader = translate()(props => {
  return (
    <div className='favoritesHeader content__header'>
      <TitleListHeader
        title={props.t('Type')}
        onClickTitle={() => props.onClickTitle(SORT_BY.CONTENT_TYPE)}
        customClass='favoritesHeader__type'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.CONTENT_TYPE}
        tootltip={props.t('Sort by type')}
      />
      <TitleListHeader
        title={props.t('Title and path')}
        onClickTitle={() => props.onClickTitle(SORT_BY.LABEL)}
        customClass='favoritesHeader__title'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.LABEL}
        tootltip={props.t('Sort by title')}
      />
      {/* Header for windows smaller than max-sm */}
      <TitleListHeader
        title={props.t('Title')}
        onClickTitle={() => props.onClickTitle(SORT_BY.LABEL)}
        customClass='favoritesHeader__title-max-sm'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.LABEL}
        tootltip={props.t('Sort by title')}
      />
      <TitleListHeader
        title={props.t('Last Modification')}
        onClickTitle={() => props.onClickTitle(SORT_BY.MODIFICATION_DATE)}
        customClass='favoritesHeader__modification'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.MODIFICATION_DATE}
        tootltip={props.t('Sort by last modification')}
      />
      <TitleListHeader
        title={props.t('Information')}
        onClickTitle={() => props.onClickTitle(SORT_BY.STATUS)}
        customClass='favoritesHeader__information'
        isOrderAscending={props.isOrderAscending}
        isSelected={props.selectedSortCriterion === SORT_BY.STATUS}
        tootltip={props.t('Sort by information')}
      />
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
      isFirst={props.isFirst}
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
            icon='fas fa-exclamation-triangle'
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
      displayedFavoritesList: [],
      isLoading: true,
      selectedSortCriterion: SORT_BY.LABEL,
      sortOrder: SORT_ORDER.ASCENDING,
      userFilter: ''
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
    this.setDisplayedFavoritesList()
  }

  componentDidUpdate (prevProps) {
    if (this.props.favoriteList !== prevProps.favoriteList) this.setDisplayedFavoritesList()
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
    await Promise.all(favoriteList.map(async favorite => {
      if (!favorite.content) return null
      // NOTE - S.G. - 2021-04-01 - here we have the favorite as returned by the backend
      // hence the snake-case properties
      const response = await handleFetchResult(
        await getContentPath(FETCH_CONFIG.apiUrl, favorite.content_id)
      )
      const workspace = props.workspaceList.find(ws => ws.id === favorite.content.workspace_id)

      favorite.breadcrumbs = [{ label: workspace.label }].concat(response.body.items)
    }))

    this.setState({ contentCommentsCountList, isLoading: false })
    props.dispatch(setFavoriteList([...favoriteList]))
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
        onClickAddToFavoriteList={() => { }}
        customClass='favorites__item__favoriteButton'
      />
    )
    const isLast = index === props.favoriteList.length - 1
    const isFirst = index === 0
    if (!favorite.content) {
      const contentTypeInfo = props.contentType.find(info => info.slug === favorite.originalType)
      return (
        <UnavailableContent
          contentTypeInfo={contentTypeInfo}
          label={favorite.originalLabel}
          key={favorite.contentId}
          isLast={isLast}
          isFirst={isFirst}
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
        isFirst={isFirst}
        breadcrumbsList={favorite.breadcrumbs}
        commentsCount={state.contentCommentsCountList[index]}
        customClass='favorites__item'
        dataCy='favorites__item'
      >
        {favoriteButton}
      </ContentListItem>
    )
  }

  setDisplayedFavoritesList = () => {
    const { props, state } = this

    const sortedList = sortListBy(
      props.favoriteList,
      state.selectedSortCriterion,
      state.sortOrder,
      props.user.lang
    )

    this.setState({ displayedFavoritesList: sortedList })
  }

  handleClickTitleToSort = (criterion) => {
    this.setState(prev => {
      const sortOrder = prev.selectedSortCriterion === criterion && prev.sortOrder === SORT_ORDER.ASCENDING
        ? SORT_ORDER.DESCENDING
        : SORT_ORDER.ASCENDING
      return {
        displayedFavoritesList: sortListBy(prev.displayedFavoritesList, criterion, sortOrder, this.props.user.lang),
        selectedSortCriterion: criterion,
        sortOrder: sortOrder
      }
    })
  }

  filterFavoriteList = () => {
    const { props, state } = this

    if (state.userFilter === '') return state.displayedFavoritesList

    return state.displayedFavoritesList.filter((favorite) => {
      if (!favorite.content || !favorite.breadcrumbs) return false

      const contentTypeInfo = props.contentType.find(info => info.slug === favorite.content.type)
      const statusInfo = contentTypeInfo.availableStatuses.find(
        s => s.slug === favorite.content.statusSlug
      )

      const includesFilter = stringIncludes(state.userFilter)

      const hasFilterMatchOnContentLabel = includesFilter(favorite.content.label)
      const hasFilterMatchOnLastModifier = includesFilter(favorite.content.lastModifier.publicName)
      const hasFilterMatchOnBreadcrumbs = favorite.breadcrumbs.some(item => includesFilter(item.label))
      const hasFilterMatchOnContentType = contentTypeInfo && includesFilter(props.t(contentTypeInfo.label))
      const hasFilterMatchOnContentStatus = statusInfo && includesFilter(props.t(statusInfo.label))

      return (
        hasFilterMatchOnContentLabel ||
        hasFilterMatchOnLastModifier ||
        hasFilterMatchOnBreadcrumbs ||
        hasFilterMatchOnContentType ||
        hasFilterMatchOnContentStatus
      )
    })
  }

  render () {
    const { props, state } = this
    const filteredFavoriteList = this.filterFavoriteList()

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
                <FilterBar
                  onChange={e => {
                    const newFilter = e.target.value
                    this.setState({ userFilter: newFilter })
                  }}
                  value={state.userFilter}
                  placeholder={props.t('Filter my favorites')}
                />

                {filteredFavoriteList.length > 0
                  ? (
                    <>
                      <FavoritesHeader
                        onClickTitle={this.handleClickTitleToSort}
                        isOrderAscending={state.sortOrder === SORT_ORDER.ASCENDING}
                        selectedSortCriterion={state.selectedSortCriterion}
                      />
                      {filteredFavoriteList.map((favorite, index) => this.getFavoriteComponent(favorite, index))}
                    </>
                  )
                  : (
                    <EmptyListMessage>
                      {props.favoriteList.length <= 0
                        ? props.t('You did not add any content as favorite yet.')
                        : props.t('There are no favorites that matches you filter')}
                    </EmptyListMessage>
                  )}
              </PageContent>
            )}
        </PageWrapper>
      </div>
    )
  }
}

const mapStateToProps = ({ breadcrumbs, user, favoriteList, contentType, system, workspaceList }) => ({
  breadcrumbs,
  user,
  favoriteList,
  contentType,
  system,
  workspaceList
})
export default connect(mapStateToProps)(translate()(TracimComponent(Favorites)))
