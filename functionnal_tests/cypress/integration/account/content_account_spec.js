import { PAGES } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'
import baseUser from '../../fixtures/baseUser.json'

describe('Account page', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(() => {
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.ACCOUNT })
    cy.log('Todo must be reworked')
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

  describe('Account Preferences', () => {
    it('Menu should be visible', () => {
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.menusubcomponent__list')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=menusubcomponent__list__personalData]')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=menusubcomponent__list__password]')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=menusubcomponent__list__agenda]')
        .should('be.visible')
    })
    it('Profile fields should be visible', () => {
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=menusubcomponent__list__personalData] > .menusubcomponent__list__item__link')
        .click()
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.personaldata__sectiontitle')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=personaldata__form__txtinput__fullname]')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=personaldata__form__txtinput__fullname]')
        .should('have.attr', 'placeholder')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=personaldata__form__txtinput__username]')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=personaldata__form__txtinput__username]')
        .should('have.attr', 'placeholder')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=personaldata__form__txtinput__email]')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=personaldata__form__txtinput__email]')
        .should('have.attr', 'placeholder')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.personaldata__form div:nth-child(4) > .personaldata__form__txtinput.checkPassword')
        .should('not.exist')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.personaldata__form .personaldata__form__button')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.personaldata__form .personaldata__form__button')
        .should('have.attr', 'type', 'button')
    })
    it('Password fields should be visible', () => {
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=menusubcomponent__list__password] > .menusubcomponent__list__item__link')
        .click()
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.personaldata__sectiontitle')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.mr-5 div:nth-child(1) > .personaldata__form__txtinput')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.mr-5 div:nth-child(1) > .personaldata__form__txtinput')
        .should('have.attr', 'placeholder')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.mr-5 div:nth-child(2) > .personaldata__form__txtinput')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.mr-5 div:nth-child(2) > .personaldata__form__txtinput')
        .should('have.attr', 'placeholder')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.mr-5 div:nth-child(3) > .personaldata__form__txtinput')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.mr-5 div:nth-child(3) > .personaldata__form__txtinput')
        .should('have.attr', 'placeholder')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.mr-5 .personaldata__form__button')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.mr-5 .personaldata__form__button')
        .should('have.attr', 'type', 'button')
    })
    it('Agenda field should be visible', () => {
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=menusubcomponent__list__agenda]')
        .click()
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.agendaInfo__content__link__url')
        .click()
    })
  })
  describe('Changing account preferences', () => {
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
          .type(baseUser.password)
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
      it('should update the header with the new username', () => {
        const newUserName = 'newRandomUserName'
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=menusubcomponent__list__personalData] > .menusubcomponent__list__item__link')
          .click()
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=personaldata__form__txtinput__username]')
          .type(newUserName)
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('.personaldata__form__txtinput.checkPassword')
          .type(baseUser.password)
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('.personaldata__form__txtinput__msgerror')
          .should('be.visible')
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('.personaldata__form__button')
          .click()
        // TODO Add verification on the username in header to test if it works when the full feature is ready
      })
    })
  })
})
