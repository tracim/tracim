<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="FORMS" file="tracim.templates.user_workspace_forms"/>

<%def name="title()"></%def>

${FORMS.USER_EDIT_FORM('user-edit-form', result.user, tg.url('/user/{}?_method=PUT'.format(result.user.id)), next_url=fake_api.next_url)}

<script type="text/javascript">
  // add select2 for timezone in user edit profile modale
  $('#timezone').select2({
    dropdownParent: $("#user-edit-form") // this is a workaround to make select works inside bootstrap modal
  })
</script>
