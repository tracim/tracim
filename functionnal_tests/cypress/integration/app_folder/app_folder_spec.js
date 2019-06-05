import { PAGES } from '../../support/urls_commands.js'
import { SELECTORS as s } from '../../support/generic_selector_commands.js'

describe('App Folder Advanced', function () {
  let workspaceId
  let folder1 = {label: 'first Folder'}
  let folder2 = {label: 'second Folder'}

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id

      cy.visit(`/ui/workspaces/${workspace.workspace_id}/contents`)

      cy.createFolder(folder1.label, workspaceId).then(f => (folder1 = f))
      cy.createFolder(folder2.label, workspaceId).then(f => (folder2 = f))
    })
  })

  beforeEach(() => {
    cy.loginAs('administrators')
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  it('should open when editing a folder', () => {
    cy.visitPage({pageName: PAGES.CONTENTS, params: {workspaceId: workspaceId}})

    cy.getTag({selectorName: s.FOLDER_IN_LIST, params: {folderId: folder1.content_id}})
      .find('.extandedaction.dropdown')
      .click()

    cy.getTag({selectorName: s.FOLDER_IN_LIST, params: {folderId: folder1.content_id}})
      .find('.extandedaction.dropdown .fa.fa-pencil')
      .click()

    cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
      .should('be.visible')
  })

  it('should closed itself when clicking on the close button', () => {
    cy.visitPage({pageName: PAGES.EDIT_FOLDER, params: {workspaceId: workspaceId, folderId: folder1.content_id}})

    cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
      .find('.folderAdvanced__header__title')
      .contains(folder1.label)

    cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
      .find('[data-cy="popinFixed__header__button__close"]')
      .click()

    cy.get('#appFeatureContainer').children().should('have.length', 0)
  })

  it('should reopen and reload data when opening a different folder', () => {
    cy.visitPage({pageName: PAGES.EDIT_FOLDER, params: {workspaceId: workspaceId, folderId: folder1.content_id}})

    cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
      .find('.folderAdvanced__header__title')
      .contains(folder1.label)

    cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
      .find('[data-cy="popinFixed__header__button__close"]')
      .click()

    cy.getTag({selectorName: s.FOLDER_IN_LIST, params: {folderId: folder2.content_id}})
      .find('.extandedaction.dropdown')
      .click()

    cy.getTag({selectorName: s.FOLDER_IN_LIST, params: {folderId: folder2.content_id}})
      .find('.extandedaction.dropdown .fa.fa-pencil')
      .click()

    cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
      .find('.folderAdvanced__header__title')
      .should('contain', folder2.label)
  })
})
