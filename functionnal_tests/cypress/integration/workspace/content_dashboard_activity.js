describe('content :: workspace > dashbord', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(function () {
    cy.loginAs('administrators')
    cy.create_thread()
    cy.visit('/ui/workspaces/1/dashboard')
  })

  it('dashboard__workspaceInfo > activity', function () {
    cy.get('.activity .activity__header__title').should('be.visible')
    cy.get('.activity .activity__header__allread').should('be.visible')
    cy.get('.activity .activity__wrapper').should('be.visible')
    cy.get('.activity .activity__wrapper .activity__empty').should('be.visible')
    cy.get('.activity .activity__wrapper button.activity__more__btn').should('be.visible')
  })
})
