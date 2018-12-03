describe('content :: account', () => {
  before(() => {
    cy.resetDB()
    cy.setupBaseDB()
  })

  beforeEach(() => {
    cy.login('users')
    cy.visit('/ui/account')
  })

  it('content :: account exist', () => {
    cy.get('.account__title').should('be.visible')
    cy.get('.userinfo').should('be.visible')
    cy.get('.account__userpreference').should('be.visible')
  })
  it('content :: account > resume', () => {
    //        account__userinformation
    cy.get('.userinfo').should('be.visible')
    cy.get('.userinfo__name').should('be.visible')
    cy.get('.userinfo__email').should('be.visible')
    cy.get('.userinfo__avatar .avatar').should('be.visible')
  })
  it('content :: account > menu', () => {
    //        account userpreference menu
    cy.get('.menusubcomponent__list').should('be.visible')
    cy.get(':nth-child(1) > .menusubcomponent__list__item__link').should('be.visible')
    cy.get(':nth-child(2) > .menusubcomponent__list__item__link').should('be.visible')
    // @philippe 03/12/2018 notification not visible if email not activated
    // cy.get(':nth-child(3) > .menusubcomponent__list__item__link').should('be.visible')
    // @philippe 26/09/2018 timezone deactivated
    // cy.get(':nth-child(4) > .menusubcomponent__list__item__link').should('be.visible')
  })
  it('content :: account > profile ', () => {
    //        account userpreference profile
    cy.get(':nth-child(1) > .menusubcomponent__list__item__link').click()
    cy.get('.personaldata__sectiontitle').should('be.visible')
    cy.get('.personaldata__form div:nth-child(1) > .personaldata__form__txtinput').should('be.visible')
    cy.get('.personaldata__form div:nth-child(1) > .personaldata__form__txtinput').should('have.attr', 'placeholder')
    cy.get('.personaldata__form div:nth-child(2) > .personaldata__form__txtinput.withAdminMsg').should('be.visible')
    cy.get('.personaldata__form div:nth-child(2) > .personaldata__form__txtinput.withAdminMsg').should('have.attr', 'placeholder')
    cy.get('.personaldata__form div:nth-child(3) > .personaldata__form__txtinput.checkPassword').should('be.visible')
    cy.get('.personaldata__form div:nth-child(3) > .personaldata__form__txtinput.checkPassword').should('have.attr', 'placeholder')
    cy.get('.personaldata__form .personaldata__form__button').should('be.visible')
    cy.get('.personaldata__form .personaldata__form__button').should('have.attr', 'type', 'button')
  })
  it('content :: account > password ', () => {
    //        account userpreference password
    cy.get(':nth-child(2) > .menusubcomponent__list__item__link').click()
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
  //    @philippe 26/09/2018 timezone deactivated
  //    it('content :: account > timezone ', function() {
  //        // account userpreference timezone
  //        cy.get(':nth-child(4) > .menusubcomponent__list__item__link').click()
  //        cy.get('.timezone__title').should('be.visible')
  //        cy.get('#react-select-2--value .Select-placeholder').should('be.visible')
  //    })
  //    Not in Tracim_V2.0*/
  //    it('content :: account > calendar ', function() {
  //        // account userpreference personal calendar
  //        cy.get(':nth-child(7) > .menusubcomponent__list__item__link').click()
  //        cy.get('.account__userpreference__setting__calendar').should('be.visible')
  //        cy.get('.calendar__title.subTitle').should('be.visible')
  //        cy.get('.calendar__title').should('be.visible')
  //        cy.get('.calendar__link').should('be.visible')
  //    })
})
