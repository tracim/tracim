<%inherit file="local:templates.master_authenticated"/>
<html>
<head>
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" py:if="False"/>
  <title>${_('Password Reset Request')}</title>
</head>

<body>
    <br/>
    <br/>
    <div class="row">
        <div class="col-sm-offset-4 col-sm-4 well">
            <h3>${_('Reset password')}</h3>
            ${reset_password_form.display(action=action)}
        </div>
    </div>
</body>
</html>
