import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('Login after a disconnection ', function () {
  const login = 'admin@admin.admin'
  const public_name = 'test'
  const username = 'test'
  const email = 'test@test.test'
  const pwd = 'testPwd'

  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.visitPage({ pageName: p.LOGIN, params: { loginParam: '?dc=1' }, waitForTlm: false })

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('input[type=text]')
      .type(login)

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('input[type=password]')
      .type(login)

    cy.getTag({ selectorName: s.LOGIN_PAGE_CARD })
      .find('.loginpage__card__form__btnsubmit')
      .click()
  })

  it('should able to add user', function () {
    cy.getTag({ selectorName: s.HEADER })
      .get('[data-cy=adminlink__dropdown__btn]')
      .should('be.visible')
      .click()

    cy.getTag({ selectorName: s.HEADER })
      .find('[data-cy=adminlink__user__link]')
      .click()

    cy.getTag({ selectorName: s.ADMIN_USER_PAGE })
      .find('.adminUser__adduser__button')
      .click()

    cy.getTag({ selectorName: s.ADMIN_USER_PAGE })
      .find('[data-cy=adduser_name]')
      .type(public_name)

    cy.getTag({ selectorName: s.ADMIN_USER_PAGE })
      .find('[data-cy=adduser_username]')
      .type(username)

    cy.getTag({ selectorName: s.ADMIN_USER_PAGE })
      .find('[data-cy=adduser_email]')
      .type(email)

    cy.getTag({ selectorName: s.ADMIN_USER_PAGE })
      .find('[data-cy=adduser_password]')
      .type(pwd)

    cy.getTag({ selectorName: s.ADMIN_USER_PAGE })
      .find('[data-cy=profile__list__item__administrators]')
      .click()

    cy.getTag({ selectorName: s.ADMIN_USER_PAGE })
      .find('[data-cy="adminUser__adduser__form__submit"]')
      .click()

    cy.get('[data-cy=flashmessage]')
      .contains('User created')

    cy.get('[data-cy=adminUser__adduser__form]')
      .should('not.exist')

    cy.contains(public_name)
    cy.contains(username)
    cy.contains(email)
  })
})
