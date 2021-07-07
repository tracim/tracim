import { PAGES } from '../../support/urls_commands'


describe('Create tags', () => {
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
        beforeEach(() => {
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
              cy.get('[data-cy=popin_right_part_tag]').click()
            } else {
              cy.createHtmlDocument('A note', workspaceId).then(({ content_id: contentId }) => {
                cy.visitPage({
                  pageName: PAGES.CONTENT_OPEN,
                  params: { workspaceId, contentType: 'html-document', contentId }
                })
                cy.waitForTinyMCELoaded()
                cy.typeInTinyMCE('Bar')
                cy.get('[data-cy=editionmode__button__submit]').click()
                cy.get('[data-cy=popin_right_part_tag]').click()
              })
            }
          })
        })

        afterEach(function () {
          cy.cancelXHR()
        })

        it('should create and add two tags', () => {
          cy.get('[data-cy=add_tag]').type('TagOne')
          cy.get('[data-cy=validate_tag]').click()
          cy.contains('.flashmessage__container__content__text__paragraph', 'Your tag has been added')
          cy.get('[data-cy=tag_list] li').should('have.length', 1)
          cy.get('[data-cy=add_tag]').type('TagTwo')
          cy.get('[data-cy=validate_tag]').click()
          cy.contains('.flashmessage__container__content__text__paragraph', 'Your tag has been added')
          cy.get('[data-cy=tag_list] li').should('have.length', 2)
        })

        it('should list the tags', () => {
          cy.get('[data-cy=add_tag]').type('TagOne')
          cy.get('[data-cy=validate_tag]').click()
          cy.contains('.flashmessage__container__content__text__paragraph', 'Your tag has been added')
          cy.get('[data-cy=tag_list] li').should('have.length', 1)
          cy.get('[data-cy=add_tag]').type('TagTwo')
          cy.get('[data-cy=validate_tag]').click()
          cy.contains('.flashmessage__container__content__text__paragraph', 'Your tag has been added')
          cy.get('[data-cy=tag_list] li').should('have.length', 2)
          // switch tab and come back
          cy.get('[data-cy=popin_right_part_timeline]').click()
          cy.get('[data-cy=popin_right_part_tag]').click()
          cy.get('[data-cy=tag_list] li').should('have.length', 2)
          cy.get('[data-cy=tag_list]').first().should('contain', 'TagTwo')
        })
      })
    }
  })
})
