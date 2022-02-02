import { PAGES as p } from '../../support/urls_commands'


describe('Account page', () => {
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

  describe.skip('Changing account preferences', () => {
  // FIXME - MB - 2022-02-02 - Unstable test, see https://github.com/tracim/tracim/issues/5344
    describe('Manage user space popup', () => {
      beforeEach(() => {
        cy.cancelXHR()
        cy.resetDB()
        cy.setupBaseDB()
        cy.loginAs('administrators')
        createOneSpace(cy, 'newSpaceName')
        createOneSpace(cy, 'newSpaceName2')
        createOneSpace(cy, 'newSpaceName3')
        cy.visitPage({ pageName: p.ADMIN_USER })
        cy.contains('.adminUser__table__tr__td-link', 'John Doe').click()
        cy.get('[data-cy=menusubcomponent__list__spacesConfig]')
          .should('be.visible')
          .click()
        cy.contains('.iconbutton__text_with_icon', 'Manage user spaces')
          .click()
      })

      it('Add and remove user from space', () => {
        // add user to a space
        cy.get('[data-cy=spaceconfig__add_to_space]').first()
          .click()
        cy.get('[data-cy=spaceconfig__add_to_space]').should('have.length', 3)

        // remove user from a space
        cy.get('[data-cy=spaceconfig__remove_from_space]').first()
          .click()
      })

      it('Filter spaces', () => {
        cy.get('.textinput__text.form-control').first().should('be.visible').type('2')
        cy.get('[data-cy=spaceconfig__add_to_space]').should('have.length', 2)
      })

      it('Change role of a member, close popup', () => {
        cy.contains('.dropdownMenuButton', 'Contributor')
          .click()
        cy.contains('.transparentButton', 'Content manager')
          .click()
        cy.contains('.dropdownMenuButton', 'Content manager')
        cy.get('.cardPopup__header__close')
          .click()
      })
    })
  })
})
