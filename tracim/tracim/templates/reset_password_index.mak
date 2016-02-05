<%inherit file="local:templates.master_anonymous"/>

<%def name="title()">${CFG.WEBSITE_TITLE|n} - ${_('Password Reset Request')}</%def>

<div class="container-fluid">
    <div class="row-fluid">
        <div>
            <div class="row">
                <div class="col-sm-offset-3 col-sm-5">
                    <h1 class="text-center" style="color: ${CFG.WEBSITE_HOME_TITLE_COLOR};"><b>${CFG.WEBSITE_TITLE}</b></h1>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-offset-3 col-sm-5">
                    <div class="well">
                        <h3>${_('Reset password')}</h3>
                        ${reset_password_form.display(action=action)}
                    </div>
                </div>
                <div class="col-sm-offset-3 col-sm-5 text-right">
                    <div><a href="${tg.url('/')}">${_('go back to home page')}</a></div>
                </div>
            </div>
        </div>
    </div>
</div>

