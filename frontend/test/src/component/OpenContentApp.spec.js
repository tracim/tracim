import React from 'react'
import { expect } from 'chai'
import sinon from 'sinon'
import { mount } from 'enzyme'
import { OpenContentApp as OpenContentAppWithoutHOC } from '../../../src/component/Workspace/OpenContentApp.jsx'
import { contentType } from '../../hocMock/redux/contentType/contentType.js'
import { user } from '../../hocMock/redux/user/user.js'
import { firstWorkspace } from '../../fixture/workspace/firstWorkspace.js'
import { withRouterMock } from '../../hocMock/withRouter'
import { connectMock } from '../../hocMock/store'
import { appList } from '../../hocMock/redux/appList/appList.js'

describe('<OpenContentApp />', () => {
  const dispatchCustomEventSpy = sinon.spy()
  const onUpdateAppOpenedTypeSpy = sinon.spy()
  const renderAppFeatureSpy = sinon.spy()

  const props = {
    workspaceId: 1,
    appOpenedType: 'html-document',
    appList: appList,
    renderAppFeature: renderAppFeatureSpy,
    dispatchCustomEvent: dispatchCustomEventSpy,
    match: {
      params: {
        idws: 1,
        idcts: 1,
        type: 'html-document'
      }
    },
    onUpdateAppOpenedType: onUpdateAppOpenedTypeSpy
  }

  const propsWithOtherContentId = {
    ...props,
    match: {
      ...props.match,
      params: {
        ...props.match.params,
        idcts: 2
      }
    }
  }

  const propsWithOtherContentType = {
    ...props,
    match: {
      ...props.match,
      params: {
        ...props.match.params,
        idcts: 3,
        type: 'file'
      }
    }
  }


  const mapStateToProps = { contentType, user, currentWorkspace: firstWorkspace }

  const ComponentWithHoc = withRouterMock(connectMock(mapStateToProps)(OpenContentAppWithoutHOC))

  const wrapper = mount(<ComponentWithHoc {...props} />)

  const wrapperInstance = wrapper.find(OpenContentAppWithoutHOC)

  describe('openContentApp()', () => {
    beforeEach(() => {
      wrapper.setProps(props)
      renderAppFeatureSpy.resetHistory()
      onUpdateAppOpenedTypeSpy.resetHistory()
      dispatchCustomEventSpy.resetHistory()
    })

    it('should call dispatchCustomEvent to reload content when the app is already open', () => {
      wrapper.setProps(propsWithOtherContentId)

      expect(dispatchCustomEventSpy.called).to.equal(true)
      expect(renderAppFeatureSpy.called).to.equal(false)
      expect(onUpdateAppOpenedTypeSpy.called).to.equal(false)

      dispatchCustomEventSpy.resetHistory()
    })

    it('should call renderAppFeature and onUpdateAppOpenedType to open the new App and load its content', () => {
      wrapper.setProps(propsWithOtherContentType)

      expect(dispatchCustomEventSpy.called).to.equal(true)
      expect(renderAppFeatureSpy.called).to.equal(true)
      expect(onUpdateAppOpenedTypeSpy.called).to.equal(true)
    })

    it('should not call any callback when the workspaceId is undefined', () => {
      wrapper.setProps({ workspaceId: undefined })
      wrapperInstance.instance().openContentApp()

      expect(dispatchCustomEventSpy.called).to.equal(false)
      expect(renderAppFeatureSpy.called).to.equal(false)
      expect(onUpdateAppOpenedTypeSpy.called).to.equal(false)

      wrapper.setProps({ workspaceId: props.workspaceId })
    })
  })
})
