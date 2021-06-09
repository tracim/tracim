import { PAGES } from '../../support/urls_commands'

// TODO
// * Check create new tag
//  ** Create a new tag
//  ** click on "validate"
//  ** check if new tag has been created

// * Unchecking a tag
//  ** click on a checked item on the list
//  ** check if it is still marked as a content tag

// * Re-checking a tag
//  ** go back to the unchecked tag
//  ** check it
//  **  see if it is marked as a content tag

describe('Create tags', () => {
  // const onClickCloseAddTagBtnCallBack = sinon.spy()
  // const onClickBtnValidateCallBack = sinon.spy()

  // const props = {
  //   onClickCloseAddTagBtn: onClickCloseAddTagBtnCallBack,
  //   apiUrl: '/',
  //   searchedKnownTagList: [
  //     { tagName: 'Tag 1', tag_id: 1 },
  //     { tagName: 'Tag 2', tag_id: 2 },
  //     { tagName: 'Tag 6', tag_id: 3 },
  //     { tagName: 'Tag 89', tag_id: 4 },
  //     { tagName: 'Tag 11', tag_id: 5 },
  //     { tagName: 'Tag 98', tag_id: 6 }
  //   ],
  //   onClickAutoComplete: onClickAutoCompleteCallBack,
  //   autoCompleteClicked: true,
  //   onClickBtnValidate: onClickBtnValidateCallBack,
  //   autoCompleteActive: false
  // }

  // const wrapper = mount(<NewTagForm {...props} />)

  let htmlContentId
  let workspaceId

  const fileTitle = 'FileForSwitch'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  describe('Tag list', () => {
    for (const testedContent of ['file', 'note']) {
      describe(`in a ${testedContent}`, () => {
        before(() => {
          cy.loginAs('administrators')
          cy.fixture('baseWorkspace').as('workspace').then(({ workspace_id: workspaceId }) => {
            if (testedContent === 'file') {
              cy.createFile(fullFilename, contentType, fileTitle, workspaceId).then(({ content_id: contentId }) => {
                cy.visitPage({
                  pageName: PAGES.CONTENT_OPEN,
                  params: { workspaceId, contentType: 'file', contentId }
                })
              })
            } else {
              cy.createHtmlDocument('A note', workspaceId).then(({ content_id: contentId }) => {
                cy.visitPage({
                  pageName: PAGES.CONTENT_OPEN,
                  params: { workspaceId, contentType: 'html-document', contentId }
                })
              })
            }
          })
        })

        it('should create two tags', () => {
          cy.get('[data-cy=popin_right_part_tag]').click()
          cy.get('[data-cy=taglist__btnadd]').click()
          cy.get('[data-cy=addtag]').type('TagOne')
          cy.get('[data-cy=ValidateTag]').click()
          cy.get('[data-cy=addtag]').type('TagTwo')
          cy.get('[data-cy=ValidateTag]').click()
          // switch tab and come back
          cy.get('[data-cy=popin_right_part_timeline]').click()
          cy.get('[data-cy=popin_right_part_tag]').click()
        })

        it('should list the tags', () => {
          cy.get('[data-cy=taglist] li').its('length').should('be.equal', 2)
          cy.get('[data-cy=taglist]').first().should('contain', 'TagTwo')
        })

        it('clicking on a tag should uncheck it', () => {
          cy.get('[data-cy=taglist] .checkboxCustom__checked').its('length').should('be.equal', 2)
          cy.get('[data-cy=taglist] li label').first().click()
          cy.get('[data-cy=taglist] .checkboxCustom__checked').its('length').should('be.equal', 1)
        })

        it('clicking on an unchecked tag should check it', () => {
          cy.get('[data-cy=taglist] .checkboxCustom__checked').its('length').should('be.equal', 1)
          cy.get('[data-cy=taglist] li label').first().click()
          cy.get('[data-cy=taglist] .checkboxCustom__checked').its('length').should('be.equal', 2)
        })
      })
    }
  })
})
