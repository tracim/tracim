import {
  create_folder,
  open_app_advanced_folder
} from '../helpers/folder.js'

describe('App Folder Advanced', function () {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visit(`/ui/workspaces/${workspace.workspace_id}/contents`)
    })
  })

  it('should open when editing a folder', () => {
    create_folder(cy)
    open_app_advanced_folder(cy)

    cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
      .should('be.visible')
  })

  it('should closed itself when clicking on the close button', () => {
    create_folder(cy)
    open_app_advanced_folder(cy)

    cy.get('[data-cy=popinFixed__header__button__close]')
      .should('be.visible')
      .click()

    cy.get('#appFeatureContainer').children().should('have.length', 0)
  })
})
