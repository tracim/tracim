import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'
import defaultAdmin from '../../fixtures/defaultAdmin.json'
import baseUser from '../../fixtures/baseUser.json'

describe("An admin seeing a user's profile", () => {
  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
    cy.visitPage({ pageName: PAGES.ADMIN_USER, params: { userId: baseUser.user_id } })
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  describe('Account header', () => {
    it('Title and userpreference should be visible', () => {
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.account__title')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.account__userpreference')
        .should('be.visible')
    })

    it('User info should be visible', () => {
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=userinfo]')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=userinfo__name]')
        .should('be.visible')
        .contains(baseUser.public_name)
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=userinfo__email]')
        .should('be.visible')
        .contains(baseUser.email)
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=avatar]')
        .should('be.visible')
    })
  })

  describe('Changing his account preferences', () => {
    describe('Change full name', () => {
      it('should update the header with the new full name', () => {
        const newFullName = 'newRandomFullName'
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=menusubcomponent__list__personalData] > .menusubcomponent__list__item__link')
          .click()
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=personaldata__form__txtinput__fullname]')
          .type(newFullName)
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('.personaldata__form__button')
          .click()
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=userinfo__name]')
          .contains(newFullName)
      })
    })

    describe('Change email', () => {
      it('should update the header with the new email', () => {
        const newRandomEmail = 'newrandomemail@random.fr'
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=menusubcomponent__list__personalData] > .menusubcomponent__list__item__link')
          .click()
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=personaldata__form__txtinput__email]')
          .type(newRandomEmail)
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('.personaldata__form__txtinput.checkPassword')
          .type(defaultAdmin.password)
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('.personaldata__form__button')
          .click()
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=userinfo__email]')
          .should('have.attr', 'href').and('include', newRandomEmail)
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=userinfo__email]')
          .contains(newRandomEmail)
      })
    })

    describe('Change username', () => {
      const newUserName = 'newRandomUsername'
      const longNewUsername = 'aa'.repeat(200)

      it('should show error message when username is too long', () => {
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=menusubcomponent__list__personalData] > .menusubcomponent__list__item__link')
          .click()
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=personaldata__form__txtinput__username]')
          .type(longNewUsername)
        cy.get('.personaldata__form__txtinput__msgerror')
          .should('be.visible')
      })

      it('should update the header with the new username', () => {
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=menusubcomponent__list__personalData] > .menusubcomponent__list__item__link')
          .click()
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=personaldata__form__txtinput__username]')
          .type(newUserName)
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('.personaldata__form__txtinput.checkPassword')
          .type(defaultAdmin.password)
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('.fa-exclamation-triangle.personaldata__form__txtinput__info__icon')
          .should('be.visible')
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('.personaldata__form__button')
          .click()
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=userinfo__username]')
          .contains(newUserName)
      })

      it('should show the allowed characters list', () => {
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=menusubcomponent__list__personalData] > .menusubcomponent__list__item__link')
          .click()
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=personaldata__form__txtinput__username]')
          .type(newUserName)
        cy.get('.personaldata__form__txtinput__msginfo')
          .should('be.visible')
      })
    })
  })
})
