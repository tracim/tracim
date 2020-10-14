import { PAGES as p } from '../../support/urls_commands.js'

describe('Sidebar', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.createWorkspace('baseChildWorkspace')
  })

  beforeEach(function () {
    cy.visitPage({
      pageName: p.HOME
    })
  })

  it('should display the child space with a ∟ before its label', function () {
    cy.get('[data-cy="sidebar__content__navigation__workspace__item_2"]').should('be.visible')
    cy.contains('[data-cy="sidebar__content__navigation__workspace__item_2"]', '∟').should('be.visible')
  })
})
