import React from 'react'
import { expect } from 'chai'
import { mount } from 'enzyme'
import { APP_FEATURE_MODE } from '../../src/helper.js'
import PopinFixedContent from '../../src/component/PopinFixed/PopinFixedContent.jsx'

describe('<PopinFixedContent />', () => {
  const props = {
    customClass: 'randomCustomClass',
    lastVersion: 1337,
    appMode: APP_FEATURE_MODE.VIEW,
    actionList: [],
    availableStatuses: [],
    breadcrumbsList: [],
    componentTitle: <div />,
    config: {
      hexcolor: '',
      faIcon: '',
      apiUrl: ''
    },
    content: {
      is_archived: false,
      is_deleted: false,
      number: 42,
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

  const wrapper = mount(
    <PopinFixedContent
      {...props}
    >
      <Children />
      <Children2 />
    </PopinFixedContent>
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
        <PopinFixedContent
          {...props}
          appMode={APP_FEATURE_MODE.REVISION}
        >
          <Children />
          <Children2 />
        </PopinFixedContent>
      )

      it(`should display the version number ${props.content.number}`, () =>
        expect(wrapper.find('div.wsContentGeneric__content__left__top__version')).to.have.text().contains(props.content.number)
      )
      it(`should display the last version number ${props.lastVersion}`, () =>
        expect(wrapper.find('.wsContentGeneric__content__left__top__lastversion')).to.have.text().contains(props.lastVersion)
      )
    })
  })
})
