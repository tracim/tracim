import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import { FileProperties } from '../../src/component/FileProperties.jsx'
import sinon from 'sinon'

describe('<FileProperties />', () => {
  const onClickValidateNewDescriptionCallBack = sinon.spy()

  const props = {
    description: 'randomDescription',
    onClickValidateNewDescription: onClickValidateNewDescriptionCallBack,
    fileType: 'randomFileType',
    fileSize: 'randomFileSize',
    filePageNb: 'randomFilePageNb',
    activesShares: 636,
    creationDate: 'randomCreationDate',
    lastModification: 'randomLastModification',
    creationDateFormatted: 'randomCreationDateFormatted',
    lastModificationFormatted: 'randomLastModificationFormatted',
    displayFormNewDescription: true,
    color: '#ffffff',
    displayChangeDescriptionBtn: true,
    disableChangeDescription: false
  }

  const wrapper = shallow(<FileProperties {...props} t={tradKey => tradKey} />)

  describe('static design', () => {
    it(`should display the number of shares: ${props.activesShares} in a div at position: 3`, () => {
      expect(wrapper.find('div.fileProperties__content__detail__item').at(3)).to.text().contains(props.activesShares)
    })
  })
})
