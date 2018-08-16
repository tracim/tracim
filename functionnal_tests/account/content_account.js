describe('content :: account', function () {
    before(function () {
        //login
        cy.visit('/login')
        cy.get('input[type=email]').type('admin@admin.admin')
        cy.get('input[type=password]').type('admin@admin.admin')
        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
        cy.get('#dropdownMenuButton').click()
        cy.get('a.setting__link[href="/account"]').click()
    })
    it('content :: account exist', function () {
        // account__title
        cy.get('.account__title').should('be.visible')
        // account__userinformation
        cy.get('.account__userinformation').should('be.visible')
        // account__userpreference
        cy.get('.account__userpreference').should('be.visible')
    })
    it('content :: account > resume', function () {
        // account__userinformation
        cy.get('.account__userinformation').should('be.visible')
        cy.get('.account__userinformation__name').should('be.visible')
        cy.get('.account__userinformation__email').should('be.visible')
        cy.get('.account__userinformation__avatar > img').should('be.visible')
    })
    it('content :: account > menu', function() {
        // account userpreference menu
        cy.get('.account__userpreference__menu__list__disabled').should('be.visible')
        cy.get(':nth-child(3) > .account__userpreference__menu__list__item__link').should('be.visible')
        cy.get(':nth-child(4) > .account__userpreference__menu__list__item__link').should('be.visible')
        cy.get(':nth-child(5) > .account__userpreference__menu__list__item__link').should('be.visible')
        cy.get(':nth-child(6) > .account__userpreference__menu__list__item__link').should('be.visible')
        /*cy.get(':nth-child(7) > .account__userpreference__menu__list__item__link').should('be.visible')*/
    })
    it('content :: account > profile ', function() {
        // account userpreference profile
        cy.get('.personaldata__sectiontitle').should('be.visible')
        /*cy.get('.personaldata__form > :nth-child(1)').should('be.visible')*/
        cy.get(':nth-child(2) > .personaldata__form__txtinput').should('be.visible')
        cy.get(':nth-child(2) > .personaldata__form__txtinput').should('have.attr','placeholder')
        /*cy.get('.personaldata__form > :nth-child(3)').should('be.visible')*/
        cy.get(':nth-child(4) > .personaldata__form__txtinput').should('be.visible')
        cy.get(':nth-child(4) > .personaldata__form__txtinput').should('have.attr','placeholder')
        cy.get('.personaldata__form__button').should('be.visible')
        cy.get('.personaldata__form__button').should('have.attr','type','submit')
    })
    it('content :: account > password ', function() {
        // account userpreference password
        cy.get(':nth-child(5) > .account__userpreference__menu__list__item__link').click()
        cy.get('.personaldata__sectiontitle').should('be.visible')
        cy.get('.mr-5 .personaldata__form__title').should('be.visible')
        cy.get('.mr-5 .personaldata__form__txtinput').should('be.visible')
        cy.get('.mr-5 .personaldata__form__txtinput').should('have.attr','placeholder')
        cy.get('.mr-5 .personaldata__form__txtinput.mt-4').should('be.visible')
        cy.get('.mr-5 .personaldata__form__txtinput.mt-4').should('have.attr','placeholder')
        cy.get('.mr-5 .personaldata__form__button').should('be.visible')
        cy.get('.mr-5 .personaldata__form__button').should('have.attr','type','submit')
    })
    it('content :: account > timezone ', function() {
        // account userpreference timezone
        cy.get(':nth-child(6) > .account__userpreference__menu__list__item__link').click()
        cy.get('.timezone__title').should('be.visible')
        cy.get('#react-select-2--value .Select-placeholder').should('be.visible')
    })
    /*Not in Tracim_V2.0*/
    /*it('content :: account > calendar ', function() {
        // account userpreference personal calendar
        cy.get(':nth-child(7) > .account__userpreference__menu__list__item__link').click()
        cy.get('.account__userpreference__setting__calendar').should('be.visible')
        cy.get('.calendar__title.subTitle').should('be.visible')
        cy.get('.calendar__title').should('be.visible')
        cy.get('.calendar__link').should('be.visible')
    })*/
})
