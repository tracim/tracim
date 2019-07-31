import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import CardPopupCreateContent from '../../src/component/CardPopup/CardPopupCreateContent.jsx'
require('../../src/component/CardPopup/CardPopupCreateContent.styl')

describe('<CardPopupCreateContent />', () => {
  const props = {
    onClose: () => { return 1 },
    onValidate: () => { return 2 },
    contentName: 'randomContentName',
    onChangeContentName: () => { return 3 },
    label: 'randomLabel',
    customColor: 'yellow',
    faIcon: 'randomIcon',
    btnValidateLabel: 'RandomBtnValidateLabel',
    customStyle: {
      color: 'yellow'
    },
    inputPlaceholder: 'RandomInputPlaceholder'
  }

  const wrapper = shallow(
    <CardPopupCreateContent
      {...props}
    />
  )

  describe('Static design test', () => {
    it(`should display "${props.label}"`, () =>
      expect(wrapper.find('.createcontent__contentname__title')).to.have.text().equal(props.label)
    )

    it(`.createcontent__form__button.btn should have the customColor "${props.customColor}"`, () => {
      expect(wrapper.find(`.createcontent__form__button.btn`).prop('style').borderColor).to.equal(props.customColor)
    })

    it(`.fa-${props.faIcon} should have the customColor "${props.customColor}"`, () =>
      expect(wrapper.find(`.fa-${props.faIcon}`).prop('style').color).to.equal(props.customColor)
    )

    it(`.createcontent__contentname__title should have the customColor "${props.customColor}"`, () =>
      expect(wrapper.find(`.createcontent__contentname__title`).prop('style').color).to.equal(props.customColor)
    )

    it(`.createcontent__form__button.btn should have the customColor "${props.customColor}"`, () =>
      expect(wrapper.find(`.createcontent__form__button.btn`).prop('style').backgroundColor).to.equal(props.customColor)
    )

    it(`should display the icon "${props.faIcon}"`, () =>
      expect(wrapper.find(`i.fa.fa-${props.faIcon}`)).to.have.lengthOf(1)
    )

    it(`CardPopup should have the good custom style`, () =>
      expect(wrapper.find(`CardPopup`).prop('customStyle')).to.deep.equal(props.customStyle)
    )

    it(`CardPopup should have the good customColor "${props.customColor}"`, () =>
      expect(wrapper.find(`CardPopup`).prop('customColor')).to.deep.equal(props.customColor)
    )

    it(`should display the validate label "${props.btnValidateLabel}"`, () =>
      expect(wrapper.find('.createcontent__form__button.btn')).to.have.text().equal(props.btnValidateLabel)
    )

    it(`should display the input placeholder "${props.inputPlaceholder}"`, () =>
      expect(wrapper.find('.createcontent__form__input').prop('placeholder')).to.have.equal(props.inputPlaceholder)
    )

    it(`should display the content name "${props.contentName}"`, () =>
      expect(wrapper.find('.createcontent__form__input').prop('value')).to.have.equal(props.contentName)
    )
  })

  describe('Handlers test', () => {
    it(`onChange handler should call the proper handler`, () =>
      expect(wrapper.find(`.createcontent__form__input`).prop('onChange')()).to.equal(props.onChangeContentName())
    )

    it(`onClick handler should call the proper handler`, () =>
      expect(wrapper.find(`.createcontent__form__button.btn`).prop('onClick')()).to.equal(props.onValidate())
    )

    it(`onClose handler should call the proper handle`, () =>
      expect(wrapper.find(`CardPopup`).prop('onClose')()).to.equal(props.onClose())
    )
  })
})
