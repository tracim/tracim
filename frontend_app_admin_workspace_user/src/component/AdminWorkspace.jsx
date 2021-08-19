import React from 'react'
import { translate } from 'react-i18next'
import {
  Delimiter,
  PageWrapper,
  PageTitle,
  PageContent,
  Icon,
  SPACE_TYPE_LIST,
  htmlToText
} from 'tracim_frontend_lib'

const AdminWorkspace = props => {
  const parser = new DOMParser()
  return (
    <PageWrapper customClass='adminWorkspace'>
      <PageTitle
        parentClass='adminWorkspace'
        title={props.t('Space management')}
        icon='fas fa-users'
        breadcrumbsList={props.breadcrumbsList}
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

        <div className='adminWorkspace__workspaceTable'>
          <table className='table'>
            <thead>
              <tr>
                <th className='table__id' scope='col'>Id</th>
                <th className='table__type' scope='col'>{props.t('Type')}</th>
                <th className='table__sharedSpace' scope='col'>{props.t('Space')}</th>
                <th className='table__description' scope='col'>{props.t('Description')}</th>
                <th className='table__memberCount' scope='col'>{props.t('Members')}</th>
                {/* <th scope='col'>Calendar</th> */}
                <th className='table__delete' scope='col'>{props.t('Delete')}</th>
              </tr>
            </thead>

            <tbody>
              {(props.workspaceList.length > 0 ? props.workspaceList/* .sort((a, b) => a.workspace_id > b.workspace_id) */.map(ws => {
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
                          icon={`fa-fw ${spaceType.faIcon}`}
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
                    {/*
                       <td className='d-flex align-items-center flex-wrap'>
                       <div className='adminWorkspace__workspaceTable__calendaricon mr-2'>
                       <i className='far fa-fw fa-check-square' />
                       </div>
                       Enable
                       </td>
                    */}
                    <td className='table__memberCount'>{ws.memberList.length}</td>
                    <td>
                      <div className='table__delete adminWorkspace__table__delete'>
                        <button
                          type='button'
                          className='adminWorkspace__table__delete__icon btn iconBtn primaryColorFont primaryColorFontDarkenHover mr-3'
                          onClick={() => props.onClickDeleteWorkspace(ws.workspace_id)}
                        >
                          <i className='far fa-fw fa-trash-alt' />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
                : (
                  <tr>
                    <td />
                    <td>{props.t('There is no space yet')}</td>
                    <td />
                    <td />
                    <td />
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </PageContent>
    </PageWrapper>
  )
}

export default translate()(AdminWorkspace)
