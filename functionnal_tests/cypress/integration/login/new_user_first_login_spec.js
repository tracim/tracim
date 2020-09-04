import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

const email = 'email@email.email'
const password = 'password'

describe('First login with a new user', function () {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('administrators')
  })

  afterEach(function () {
    cy.cancelXHR()
  })

  it('should redirect to the homepage', function () {
    this.skip() // FIXME - GB - 2020-09-03 - this tests is unstable and it will be fixed at https://github.com/tracim/tracim/issues/3483
    cy.visitPage({ pageName: p.ADMIN_USER })
    cy.get('.adminUser__adduser__button').click()
    cy.get('[data-cy=adduser_name]').type('name')
    cy.get('[data-cy=adduser_email]').type(email)
    cy.get('[data-cy=adduser_password]').type(password)
    cy.get('[data-cy=profile__list__item__administrators]').click()
    cy.get('[data-cy=adminUser__adduser__form__submit]').click()
    cy.get('[data-cy=menuprofil__dropdown__button]').click()
    cy.get('[data-cy=menuprofil__dropdown__logout__link]').click()
    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD }).find('input[type=text]').type(email)
    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD }).find('input[type=password]').type(password)
    cy.get('.loginpage__card__form__btnsubmit').click()
    cy.url().should('include', '/ui')
    cy.get('.homepagecard__title').should('be.visible')
  })
})
