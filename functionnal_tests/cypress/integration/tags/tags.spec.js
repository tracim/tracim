import { PAGES } from '../../support/urls_commands'


describe.skip('Create tags', () => {
  // RJ - FIXME - 2021-06-10 - This test suit is failing in Travis.
  // See https://github.com/tracim/tracim/issues/4694

  let htmlContentId
  let workspaceId

  const fileTitle = 'FileForSwitch'
  const fullFilename = 'Linux-Free-PNG.png'
  const contentType = 'image/png'

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  describe('Tags', () => {
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

        after(cy.cancelXHR)

        it('should create two tags', () => {
          cy.get('[data-cy=popin_right_part_tag]').click()
          cy.get('[data-cy=tag_list__btn_add]').click()
          cy.get('[data-cy=add_tag]').type('TagOne')
          cy.get('[data-cy=ValidateTag]').click()
          cy.get('[data-cy=add_tag]').type('TagTwo')
          cy.get('[data-cy=ValidateTag]').click()
          // switch tab and come back
          cy.get('[data-cy=popin_right_part_timeline]').click()
          cy.get('[data-cy=popin_right_part_tag]').click()
        })

        it('should list the tags', () => {
          cy.get('[data-cy=tag_list] li').its('length').should('be.equal', 2)
          cy.get('[data-cy=tag_list]').first().should('contain', 'TagTwo')
        })

        it('clicking on a tag should uncheck it', () => {
          cy.get('[data-cy=tag_list] .checkboxCustom__checked').its('length').should('be.equal', 2)
          cy.get('[data-cy=tag_list] li label').first().click()
          cy.get('[data-cy=tag_list] .checkboxCustom__checked').its('length').should('be.equal', 1)
        })

        it('clicking on an unchecked tag should check it', () => {
          cy.get('[data-cy=tag_list] .checkboxCustom__checked').its('length').should('be.equal', 1)
          cy.get('[data-cy=tag_list] li label').first().click()
          cy.get('[data-cy=tag_list] .checkboxCustom__checked').its('length').should('be.equal', 2)
        })
      })
    }
  })
})
