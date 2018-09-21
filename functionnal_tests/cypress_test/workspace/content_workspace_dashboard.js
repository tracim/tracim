describe('content :: workspace > dashbord', function () {
    before(function () {
        //login
        cy.visit('/login')
        cy.get('input[type=email]').type('admin@admin.admin')
        cy.get('input[type=password]').type('admin@admin.admin')
        cy.get('form').find('button').get('.connection__form__btnsubmit').click()
        cy.url().should('include', '/workspaces/1/dashboard')
    })
    it ('part of dashbord', function () {
        cy.get('.dashboard.pageWrapperGeneric').should('be.visible')
        cy.get('.dashboard__header.pageTitleGeneric').should('be.visible')
        cy.get('.dashboard .pageContentGeneric').should('be.visible')
        cy.get('.pageContentGeneric .dashboard__workspace-wrapper').should('be.visible')
        cy.get('.pageContentGeneric .dashboard__calltoaction').should('be.visible')
        cy.get('.pageContentGeneric .dashboard__workspaceInfo').should('be.visible')
        cy.get('.dashboard__workspaceInfo .activity').should('be.visible')
        cy.get('.dashboard__workspaceInfo .memberlist').should('be.visible')
    })
    it ('header', function() {
        cy.get('.pageTitleGeneric .dashboard__header__title').should('be.visible')
        cy.get('.pageTitleGeneric .dashboard__header__advancedmode').should('be.visible')
        cy.get('.pageTitleGeneric .dashboard__header__advancedmode__button').should('have.attr', 'type', 'button').should('be.visible')
    })
    it ('workspace-wrapper', function() {
        cy.get('.dashboard__workspace-wrapper .dashboard__workspace').should('be.visible')
        cy.get('.pageContentGeneric .dashboard__workspace__title').should('be.visible')
        // @FIXME need to make description first @philippe 14/09/2018
        // cy.get('.dashboard__workspace .dashboard__workspace__detail').should('be.visible')
        cy.get('.dashboard__workspace-wrapper .userstatus').should('be.visible')
        cy.get('.userstatus .userstatus__role__msg').should('be.visible')
        cy.get('.userstatus .userstatus__role__definition').should('be.visible')
        cy.get('.userstatus .userstatus__notification__text').should('be.visible')
        cy.get('.userstatus .userstatus__notification__btn').should('be.visible')
    })
    it ('calltoaction', function() {
        cy.get(':nth-child(1).dashboard__calltoaction__button').should('be.visible')
        cy.get(':nth-child(1) .dashboard__calltoaction__button__text__icon').should('be.visible')
        cy.get(':nth-child(1) .dashboard__calltoaction__button__text__title').should('be.visible')
        cy.get(':nth-child(2).dashboard__calltoaction__button').should('be.visible')
        cy.get(':nth-child(2) .dashboard__calltoaction__button__text__icon').should('be.visible')
        cy.get(':nth-child(2) .dashboard__calltoaction__button__text__title').should('be.visible')
        cy.get(':nth-child(3).dashboard__calltoaction__button').should('be.visible')
        cy.get(':nth-child(3) .dashboard__calltoaction__button__text__icon').should('be.visible')
        cy.get(':nth-child(3) .dashboard__calltoaction__button__text__title').should('be.visible')
        cy.get(':nth-child(4).dashboard__calltoaction__button').should('be.visible')
        cy.get(':nth-child(4) .dashboard__calltoaction__button__text__icon').should('be.visible')
        cy.get(':nth-child(4) .dashboard__calltoaction__button__text__title').should('be.visible')
    })
    it ('activity', function() {
        cy.get('.activity .activity__header__title').should('be.visible')
        cy.get('.activity .activity__header__allread').should('be.visible')
        cy.get('.activity .activity__wrapper').should('be.visible')
        // @FIXME make better solution to test more_button without activity @philippe 14/09/2018
        // cy.get('.activity .activity__more__btn').should('be.visible')
    })
    it ('members', function() {
        cy.get('.memberlist .memberlist__header.subTitle').should('be.visible')
        cy.get('.memberlist .memberlist__list').should('be.visible')
        cy.get('.memberlist .memberlist__list__item').should('be.visible')
        cy.get('.memberlist .memberlist__list__item__avatar').should('be.visible')
        cy.get('.memberlist .memberlist__list__item__info').should('be.visible')
        cy.get('.memberlist .memberlist__list__item__delete').should('be.visible')
        cy.get('.memberlist .memberlist__btnadd').should('be.visible')
    })
//    it ('link_webdav', function() {
//        cy.get('.moreinfo .moreinfo__webdav').should('be.visible')
//        cy.get('.moreinfo .moreinfo__webdav__btn').should('be.visible')
//        cy.get('.moreinfo .moreinfo__webdav__btn__icon').should('be.visible')
//        cy.get('.moreinfo .moreinfo__webdav__btn__text').should('be.visible')
//    })
//    Not implemented in Tracim_V2.0
//    it ('link_calendar', function() {
//        cy.get('.moreinfo moreinfo__calendar').should('be.visible')
//        cy.get('.moreinfo moreinfo__calendar__btn').should('be.visible')
//        cy.get('.moreinfo moreinfo__calendar__btn__icon').should('be.visible')
//        cy.get('.moreinfo moreinfo__calendar__btn__text').should('be.visible')
//    })


})
