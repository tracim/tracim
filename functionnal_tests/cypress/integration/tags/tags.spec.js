import { PAGES } from '../../support/urls_commands'


describe('Create tags', () => {
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
          cy.resetDB()
          cy.setupBaseDB()
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
                cy.waitForTinyMCELoaded()
                cy.typeInTinyMCE('Bar')
                cy.get('[data-cy=editionmode__button__submit]').click()
              })
            }
          })
        })

        after(cy.cancelXHR)

        it('should create two tags', () => {
          cy.loginAs('administrators')
          cy.get('[data-cy=popin_right_part_tag]').click()
          cy.get('[data-cy=tag_list__btn_add]').click()
          cy.get('[data-cy=add_tag]').type('TagOne')
          cy.get('[data-cy=validate_tag]').click()
          cy.get('[data-cy=tag_list] li').should('have.length', 1)
          cy.get('[data-cy=add_tag]').type('TagTwo')
          cy.get('[data-cy=validate_tag]').click()
          cy.get('[data-cy=tag_list] li').should('have.length', 2)
        })

        it('should list the tags', () => {
          cy.loginAs('administrators')
          // switch tab and come back
          cy.get('[data-cy=popin_right_part_timeline]').click()
          cy.get('[data-cy=popin_right_part_tag]').click()
          cy.get('[data-cy=tag_list] li').should('have.length', 2)
          cy.get('[data-cy=tag_list]').first().should('contain', 'TagTwo')
        })

        it('clicking on a tag should uncheck it', () => {
          cy.loginAs('administrators')
          cy.get('[data-cy=tag_list] .checkboxCustom__checked').should('have.length', 2)
          cy.get('[data-cy=tag_list] .checkboxCustom__checked').first().click()
          cy.get('[data-cy=tag_list] .checkboxCustom__checked').should('have.length', 1)
        })

        it('clicking on an unchecked tag should check it', () => {
          cy.loginAs('administrators')
          cy.get('[data-cy=tag_list] li').should('have.length', 2)
          cy.get('[data-cy=tag_list] li label').first().click()
          cy.get('[data-cy=tag_list] li').should('have.length', 2)
        })
      })
    }
  })
})
