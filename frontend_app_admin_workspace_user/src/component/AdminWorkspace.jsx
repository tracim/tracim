import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { translate } from 'react-i18next'
import {
  SORT_BY,
  SPACE_TYPE_LIST,
  Delimiter,
  EmptyListMessage,
  FilterBar,
  Icon,
  IconButton,
  Loading,
  PageContent,
  PageTitle,
  PageWrapper,
  TitleListHeader,
  htmlToText,
  stringIncludes
} from 'tracim_frontend_lib'

const AdminWorkspace = props => {
  const parser = new DOMParser()
  const [userFilter, setUserFilter] = useState('')

  const filterWorkspaceList = () => {
    if (userFilter === '') return props.workspaceList

    return props.workspaceList.filter(space => {
      const spaceType = SPACE_TYPE_LIST.find(type => type.slug === space.access_type) || { label: '' }

      const includesFilter = stringIncludes(userFilter)

      const hasFilterMatchOnLabel = includesFilter(space.label)
      const hasFilterMatchOnDescription = includesFilter(space.description)
      const hasFilterMatchOnType = spaceType && includesFilter(props.t(spaceType.label))
      const hasFilterMatchOnId = space.workspace_id && includesFilter(space.workspace_id.toString())

      return (
        hasFilterMatchOnLabel ||
        hasFilterMatchOnDescription ||
        hasFilterMatchOnType ||
        hasFilterMatchOnId
      )
    })
  }

  const filteredWorkspaceList = filterWorkspaceList()

  return (
    <PageWrapper customClass='adminWorkspace'>
      <PageTitle
        parentClass='adminWorkspace'
        title={props.t('Space management')}
        icon='fas fa-users-cog'
        breadcrumbsList={props.breadcrumbsList}
        isEmailNotifActivated={props.isEmailNotifActivated}
      />

      <PageContent parentClass='adminWorkspace'>
        <div className='adminWorkspace__description'>
          {props.t('List of every spaces')}
        </div>

        <div className='adminWorkspace__btnnewworkspace'>
          <IconButton
            customClass='adminWorkspace__btnnewworkspace__btn'
            intent='secondary'
            onClick={props.onClickNewWorkspace}
            text={props.t('Create a space')}
            icon='fas fa-plus'
          />
        </div>

        <Delimiter customClass='adminWorkspace__delimiter' />

        <FilterBar
          onChange={e => {
            const newFilter = e.target.value
            setUserFilter(newFilter)
          }}
          value={userFilter}
          placeholder={props.t('Filter spaces')}
        />

        <div className='adminWorkspace__workspaceTable'>
          {props.loaded ? (
            props.workspaceList.length > 0 ? (
              <table className='table'>
                <thead>
                  <tr>
                    <th className='table__id' scope='col'>
                      <TitleListHeader
                        title={props.t('Id')}
                        onClickTitle={() => props.onClickTitle(SORT_BY.ID)}
                        isOrderAscending={props.isOrderAscending}
                        isSelected={props.selectedSortCriterion === SORT_BY.ID}
                        tootltip={props.t('Sort by id')}
                      />
                    </th>
                    <th className='table__type' scope='col'>
                      <TitleListHeader
                        title={props.t('Type')}
                        onClickTitle={() => props.onClickTitle(SORT_BY.SPACE_TYPE)}
                        isOrderAscending={props.isOrderAscending}
                        isSelected={props.selectedSortCriterion === SORT_BY.SPACE_TYPE}
                        tootltip={props.t('Sort by type')}
                      />
                    </th>
                    <th className='table__sharedSpace' scope='col'>
                      <TitleListHeader
                        title={props.t('Space')}
                        onClickTitle={() => props.onClickTitle(SORT_BY.LABEL)}
                        isOrderAscending={props.isOrderAscending}
                        isSelected={props.selectedSortCriterion === SORT_BY.LABEL}
                        tootltip={props.t('Sort by title')}
                      />
                    </th>
                    <th className='table__description' scope='col'>
                      <TitleListHeader
                        title={props.t('Description')}
                        onClickTitle={() => props.onClickTitle(SORT_BY.DESCRIPTION)}
                        isOrderAscending={props.isOrderAscending}
                        isSelected={props.selectedSortCriterion === SORT_BY.DESCRIPTION}
                        tootltip={props.t('Sort by description')}
                      />
                    </th>
                    <th className='table__memberCount' scope='col'>
                      <TitleListHeader
                        title={props.t('Members')}
                        onClickTitle={() => props.onClickTitle(SORT_BY.NUMBER_OF_MEMBERS)}
                        isOrderAscending={props.isOrderAscending}
                        isSelected={props.selectedSortCriterion === SORT_BY.NUMBER_OF_MEMBERS}
                        tootltip={props.t('Sort by number of members')}
                      />
                    </th>
                    <th className='table__delete' scope='col'>{props.t('Delete')}</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredWorkspaceList.map(ws => {
                    const spaceType = SPACE_TYPE_LIST.find(type => type.slug === ws.access_type) || { hexcolor: '', label: '', faIcon: '' }
                    const descriptionText = htmlToText(parser, ws.description)
                    return (
                      <tr className='adminWorkspace__workspaceTable__tr' key={ws.workspace_id}>
                        <td className='table__id'>{ws.workspace_id}</td>
                        <td
                          className='table__type'
                        >
                          <span>
                            <Icon
                              icon={spaceType.faIcon}
                              title={props.t(spaceType.label)}
                              color={spaceType.hexcolor}
                            />
                          </span>
                          <div className='label'>{props.t(spaceType.label)}</div>
                        </td>
                        <td
                          className='table__sharedSpace adminWorkspace__workspaceTable__tr__td-link primaryColorFontHover'
                          onClick={() => props.onClickWorkspace(ws.workspace_id)}
                        >
                          {ws.label}
                        </td>
                        <td className='table__description adminWorkspace__workspaceTable__tr__td-description'>{descriptionText}</td>
                        <td className='table__memberCount'>{ws.number_of_members}</td>
                        <td>
                          <div className='table__delete adminWorkspace__table__delete'>
                            <button
                              type='button'
                              className='adminWorkspace__table__delete__icon btn iconBtn primaryColorFont primaryColorFontDarkenHover'
                              onClick={() => props.onClickDeleteWorkspace(ws.workspace_id)}
                            >
                              <i className='far fa-fw fa-trash-alt' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyListMessage>
                {props.t('There is no space yet')}
              </EmptyListMessage>
            )
          ) : (
            <Loading
              height={100}
              width={100}
            />
          )}

          {filteredWorkspaceList.length <= 0 && (
            <EmptyListMessage>
              {props.t('There are no spaces that matches you filter')}
            </EmptyListMessage>
          )}
        </div>
      </PageContent>
    </PageWrapper>
  )
}

export default translate()(AdminWorkspace)

AdminWorkspace.propTypes = {
  loaded: PropTypes.bool.isRequired
}

AdminWorkspace.defaultProps = {
}
