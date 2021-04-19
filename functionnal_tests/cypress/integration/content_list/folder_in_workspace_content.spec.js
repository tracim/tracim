import { PAGES } from '../../support/urls_commands.js'
import { SELECTORS as s } from '../../support/generic_selector_commands.js'

describe('Folder in workspace content list', function () {
  let workspaceId
  let folder1 = { label: 'first Folder' }

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
      cy.createFolder(folder1.label, workspaceId).then(f => (folder1 = f))
    })
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  describe('Ctrl+click a folder', () => {
    it('should open a new tab with the correct url', () => {
      cy.visitPage({ pageName: PAGES.CONTENTS, params: { workspaceId: workspaceId } })

      cy.window().then((win) => {
        cy.stub(win, 'open').as('windowOpen')
      })

      // INFO - GM - 2020/04/15 - Press the ctrl key to enable ctrl+click
      cy.get('body')
        .type('{ctrl}', { release: false })
      cy.getTag({ selectorName: s.FOLDER_IN_LIST, params: { folderId: folder1.content_id } })
        .find('.folder__header')
        .click('left')

      cy.get('@windowOpen')
        .should('be.calledWith', `/ui/workspaces/${workspaceId}/contents/?folder_open=${folder1.content_id}`)
    })
  })
})
