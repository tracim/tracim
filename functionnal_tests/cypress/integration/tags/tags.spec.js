import { PAGES } from '../../support/urls_commands'


describe.skip('Create tags', () => {
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

        after(cy.cancelXHR)

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
