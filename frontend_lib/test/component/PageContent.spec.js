import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import PageContent from '../../src/component/Layout/PageContent.jsx'

describe('<PageContent />', () => {
  const props = {
    parentClass: 'randomParentClass',
    customClass: 'randomCustomClass'
  }

  const Children = () => <div><h1>Random title</h1>I am a children of PageContent</div>

  const wrapper = shallow(
    <PageContent
      {...props}
    >
      <Children />
    </PageContent>
  )

  describe('Static design', () => {
    it(`should have its children`, () =>
      expect(wrapper.find('.pageContentGeneric').find(Children).length).equal(1)
    )

    it(`the div should have the class: ${(props.parentClass)}`, () =>
      expect(wrapper.find(`div.${(props.parentClass)}`)).to.have.lengthOf(1)
    )

    it(`the div should have the class: ${(props.customClass)}`, () =>
      expect(wrapper.find(`div.${(props.customClass)}`)).to.have.lengthOf(1)
    )
  })
})
