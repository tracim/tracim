describe('content :: admin > workspace', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.visit('/ui/admin/workspace')
  })
  it('checks the visibility of crucial elements', function () {
    cy.get('.adminWorkspace__description').should('be.visible')
    cy.get('.adminWorkspace__delimiter').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable').should('be.visible')
    // TODO - BL - 2018/12/13 - Check why next test randomly cannot load
    // homepage if we remove wait.
    cy.wait(2000)
  })
  it('content of workspaceTable', function () {
    cy.get('.adminWorkspace__workspaceTable th:nth-child(1)[scope="col"]').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable th:nth-child(2)[scope="col"]').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable th:nth-child(3)[scope="col"]').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable th:nth-child(4)[scope="col"]').should('be.visible')
    cy.get('.adminWorkspace__workspaceTable th:nth-child(5)[scope="col"]').should('be.visible')
  })
})
