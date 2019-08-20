import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Account as AccountWithoutHOC } from '../../src/container/Account'
import sinon from 'sinon'
import { user } from '../hocMock/redux/user/user'
import { appList } from '../hocMock/redux/appList/appList'
import { workspaceList } from '../hocMock/redux/workspaceList/workspaceList'
import configureMockStore from 'redux-mock-store'
import { translateMock } from '../hocMock/translate'
import { Provider } from 'react-redux'

describe('<Account />', () => {
  const mockStore = configureMockStore()
  const store = mockStore({})

  const dispatchCallBack = sinon.stub()

  const props = {
    breadcrumbs: [],
    user: user,
    appList: appList,
    workspaceList: workspaceList.workspaceList,
    system: {
      workspaceListLoaded: true,
      config: {
        email_notification_activated: true
      }
    },
    dispatch: dispatchCallBack
  }

  const ComponentWithHOC = translateMock()(AccountWithoutHOC)

  const wrapper = shallow(
    <Provider store={store}>
      <ComponentWithHOC { ...props } />
    </Provider>
  )

  describe('internal functions', () => {

  })
})
