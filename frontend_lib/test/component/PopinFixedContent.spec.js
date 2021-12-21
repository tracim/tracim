import React from 'react'
import { withRouterMock, RouterMock } from '../hocMock/withRouter'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { APP_FEATURE_MODE } from '../../src/helper.js'
import PopinFixedContent from '../../src/component/PopinFixed/PopinFixedContent.jsx'
import { reactstrapPopoverHack } from '../testHelper.js'

describe('<PopinFixedContent />', () => {
  const props = {
    customClass: 'randomCustomClass',
    lastVersion: 1337,
    contentVersionNumber: 42,
    appMode: APP_FEATURE_MODE.VIEW,
    actionList: [],
    availableStatuses: [],
    breadcrumbsList: [],
    componentTitle: <div />,
    config: {
      hexcolor: '',
      faIcon: '',
      apiUrl: 'http://fake.url/api'
    },
    content: {
      is_archived: false,
      is_deleted: false,
      status: ''
    },
    disableChangeTitle: false,
    favoriteState: '',
    isRefreshNeeded: false,
    loggedUser: {
      userRoleIdInWorkspace: 0
    },
    onChangeStatus: () => { },
    onClickAddToFavoriteList: () => { },
    onClickCloseBtn: () => { },
    onClickRemoveFromFavoriteList: () => { },
    onValidateChangeTitle: () => { },
    showReactions: false,
    t: key => key
  }

  const Children = () => <div><h1>Random title</h1>I am the first children of PopinFixedContent</div>
  const Children2 = () => <div><h1>Random title2</h1>I am the second children of PopinFixedContent</div>

  const PopinFixedContentWithHOC = withRouterMock(PopinFixedContent)

  reactstrapPopoverHack(document, 'rawTitle')

  const wrapper = mount(
    <PopinFixedContentWithHOC {...props}>
      <Children />
      <Children2 />
    </PopinFixedContentWithHOC>,
    { wrappingComponent: RouterMock }
  )

  describe('Static design', () => {
    it(`the div should have the class: "${(props.customClass)}__content"`, () =>
      expect(wrapper.find(`div.${(props.customClass)}__content.wsContentGeneric__content`)).to.have.lengthOf(1)
    )

    it(`should display the last version number ${props.lastVersion}`, () =>
      expect(wrapper.find('.wsContentGeneric__content__left__top__version')).to.have.text().contains(props.lastVersion)
    )

    describe('if appMode is revision', () => {
      const wrapper = mount(
        <PopinFixedContentWithHOC {...props} appMode={APP_FEATURE_MODE.REVISION}>
          <Children />
          <Children2 />
        </PopinFixedContentWithHOC>,
        { wrappingComponent: RouterMock }
      )

      it(`should display the version number ${props.contentVersionNumber}`, () =>
        expect(wrapper.find('div.wsContentGeneric__content__left__top__version')).to.have.text().contains(props.contentVersionNumber)
      )
      it(`should display the last version number ${props.lastVersion}`, () =>
        expect(wrapper.find('.wsContentGeneric__content__left__top__lastversion')).to.have.text().contains(props.lastVersion)
      )
    })
  })
})
