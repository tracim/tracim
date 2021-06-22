import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { APP_FEATURE_MODE } from '../../src/helper.js'
import PopinFixedContent from '../../src/component/PopinFixed/PopinFixedContent.jsx'

describe('<PopinFixedContent />', () => {
  const props = {
    customClass: 'randomCustomClass',
    version: '42',
    lastVersion: 1337
  }

  const Children = () => <div><h1>Random title</h1>I am the first children of PopinFixedContent</div>
  const Children2 = () => <div><h1>Random title2</h1>I am the second children of PopinFixedContent</div>

  const wrapper = shallow(
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
      expect(wrapper.find('.wsContentGeneric__content__left__top__version').render().text()).to.contains(props.lastVersion)
    )

    describe('if appMode is revision', () => {
      const wrapper = shallow(
        <PopinFixedContent
          {...props}
          appMode={APP_FEATURE_MODE.REVISION}
        >
          <Children />
          <Children2 />
        </PopinFixedContent>
      )

      it(`should display the version number ${props.version}`, () =>
        expect(wrapper.find('.wsContentGeneric__content__left__top__version').render().text()).to.contains(props.version)
      )
      it(`should display the last version number ${props.lastVersion}`, () =>
        expect(wrapper.find('.wsContentGeneric__content__left__top__lastversion').render().text()).to.contains(props.lastVersion)
      )
    })
  })
})
