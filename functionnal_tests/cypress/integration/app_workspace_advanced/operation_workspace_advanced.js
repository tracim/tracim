import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('App Workspace Advanced', function () {
    const newDescription = 'myNewDescription'
    const workspaceId = 1

    before(() => {
        cy.resetDB()
        cy.setupBaseDB()
    })

    beforeEach(function () {
        cy.loginAs('administrators')
        cy.visitPage({pageName: p.DASHBOARD, params: { workspaceId }})
    })
    describe("Changing the workspace's description", () => {
        it('Should update the description in the dashboard', function () {
            cy.getTag({selectorName: s.WORKSPACE_DASHBOARD})
                .find('.dashboard__header__advancedmode__button.btn')
                .click()

            cy.getTag({selectorName: s.CONTENT_FRAME})
                .find('.workspace_advanced__description__text__textarea')
                .should('be.visible')
                .clear()

            cy.getTag({selectorName: s.CONTENT_FRAME})
                .find('.workspace_advanced__description__text__textarea')
                .type(newDescription)

            cy.getTag({selectorName: s.CONTENT_FRAME})
                .find('.workspace_advanced__description__bottom__btn')
                .click()

            cy.getTag({selectorName: s.WORKSPACE_DASHBOARD})
                .find('.dashboard__workspace__detail__description')
                .should('be.visible')
                .contains(newDescription)
        })
    })
})
