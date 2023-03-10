import { PAGES, URLS } from '../../support/urls_commands'
import { SELECTORS as s } from '../../support/generic_selector_commands'
import baseUser from '../../fixtures/baseUser.json'
import defaultAdmin from '../../fixtures/defaultAdmin.json'



describe('Account page', () => {
  beforeEach(() => {
    cy.resetDB()
    cy.setupBaseDB()
    cy.loginAs('users')
    cy.visitPage({ pageName: PAGES.ACCOUNT })
    cy.log('Todo must be reworked')
  })

  afterEach(() => {
    cy.cancelXHR()
  })

  const validateButton = 'Validate'

  // describe('Account header', () => {
    it('should have the title and user preferences visible', () => {
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.account__title')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.account__userpreference')
        .should('be.visible')
    })
    it('should have User info visible', () => {
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=userinfo]')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=userinfo__name]')
        .should('be.visible')
        .contains(baseUser.public_name)
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=userinfo__username]')
        .should('be.visible')
        .contains(baseUser.username)
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=userinfo__email]')
        .should('be.visible')
        .contains(baseUser.email)
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=avatar]')
        .should('be.visible')
    })
    it("should have username with an @ at user's info", () => {
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=userinfo__username]')
        .contains(`@${baseUser.username}`)
        .should('be.visible')
    })
  // })

  // describe('Account Preferences', () => {
    it('should have Menu visible', () => {
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
        .find('[data-cy=menusubcomponent__list__configurationLinks]')
        .should('be.visible')
    })
    it('should have profile field visible', () => {
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

    it('should have password field visible', () => {
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=menusubcomponent__list__password] > .menusubcomponent__list__item__link')
        .click()
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.personaldata__sectiontitle')
        .should('be.visible')
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.personaldata__form__txtinput[type=password]')
        .should('have.length', 3)
      cy.contains('.personaldata__form label', 'Current password:')
        .should('be.visible')
      cy.contains('.personaldata__form label', 'New password:')
        .should('be.visible')
      cy.contains('.personaldata__form label', 'Repeat new password:')
        .should('be.visible')
    })

    it('should have a specific icon for validate button', () => {
      cy.contains('[data-cy=IconButton_PersonalData]', validateButton)
        .find('.iconbutton__icon')
        .should('have.class', 'fa-check')
    })

    it('should have agenda link visible', () => {
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=menusubcomponent__list__configurationLinks]')
        .click()
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.agendaInfo__content__link__url')
        .click()
    })

    it('should have webdav link visible', () => {
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('[data-cy=menusubcomponent__list__configurationLinks]')
        .click()
      cy.getTag({ selectorName: s.TRACIM_CONTENT })
        .find('.webdavInfo__content__link__url')
        .click()
    })
  // })
  // describe('Changing account preferences', () => {
    // describe('Change full name', () => {
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
    // })
    // describe('Change email', () => {
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
          .find('[data-cy=userinfo__email__mailto]')
          .should('have.attr', 'href').and('include', newRandomEmail)
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=userinfo__email]')
          .contains(newRandomEmail)
      })
    // })
    // describe('Change username', () => {
      const newUserName = 'newRandomUsername'
      const longNewUsername = 'a'.repeat(256)

      it('should update the header with the new username', () => {
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
          .find('.personaldata__form__txtinput__msginfo')
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

      it('should show an error message when new username is too long', () => {
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=menusubcomponent__list__personalData] > .menusubcomponent__list__item__link')
          .click()
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=personaldata__form__txtinput__username]')
          .type(longNewUsername)
        cy.get('.personaldata__form__txtinput__msgerror')
          .should('be.visible')
      })

      it('should show an error message when new username is too short', () => {
        const smallUsername = 'aa'
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=menusubcomponent__list__personalData] > .menusubcomponent__list__item__link')
          .click()
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('[data-cy=personaldata__form__txtinput__username]')
          .type(smallUsername)
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('.personaldata__form__txtinput.checkPassword')
          .type(baseUser.password)
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('.personaldata__form__txtinput__msgerror')
          .should('be.visible')
        cy.getTag({ selectorName: s.TRACIM_CONTENT })
          .find('.personaldata__form__button')
          .should('not.be.enabled')
      })
    // })

    // TODO - MP - 2022-07-04 - Unstable test
    // see: https://github.com/tracim/tracim/issues/5344
    describe.skip('Space management', () => {
      it('Allows leaving a space', () => {
        cy.get('[data-cy=menusubcomponent__list__spacesConfig]')
          .click()
        cy.get('.spaceconfig__sectiontitle').should('be.visible')
        cy.contains('.spaceconfig__table__spacename', 'My space')
        cy.get('[data-cy=spaceconfig__table__leave_space_cell] button')
          .click()

        cy.get('.confirm_popup').should('be.visible')
        cy.get('[data-cy=confirm_popup__button_cancel]').click()
        cy.contains('.spaceconfig__table__spacename', 'My space')

        cy.get('[data-cy=spaceconfig__table__leave_space_cell] button')
          .click()

        cy.get('.confirm_popup').should('be.visible')
        cy.get('[data-cy=confirm_popup__button_confirm]').click()
        cy.contains('.account__userpreference__setting__spacename', 'You are not a member of any space yet')
      })
    })
  // })
  // it("should redirect to user's public profile", () => {
  //   cy.visitPage({ pageName: PAGES.ACCOUNT })
  //   cy.get('.userinfo__profile_button').click()
  //   cy.url().should('include', URLS[PAGES.PROFILE]({ userId: defaultAdmin.user_id }));
  // })
})

// describe('Profile link button', () => {
//   beforeEach(() => {
//     cy.resetDB()
//     cy.setupBaseDB()
//     cy.loginAs('administrators')
//   })

//   afterEach(() => {
//     cy.cancelXHR()
//   })

// })
