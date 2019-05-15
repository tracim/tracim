// Not connected
describe('App Folder Advanced', function () {
  beforeEach(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy
      .fixture('baseWorkspace').as('workspace').then(workspace => {
      cy.visit(`/ui/workspaces/${workspace.workspace_id}/contents`)
    })
  })

   it ('should open when editing a folder', function () {

   })
})
