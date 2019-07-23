import { SELECTORS as s } from '../../support/generic_selector_commands'
import { PAGES as p } from '../../support/urls_commands'

describe('app workspace advanced', function () {
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

    it('Change workspace description', function () {
        cy.getTag({selectorName: s.WORKSPACE_DASHBOARD})
            .find('.dashboard__header__advancedmode__button.btn')
            .click()

        cy.getTag({selectorName: s.APP_FEATURE_CONTAINER})
            .find('.workspace_advanced__description__text__textarea')
            .clear()

        cy.getTag({selectorName: s.APP_FEATURE_CONTAINER})
            .find('.workspace_advanced__description__text__textarea')
            .type(newDescription)

        cy.getTag({selectorName: s.APP_FEATURE_CONTAINER})
            .find('.workspace_advanced__description__bottom__btn')
            .click()

        cy.getTag({selectorName: s.WORKSPACE_DASHBOARD})
            .find('.dashboard__workspace__detail__description')
            .contains(newDescription)
    })
})
