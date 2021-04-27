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

  it('should be able to fold child space', function () {
    cy.get('[data-cy="sidebar__content__navigation__workspace__item_2"]')
      .should('be.visible')
    cy.get('[data-cy="sidebar__content__navigation__workspace__item_1"]')
      .should('be.visible')
      .get('.fa-caret-down')
      .should('be.visible')
      .click()
      .get('.fa-caret-right')
      .should('be.visible')
    cy.get('[data-cy="sidebar__content__navigation__workspace__item_2"]')
      .should('not.be.visible')
  })
})
