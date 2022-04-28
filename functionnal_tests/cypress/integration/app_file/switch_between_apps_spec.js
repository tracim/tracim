import { SELECTORS as s, formatTag } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands.js'

describe('App File', () => {
  const fileTitle_1 = 'file-1'
  const fileTitle_2 = 'file-2'
  const fullFilename_1 = 'Linux-Free-PNG.png'
  const fullFilename_2 = 'artikodin.png'
  const fullFilename_3 = 'newname'
  const contentType = 'image/png'
  const comment = "This is a comment"
  let workspaceId
  let secondContentId

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')

    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFile(fullFilename_1, contentType, fileTitle_1, workspace.workspace_id)

      cy.createFile(fullFilename_2, contentType, fileTitle_2, workspaceId)
        .then(newContent => {
          secondContentId = newContent.content_id
          cy.updateFile(fullFilename_2, contentType, workspaceId, newContent.content_id, newContent.filename)
            .then(() => {
              cy.updateFile(fullFilename_2, contentType, workspaceId, newContent.content_id, fullFilename_3)
            })
        })
    })
  })

  afterEach(() => cy.cancelXHR())

  describe('Switching between 2 content type Files', () => {
    describe('While being in the app', () => {
      it('should write a comment and check if it is there after switching apps, as well as the revisions', () => {
        cy.visitPage({
          pageName: p.CONTENT_OPEN,
          params: { contentId: secondContentId }
        })

        cy.contains('.wsContentGeneric__header__titleWrapper', fullFilename_3)

        cy.get('[data-cy="revision_data_1"]').should('be.visible')
        cy.get('[data-cy="revision_data_4"]').should('be.visible')

        cy.get('.commentArea__textinput').type(comment)
        cy.get('[data-cy="commentArea__comment__send"').click()

        // INFO - MB - 2021-11-18 - Switching to another file app
        cy.get('.file__contentpage__header__close')
          .click()
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fileTitle_1 } })
          .click()

        cy.get('[data-cy="popinFixed"]')
          .should('be.visible')
        cy.getTag({ selectorName: s.SIDEBAR_ARROW })
          .click()

        // INFO - MB - 2021-11-18 - Switching again
        cy.get('.file__contentpage__header__close')
          .click()
        cy.getTag({ selectorName: s.CONTENT_IN_LIST, attrs: { title: fullFilename_3 } })
          .click()

        cy.contains('.breadcrumbs__item', fullFilename_3)
        cy.get('[data-cy="revision_data_1"]').should('be.visible')
        cy.get('[data-cy="revision_data_4"]').should('be.visible')
        cy.get('.comment__body__content__text').contains(comment)
      })
    })
  })
})
