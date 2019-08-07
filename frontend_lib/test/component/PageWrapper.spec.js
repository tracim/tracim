import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import PageWrapper from '../../src/component/Layout/PageWrapper.jsx'
import PageTitle from '../../src/component/Layout/PageTitle.jsx'
import PageContent from '../../src/component/Layout/PageContent.jsx'
require('../../src/component/Layout/PageWrapper.styl')

describe('<PageWrapper />', () => {
  const props = {
    customClass: 'randomCustomClass'
  }

  const wrapper = shallow(
    <PageWrapper
      {...props}
    >
      <PageTitle title={'randomTitle'} />
      <PageContent />
    </PageWrapper>
  )

  describe('Static design', () => {
    it(`should have its children`, () => {
      expect(wrapper.find('.pageWrapperGeneric').find(PageTitle).length).equal(1)
      expect(wrapper.find('.pageWrapperGeneric').find(PageContent).length).equal(1)
    })

    it(`the div should have the class: "${props.customClass}"`, () =>
      expect(wrapper.find(`div.${props.customClass}.pageWrapperGeneric`)).to.have.lengthOf(1)
    )
  })
})
