import React from 'react'
import { expect } from 'chai'
import { ForgotPassword as ForgotPasswordWithoutHOC } from '../../../src/container/ForgotPassword'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user'
import { workspaceList } from '../../hocMock/redux/workspaceList/workspaceList'
import { withRouterMock } from '../../hocMock/withRouter'
import { translateMock } from '../../hocMock/translate'
import { shallowUntilTarget } from '../../hocMock/helper'

describe('<ForgotPassword />', () => {
  const renderAppPopupCreationCallBack = sinon.stub()
  const dispatchCallBack = sinon.stub()

  const props = {
    user: user,
    workspaceList: workspaceList.workspaceList,
    system: {
      workspaceListLoaded: true
    },
    canCreateWorkspace: true,
    renderAppPopupCreation: renderAppPopupCreationCallBack,
    dispatch: dispatchCallBack,
    history: []
  }

  const ComponentWithHOC = withRouterMock(translateMock()(ForgotPasswordWithoutHOC))

  const wrapper = shallowUntilTarget(
    <ComponentWithHOC {...props} />,
    ForgotPasswordWithoutHOC
  )

  describe('intern function', () => {
    describe('handleInputKeyDown()', () => {
      it('should call the callBack when e.key === enter', () => {
        wrapper.instance().handleInputKeyDown({ key: 'enter' })
      })
    })

    describe('handleChangeBackupEmail()', () => {
      it('should set backupEmail in the state', () => {
        wrapper.instance().handleChangeBackupEmail({ target: { value: 'testValue' } })
        expect(wrapper.state().backupEmail.value).to.equal('testValue')
        expect(wrapper.state().backupEmail.isInvalid).to.equal(false)
      })
    })
  })
})
