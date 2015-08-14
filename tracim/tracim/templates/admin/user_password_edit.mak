<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="FORMS" file="tracim.templates.widgets.forms"/>
<%def name="title()"></%def>

${FORMS.USER_PASSWORD_EDIT_FORM_NO_OLD('user-edit-form', result.user, tg.url('/admin/users/{}/password?_method=PUT'.format(result.user.id)))}

