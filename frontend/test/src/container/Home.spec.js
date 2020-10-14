import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { Home as HomeWithoutHOC } from '../../../src/container/Home.jsx'
import sinon from 'sinon'
import { user } from '../../hocMock/redux/user/user'
import { workspaceList } from '../../hocMock/redux/workspaceList/workspaceList'

describe('<Home />', () => {
  const renderAppPopupCreationCallBack = sinon.spy()

  const props = {
    user: user,
    workspaceList: workspaceList.workspaceList,
    system: {
      workspaceListLoaded: true,
      config: {
        instance_name: 'instanceTest'
      }
    },
    dispatch: () => { },
    canCreateWorkspace: true,
    renderAppPopupCreation: renderAppPopupCreationCallBack,
    registerCustomEventHandlerList: () => { }
  }

  const wrapper = shallow(
    <HomeWithoutHOC {...props} t={key => key} />
  )

  describe('static design', () => {
    it('should render the root div', () =>
      expect(wrapper.find('div.tracim__content').length).equal(1)
    )

    it('should not render if workspaceList is not loaded', () => {
      wrapper.setProps({ system: { ...props.system, workspaceListLoaded: false } })
      expect(wrapper.find('div.tracim__content').length).equal(0)
      wrapper.setProps({ system: props.system })
    })
  })

  describe('handler', () => {
    it('renderAppPopupCreationCallBack should be called when handleClickCreateWorkspace is called', () => {
      wrapper.instance().handleClickCreateWorkspace({ preventDefault: () => { } })
      expect(renderAppPopupCreationCallBack.called).to.equal(true)
    })
  })

  describe('its internal functions', () => {
    describe('checkUsernameValidity', () => {
      afterEach(() => {
        wrapper.instance().setState({
          isUsernameValid: true
        })
      })

      it('should have the isUsernameValid state as true if username is not set yet', async () => {
        await wrapper.instance().checkUsernameValidity('')
        expect(wrapper.state('isUsernameValid')).to.equal(true)
      })

      it('should have the isUsernameValid state as false if username is shorter than MINIMUM_CHARACTERS_USERNAME', async () => {
        await wrapper.instance().checkUsernameValidity('aa')
        expect(wrapper.state('isUsernameValid')).to.equal(false)
      })

      it('should have the isUsernameValid state as false if username has a space', async () => {
        await wrapper.instance().checkUsernameValidity('user name')
        expect(wrapper.state('isUsernameValid')).to.equal(false)
      })

      it('should have the isUsernameValid state as false if username has a not allowed character', async () => {
        await wrapper.instance().checkUsernameValidity('usern@me!')
        expect(wrapper.state('isUsernameValid')).to.equal(false)
      })

      it('should have the isUsernameValid state as false if username start with @', async () => {
        await wrapper.instance().checkUsernameValidity('@username')
        expect(wrapper.state('isUsernameValid')).to.equal(false)
      })
    })
  })
})
