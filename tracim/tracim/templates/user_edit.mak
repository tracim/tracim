<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="title()"></%def>

${FORMS.USER_EDIT_FORM('user-edit-form', result.user, tg.url('/admin/users/{}?_method=PUT'.format(result.user.id)))}

