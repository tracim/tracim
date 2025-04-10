import { PAGES } from '../../support/urls_commands.js'
import { SELECTORS as s } from '../../support/generic_selector_commands.js'

describe('App Folder Advanced', function () {
  let workspaceId
  let folder1 = { label: 'first Folder' }
  let folder2 = { label: 'second Folder' }

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

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('App folder navigation tests', () => {
    it('should open when editing a folder', () => {
      cy.loginAs('administrators')
      cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })

      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder1.content_id } })
        .find('[data-cy="extended_action"]')
        .click()

      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder1.content_id } })
        .find('[data-cy="extended_action_edit"]')
        .click()

      cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
        .should('be.visible')
    })

    it('should close itself when clicking on the close button', () => {
      cy.loginAs('administrators')
      cy.visitPage({ pageName: PAGES.EDIT_FOLDER, params: { workspaceId: workspaceId, folderId: folder1.content_id } })

      cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
        .find('.folderAdvanced__header__title')
        .contains(folder1.label)

      cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
        .find('[data-cy="popinFixed__header__button__close"]')
        .click()

      cy.get('#appFeatureContainer').children().should('have.length', 0)
    })

    it('should reopen itself after being closed', () => {
      cy.loginAs('administrators')
      cy.visitPage({ pageName: PAGES.EDIT_FOLDER, params: { workspaceId: workspaceId, folderId: folder1.content_id } })

      cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
        .find('[data-cy="popinFixed__header__button__close"]')
        .click()

      cy.get('#appFeatureContainer').children().should('have.length', 0)

      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder1.content_id } })
        .find('[data-cy="extended_action"]')
        .click()

      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder1.content_id } })
        .find('[data-cy="extended_action_edit"]')
        .click()

      cy.get('#appFeatureContainer').children().should('have.length', 1)
      cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
        .find('.folderAdvanced__header__title')
        .contains(folder1.label)
    })

    it('should reopen and reload data when opening a different folder', () => {
      cy.loginAs('administrators')
      cy.visitPage({ pageName: PAGES.EDIT_FOLDER, params: { workspaceId: workspaceId, folderId: folder1.content_id } })

      cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
        .find('.folderAdvanced__header__title')
        .contains(folder1.label)

      cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
        .find('[data-cy="popinFixed__header__button__close"]')
        .click()

      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder2.content_id } })
        .find('[data-cy="extended_action"]')
        .click()

      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder2.content_id } })
        .find('[data-cy="extended_action_edit"]')
        .click()

      cy.get('#appFeatureContainer > [data-cy=popinFixed].folder_advanced')
        .find('.folderAdvanced__header__title')
        .should('contain', folder2.label)
    })

    it('should update itself if the folder is modified', () => {
      cy.loginAs('administrators')
      cy.visitPage({ pageName: PAGES.EDIT_FOLDER, params: { workspaceId: workspaceId, folderId: folder1.content_id } })
      cy.request(
        'PUT',
        `api/workspaces/${workspaceId}/folders/${folder1.content_id}`,
        { label: 'Modified folder', sub_content_types: ['html-document'], raw_content: '' }
      )
      cy.get('.folder_advanced__content__form__type > .checked').its('length').should('eq', 1)
    })

    it('should show the "folder is deleted" box if the folder is deleted', () => {
      cy.loginAs('administrators')
      cy.visitPage({ pageName: PAGES.EDIT_FOLDER, params: { workspaceId: workspaceId, folderId: folder1.content_id } })
      cy.request('PUT', `api/workspaces/${workspaceId}/contents/${folder1.content_id}/trashed`)
      cy.get('.folder_advanced__content__state').should('be.visible')
    })
  })

  describe('Role permissions test', () => {
    let userReader

    before(() => {
      cy.loginAs('administrators')
      cy.createRandomUser().as('userReader')
        .then(user => {
          userReader = user
          cy.addUserToWorkspace(user.user_id, workspaceId, 'reader')
        })
    })

    it('should not be able to edit file and folder if the user is only a reader', () => {
      cy.login(userReader)
      cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })

      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder2.content_id } })
        .find('[data-cy="extended_action"]')
        .click()

      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder2.content_id } })
        .find('[data-cy="extended_action_edit"]')
        .should('not.exist')
    })
  })
})
