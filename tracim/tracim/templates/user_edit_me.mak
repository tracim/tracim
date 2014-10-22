<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>

<%def name="title()"></%def>

${FORMS.USER_EDIT_FORM('user-edit-form', result.user, tg.url('/user/{}?_method=PUT'.format(result.user.id)))}

