<%inherit file="local:templates.master_anonymous"/>

<%def name="title()">${h.WEBSITE_TITLE|n} - ${_('Change Password Request')}</%def>

<div class="container-fluid">
    <div class="row-fluid">
        <div>
            <div class="row">
                <div class="col-sm-offset-3 col-sm-5">
                    <h1 class="text-center" style="color: ${h.WEBSITE_HOME_TITLE_COLOR};"><b>${h.WEBSITE_TITLE}</b></h1>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-offset-3 col-sm-5">
                    <div class="well">
                        <h3>${_('Reset password')}</h3>
                        ${new_password_form.display(value=form_data, action=action)}
                    </div>
                </div>
                <div class="col-sm-offset-3 col-sm-5 text-right">
                    <div><a href="${tg.url('/')}">${_('go back to home page')}</a></div>
                </div>
            </div>
        </div>
    </div>
</div>

