import { SELECTORS as s } from '../../support/generic_selector_commands'
import baseUser from '../../fixtures/baseUser.json'
import { PAGES as p } from '../../support/urls_commands'


describe('Account page', () => {
  beforeEach(() => {
    cy.cancelXHR()
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.visitPage({ pageName: p.ACCOUNT })
    cy.log('Todo must be reworked')
  })

  const createOneSpace = (cy, spaceName) => {
    cy.get('[data-cy=sidebarCreateWorkspaceBtn]')
      .click()
    cy.get('.newSpace__input').should('be.visible').type(spaceName)
    // NOTE - MP - 2021-11-17 - Select space type
    cy.get('.singleChoiceList__item').first().should('be.visible').click()
    cy.get('.newSpace__button .btn').should('be.visible').click()

    // NOTE - MP - 2021-11-17 - Wait for the other part of the popup to load
    cy.get('.newSpace__button .btn').should('have.length', 2)

    // NOTE - MP - 2021-11-17 - Select default role
    cy.get('.singleChoiceList__item').first().should('be.visible').click()
    cy.get('.newSpace__button .btn').last().should('be.visible').click()
  }

  describe('Changing account preferences', () => {
    describe('Manage user space popup', () => {
      it('Open the popup', () => {
        createOneSpace(cy, 'newSpaceName')
        cy.visitPage({ pageName: p.ADMIN_USER })
        cy.get('.adminUser__table__tr__td-link').last()
          .click()
        cy.get('[data-cy=menusubcomponent__list__spacesConfig]').should('be.visible').click()
          .click()
        cy.get('.iconbutton__text_with_icon').contains('Manage user spaces')
          .click()
        it('R user to a space', () => {
          cy.get('.fa-fw fas fa-sign-in-alt iconbutton__icon').first() // WIP, find a way to select the buttons to add user to space
          .click()
        })
      })
    })
  })
})
