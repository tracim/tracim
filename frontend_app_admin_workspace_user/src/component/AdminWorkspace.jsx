import React from 'react'
import { translate } from 'react-i18next'
import {
  Delimiter,
  PageWrapper,
  PageTitle,
  PageContent
} from 'tracim_frontend_lib'

const AdminWorkspace = props =>
  <PageWrapper customClass='adminWorkspace'>
    <PageTitle
      parentClass={'adminWorkspace'}
      title={props.t('Workspace management')}
    />

    <PageContent parentClass='adminWorkspace'>
      <div className='adminWorkspace__description'>
        {props.t('List of every workspaces')}
      </div>

      <Delimiter customClass={'adminWorkspace__delimiter'} />

      <div className='adminWorkspace__workspaceTable'>

        <table className='table'>
          <thead>
            <tr>
              <th scope='col'>Id</th>
              <th scope='col'>{props.t('Workspace')}</th>
              <th scope='col'>{props.t('Description')}</th>
              <th scope='col'>{props.t('Member count')}</th>
              {/* <th scope='col'>Calendar</th> */}
              <th scope='col'>{props.t('Delete workspace')}</th>
            </tr>
          </thead>

          <tbody>
            {props.workspaceList/* .sort((a, b) => a.workspace_id > b.workspace_id) */.map(ws =>
              <tr className='adminWorkspace__workspaceTable__tr' key={ws.slug}>
                <th>{ws.workspace_id}</th>
                <td
                  className='adminWorkspace__workspaceTable__tr__td-link primaryColor'
                  onClick={() => props.onClickWorkspace(ws.workspace_id)}
                >
                  {ws.label}
                </td>
                <td>{ws.description}</td>
                {/*
                  <td className='d-flex align-items-center flex-wrap'>
                    <div className='adminWorkspace__workspaceTable__calendaricon mr-2'>
                      <i className='fa fa-fw fa-check-square-o' />
                    </div>
                    Enable
                  </td>
                */}
                <td>{ws.memberList.length}</td>
                <td>
                  <div className='adminWorkspace__table__delete primaryColorFont primaryColorFontDarkenHover'>
                    <button
                      type='button'
                      className='adminWorkspace__table__delete__icon btn iconBtn mr-3'
                      onClick={() => props.onClickDeleteWorkspace(ws.workspace_id)}
                    >
                      <i className='fa fa-fw fa-trash-o' />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageContent>
  </PageWrapper>

export default translate()(AdminWorkspace)
