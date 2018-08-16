import React from 'react'
import {
  Delimiter,
  PageWrapper,
  PageTitle,
  PageContent
} from 'tracim_frontend_lib'

export class AdminWorkspace extends React.Component {
  render () {
    return (
      <PageWrapper customClass='adminWorkspacePage'>
        <PageTitle
          parentClass={'adminWorkspacePage'}
          title={'Workspace management'}
        />

        <PageContent parentClass='adminWorkspacePage'>

          <div className='adminWorkspacePage__description'>
            List of every workspaces
          </div>

          { /*
            Alexi Cauvin 08/08/2018 => desactivate create workspace button due to redundancy

            <div className='adminWorkspacePage__createworkspace'>
              <button className='adminWorkspacePage__createworkspace__btncreate btn btn-primary primaryColorBg primaryColorBorder primaryColorBorderDarkenHover'>
                {this.props.t('Create a workspace')}
              </button>
            </div>
          */ }

          <Delimiter customClass={'adminWorkspacePage__delimiter'} />

          <div className='adminWorkspacePage__workspaceTable'>

            <table className='table'>
              <thead>
                <tr>
                  <th scope='col'>ID</th>
                  <th scope='col'>Workspace</th>
                  <th scope='col'>Description</th>
                  <th scope='col'>Member count</th>
                  { /*
                      <th scope='col'>Calendar</th>
                    */ }
                  <th scope='col'>Delete workspace</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>1</th>
                  <td>Design v_2</td>
                  <td>Workspace about tracim v2 design</td>
                  { /*
                      <td className='d-flex align-items-center flex-wrap'>
                        <div className='adminWorkspacePage__workspaceTable__calendaricon mr-2'>
                          <i className='fa fa-fw fa-check-square-o' />
                        </div>
                        Enable
                      </td>
                    */ }
                  <td>8</td>
                  <td>
                    <div className='adminWorkspacePage__workspaceTable__deleteworkspace primaryColorFont primaryColorFontDarkenHover'>
                      <div className='adminWorkspacePage__workspaceTable__deleteworkspace__removalicon mr-3'>
                        <i className='fa fa-fw fa-trash-o' />
                      </div>
                      Delete
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>2</th>
                  <td>New features</td>
                  <td>Add a new features : Annotated files</td>
                  { /*
                      <td className='d-flex align-items-center flex-wrap'>
                        <div className='adminWorkspacePage__workspaceTable__calendaricon mr-2'>
                          <i className='fa fa-fw fa-square-o' />
                        </div>
                        Disable
                      </td>
                    */ }
                  <td>5</td>
                  <td>
                    <div className='adminWorkspacePage__workspaceTable__deleteworkspace primaryColorFont primaryColorFontDarkenHover'>
                      <div className='adminWorkspacePage__workspaceTable__deleteworkspace__removalicon mr-3'>
                        <i className='fa fa-fw fa-trash-o' />
                      </div>
                      Delete
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>3</th>
                  <td>Fix Backend</td>
                  <td>workspace referring to multiple issues on the backend </td>
                  { /*
                      <td className='d-flex align-items-center flex-wrap'>
                        <div className='adminWorkspacePage__workspaceTable__calendaricon mr-2'>
                          <i className='fa fa-fw fa-check-square-o' />
                        </div>
                        Enable
                      </td>
                    */ }
                  <td>3</td>
                  <td>
                    <div className='adminWorkspacePage__workspaceTable__deleteworkspace primaryColorFont primaryColorFontDarkenHover'>
                      <div className='adminWorkspacePage__workspaceTable__deleteworkspace__removalicon mr-3'>
                        <i className='fa fa-fw fa-trash-o' />
                      </div>
                      Delete
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>4</th>
                  <td>Design v_2</td>
                  <td>Workspace about tracim v2 design</td>
                  { /*
                      <td className='d-flex align-items-center flex-wrap'>
                        <div className='adminWorkspacePage__workspaceTable__calendaricon mr-2'>
                          <i className='fa fa-fw fa-square-o' />
                        </div>
                        Disable
                      </td>
                    */ }
                  <td>8</td>
                  <td>
                    <div className='adminWorkspacePage__workspaceTable__deleteworkspace primaryColorFont primaryColorFontDarkenHover'>
                      <div className='adminWorkspacePage__workspaceTable__deleteworkspace__removalicon mr-3'>
                        <i className='fa fa-fw fa-trash-o' />
                      </div>
                      Delete
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>5</th>
                  <td>New features</td>
                  <td>Add a new features : Annotated files</td>
                  { /*
                      <td className='d-flex align-items-center flex-wrap'>
                        <div className='adminWorkspacePage__workspaceTable__calendaricon mr-2'>
                          <i className='fa fa-fw fa-square-o' />
                        </div>
                        Disable
                      </td>
                    */ }
                  <td>5</td>
                  <td>
                    <div className='adminWorkspacePage__workspaceTable__deleteworkspace primaryColorFont primaryColorFontDarkenHover'>
                      <div className='adminWorkspacePage__workspaceTable__deleteworkspace__removalicon mr-3'>
                        <i className='fa fa-fw fa-trash-o' />
                      </div>
                      Delete
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>6</th>
                  <td>Fix Backend</td>
                  <td>workspace referring to multiple issues on the backend </td>
                  { /*
                      <td className='d-flex align-items-center flex-wrap'>
                        <div className='adminWorkspacePage__workspaceTable__calendaricon mr-2'>
                          <i className='fa fa-fw fa-check-square-o' />
                        </div>
                        Enable
                      </td>
                    */ }
                  <td>3</td>
                  <td>
                    <div className='adminWorkspacePage__workspaceTable__deleteworkspace primaryColorFont primaryColorFontDarkenHover'>
                      <div className='adminWorkspacePage__workspaceTable__deleteworkspace__removalicon mr-3'>
                        <i className='fa fa-fw fa-trash-o' />
                      </div>
                      Delete
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </PageContent>
      </PageWrapper>
    )
  }
}

export default AdminWorkspace
