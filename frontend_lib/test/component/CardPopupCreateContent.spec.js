import React from 'react'
import { expect } from 'chai'
import { shallow, configure } from 'enzyme'
import CardPopupCreateContent from '../../src/component/CardPopup/CardPopupCreateContent.jsx'
require('../../src/component/CardPopup/CardPopupCreateContent.styl')

describe('<CardPopupCreateContent />', () => {
  const props = {
    onClose: () => {},
    onValidate: () => {},
    contentName: 'randomContentName',
    onChangeContentName: () => {},
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
      onClose={props.onClose}
      onValidate={props.onValidate}
      contentName={props.contentName}
      onChangeContentName={props.onChangeContentName}
      label={props.label}
      customColor={props.customColor}
      faIcon={props.faIcon}
      btnValidateLabel={props.btnValidateLabel}
      customStyle={props.customStyle}
      inputPlaceholder={props.inputPlaceholder}
    />
  )

  it(`should display "${props.label}"`, () =>
    expect(wrapper.find('.createcontent__contentname__title')).to.have.text().equal(props.label)
  )

  it(`should have the customColor "${props.customColor}"`, () => {
    expect(wrapper.find(`.fa-${props.faIcon}`).prop('style').color).to.equal(props.customColor)
    expect(wrapper.find(`.createcontent__contentname__title`).prop('style').color).to.equal(props.customColor)
    expect(wrapper.find(`.createcontent__form__button.btn`).prop('style').backgroundColor).to.equal(props.customColor)
    expect(wrapper.find(`.createcontent__form__button.btn`).prop('style').borderColor).to.equal(props.customColor)
  })

  it(`should display the icon "${props.faIcon}"`, () =>
    expect(wrapper.find(`.fa-${props.faIcon}`)).to.have.lengthOf(1)
  )

  it(`should have the good custom style`, () =>
    expect(wrapper.find(`CardPopup`).prop('customStyle')).to.deep.equal(props.customStyle)
  )

  it(`should have the good custom color`, () =>
    expect(wrapper.find(`CardPopup`).prop('customColor')).to.deep.equal(props.customColor)
  )

  it(`should have the good onClose function`, () =>
    expect(wrapper.find(`CardPopup`).prop('onClose')).to.deep.equal(props.onClose)
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

  it(`should have the good onChangeContentName function`, () =>
    expect(wrapper.find(`.createcontent__form__input`).prop('onChange')).to.deep.equal(props.onChangeContentName)
  )

  it(`should have the good onValidate function`, () =>
    expect(wrapper.find(`.createcontent__form__button.btn`).prop('onClick')).to.deep.equal(props.onValidate)
  )
})
