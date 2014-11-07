<%inherit file="local:templates.master_authenticated"/>
<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="title()">
    ${_('Dashboard')}
</%def>

<div class="container-fluid">
    <div class="row-fluid">
        <div>
            <div class="row">
                <h1 class="col-sm-6 col-sm-offset-3">${TIM.ICO(32, 'status/dialog-information')} ${_("Dashboard")}</h1>
            </div>
            <div class="row">
                <div class="col-sm-5 col-sm-offset-3">
                    <div class="well">
                        <h2 style="margin-top: 0;">${_('What to do ?')}</h2>
                        <h3>
                            ${TIM.ICO(32, 'places/folder-remote')} <a href="${tg.url('/workspaces')}">${_('Go to my workspaces')}</a>
                        </h3>
                        <h3>
                            ${TIM.ICO(32, 'actions/contact-new')} <a href="${tg.url('/user/me')}">${_('Go to my profile')}</a>
                        </h3>
                    </div>
                </div>
            </div>
            % if fake_api.current_user.profile.id >= 2:
                <div class="row">
                    <div class="col-sm-5 col-sm-offset-3">
                        <div class="well">
                            <h2 style="margin-top: 0;">${_('You can also manage...')}</h2>
                            <h3>
                                ${TIM.ICO(32, 'apps/system-users')} <a href="${tg.url('/admin/users')}">${_('Users')}</a>
                            </h3>
                            <h3>
                                ${TIM.ICO(32, 'places/folder-remote')} <a href="${tg.url('/admin/workspaces')}">${_('Workspaces')}</a>
                            </h3>
                        </div>
                    </div>
                </div>
            % endif
        </div>
    </div>
</div>

