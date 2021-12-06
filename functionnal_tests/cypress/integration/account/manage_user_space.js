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
    cy.visitPage({ pageName: p.ACCOUNT })
    cy.get('[data-cy=sidebarCreateWorkspaceBtn]')
      .should('be.visible')
      .click()
    cy.contains('.cardPopup__header__title', 'New space')
    cy.get('.newSpace__input').should('be.visible').type(spaceName)
    // INFO - MP - 2021-11-17 - Select space type
    cy.get('.singleChoiceList__item').first().should('be.visible').click()
    cy.get('.newSpace__button .btn').should('be.visible').click()

    // INFO - MP - 2021-11-17 - Wait for the other part of the popup to load
    cy.get('.newSpace__button .btn').should('have.length', 2)

    // INFO - MP - 2021-11-17 - Select default role
    cy.get('.singleChoiceList__item').first().should('be.visible').click()
    cy.get('.newSpace__button .btn').last().should('be.visible').click()
  }

  describe('Changing account preferences', () => {
    describe('Manage user space popup', () => {
      it('Open the popup', () => {
        createOneSpace(cy, 'newSpaceName')
        createOneSpace(cy, 'newSpaceName2')
        createOneSpace(cy, 'newSpaceName3')

        cy.visitPage({ pageName: p.ADMIN_USER })
        cy.get('.adminUser__table__tr__td-link').last()
          .click()
        cy.get('[data-cy=menusubcomponent__list__spacesConfig]').should('be.visible').click()
          .click()
        cy.get('.iconbutton__text_with_icon').contains('Manage user spaces')
          .click()

        // add user to a space
        cy.get('[data-cy=spaceconfig__add_to_space]').first()
          .click()
        cy.get('[data-cy=spaceconfig__add_to_space]').should('have.length', 3)

        // remove user from a space
        cy.get('[data-cy=spaceconfig__remove_from_space]').first()
          .click()
        cy.get('[data-cy=spaceconfig__remove_from_space]').should('have.length', 1)

        // filter spaces
        cy.get('.textinput__text.form-control').first().should('be.visible').type('2')
        cy.get('[data-cy=spaceconfig__add_to_space]').should('have.length', 1)

        // change role of a member
        cy.get('.dropdownMenuButton').contains('Space manager')
          .click()
        cy.get('.transparentButton').contains('Content manager')
          .click()
        cy.get('.dropdownMenuButton').contains('Content manager')

        // close popup
        cy.get('.cardPopup__header__close')
          .click()

        // change language
        cy.changeLanguage('de')
        cy.get('.iconbutton__text_with_icon').contains('Verwalten von Benutzerbereichen')
          .click()
        cy.get('.cardPopup__header__title').contains('Bereichsmanagement für den Benutzer John Doe')
      })
    })
  })
})
