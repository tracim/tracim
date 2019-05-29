
describe('App Agenda', () => {
  let workspaceId

  before(function () {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.fixture('baseWorkspace').as('workspace').then(workspace => {
      workspaceId = workspace.workspace_id
    })
  })

  describe('Switching from app agenda of different workspace', () => {
    it('Should reload the iframe with the proper workspace id', () => {
      // cy.visit(PAGE.WORKSPACE.AGENDA(workspaceId))
    })
  })
})
