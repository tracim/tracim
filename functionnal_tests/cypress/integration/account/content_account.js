describe('content :: account', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(() => {
    cy.loginAs('users')
    cy.visit('/ui/account')
    cy.log('Todo must be reworked')
  })

  it('content :: account exist', () => {
    cy.get('.account__title').should('be.visible')
    cy.get('[data-cy=userinfo]').should('be.visible')
    cy.get('.account__userpreference').should('be.visible')
  })
  it('Checks if user info are visible', () => {
    //        account__userinformation
    cy.get('[data-cy=userinfo]').should('be.visible')
    cy.get('[data-cy=userinfo__name').should('be.visible')
    cy.get('[data-cy=userinfo__email').should('be.visible')
    cy.get('[data-cy=avatar]').should('be.visible')
  })
  it('Checks if menu if visible', () => {
    //        account userpreference menu
    cy.get('.menusubcomponent__list').should('be.visible')
    cy.get('[data-cy=menusubcomponent__list__personalData]').should('be.visible')
    cy.get('[data-cy=menusubcomponent__list__password]').should('be.visible')
    cy.get(':nth-child(3) > .menusubcomponent__list__item__link').should('not.exist')
  })
  it('content :: account > profile ', () => {
    //        account userpreference profile
    cy.get('[data-cy=menusubcomponent__list__personalData] > .menusubcomponent__list__item__link').click()
    cy.get('.personaldata__sectiontitle').should('be.visible')
    cy.get('.personaldata__form div:nth-child(1) > .personaldata__form__txtinput').should('be.visible')
    cy.get('.personaldata__form div:nth-child(1) > .personaldata__form__txtinput').should('have.attr', 'placeholder')
    cy.get('.personaldata__form div:nth-child(2) > .personaldata__form__txtinput.withAdminMsg').should('be.visible')
    cy.get('.personaldata__form div:nth-child(2) > .personaldata__form__txtinput.withAdminMsg').should('have.attr', 'placeholder')
    cy.get('.personaldata__form div:nth-child(3) > .personaldata__form__txtinput.checkPassword').should('not.exist')
    cy.get('.personaldata__form .personaldata__form__button').should('be.visible')
    cy.get('.personaldata__form .personaldata__form__button').should('have.attr', 'type', 'button')
  })
  it('content :: account > password ', () => {
    //        account userpreference password
    cy.get('[data-cy=menusubcomponent__list__password] > .menusubcomponent__list__item__link').click()
    cy.get('.personaldata__sectiontitle').should('be.visible')
    cy.get('.mr-5 div:nth-child(1) > .personaldata__form__txtinput').should('be.visible')
    cy.get('.mr-5 div:nth-child(1) > .personaldata__form__txtinput').should('have.attr', 'placeholder')
    cy.get('.mr-5 div:nth-child(2) > .personaldata__form__txtinput').should('be.visible')
    cy.get('.mr-5 div:nth-child(2) > .personaldata__form__txtinput').should('have.attr', 'placeholder')
    cy.get('.mr-5 div:nth-child(3) > .personaldata__form__txtinput').should('be.visible')
    cy.get('.mr-5 div:nth-child(3) > .personaldata__form__txtinput').should('have.attr', 'placeholder')
    cy.get('.mr-5 .personaldata__form__button').should('be.visible')
    cy.get('.mr-5 .personaldata__form__button').should('have.attr', 'type', 'button')
  })
})
