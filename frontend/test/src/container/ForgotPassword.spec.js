import React from 'react'
import { expect } from 'chai'
import { ForgotPassword as ForgotPasswordWithoutHOC } from '../../../src/container/ForgotPassword'
import sinon from 'sinon'
import { mount } from 'enzyme'
import { user } from '../../hocMock/redux/user/user'
import { workspaceList } from '../../hocMock/redux/workspaceList/workspaceList'
import { withRouterMock } from '../../hocMock/withRouter'
import { translateMock } from '../../hocMock/translate'

describe('<ForgotPassword />', () => {
  const renderAppPopupCreationCallBack = sinon.stub()
  const dispatchCallBack = sinon.stub()

  const props = {
    user: user,
    workspaceList: workspaceList.workspaceList,
    system: {
      workspaceListLoaded: true,
      config: {
        instance_name: 'instanceTest'
      }
    },
    canCreateWorkspace: true,
    renderAppPopupCreation: renderAppPopupCreationCallBack,
    dispatch: dispatchCallBack,
    history: []
  }

  const ComponentWithHOC = withRouterMock(translateMock()(ForgotPasswordWithoutHOC))

  const wrapper = mount(<ComponentWithHOC {...props} />)

  const wrapperInstance = wrapper.find(ForgotPasswordWithoutHOC)

  describe('intern function', () => {
    describe('handleInputKeyDown()', () => {
      it('should call the callBack when e.key === enter', () => {
        wrapperInstance.instance().handleInputKeyDown({ key: 'enter' })
      })
    })

    describe('handleChangeBackupEmail()', () => {
      it('should set backupEmail in the state', () => {
        wrapperInstance.instance().handleChangeBackupEmail({ target: { value: 'testValue' } })
        expect(wrapperInstance.state().backupEmail.value).to.equal('testValue')
        expect(wrapperInstance.state().backupEmail.isInvalid).to.equal(false)
      })
    })
  })
})
