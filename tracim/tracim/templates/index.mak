<%inherit file="local:templates.master_anonymous"/>
<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="title()">
  ${CFG.WEBSITE_TITLE|n}
</%def>


<div class="container-fluid">
    <div class="row-fluid">
        <div>
            <div class="row">
                <div class="col-sm-offset-3 col-sm-6">
                    <h1 class="text-center" style="color: ${CFG.WEBSITE_HOME_TITLE_COLOR};"><b>${CFG.WEBSITE_TITLE|n}</b></h1>
                    <p class="text-center" style="color: ${CFG.WEBSITE_HOME_TITLE_COLOR};">${CFG.WEBSITE_SUBTITLE|n}</p>
                </div>
            </div>

            <div class="row">
                <div class="col-sm-offset-3 col-sm-2">
                    <a class="thumbnail">
                        <img src="${CFG.WEBSITE_HOME_IMAGE_URL}" alt="">
                    </a>
                    <p>${CFG.WEBSITE_HOME_TAG_LINE|n}</p>
                    

                </div>
                <div class="col-sm-4">
                    <div class="well">
                        <h2 style="margin-top: 0;">${TIM.ICO(32, 'status/status-locked')} ${_('Login')}</h2>
                        <form id='w-login-form' role="form" method="POST" action="${tg.url('/login_handler', params=dict(came_from=came_from, __logins=login_counter))}">
                            <div class="form-group">
                                <div class="input-group">
                                    <div class="input-group-addon"><i class="fa fa-envelope-o"></i></div>
                                    <input type="email" name="login" class="form-control" placeholder="${_('Enter email')}">
                                </div>
                            </div>
                            <div class="form-group">
                                <div class="input-group">
                                    <div class="input-group-addon"><i class="fa fa-key"></i></div>
                                    <input type="password" name="password" class="form-control" placeholder="${_('Enter password')}">
                                </div>
                            </div>
                            <div class="checkbox">
                                <label>
                                    <input type="checkbox" id="loginremember" name="remember" value="2252000"/> ${_('Remember me')}
                                </label>
                            </div>
                            <div class="text-right">
                                <button type="submit" class="btn btn-small btn-success text-right">
                                    <i class="fa fa-check"></i> ${_('Login')}
                                </button>
                                % if CFG.EMAIL_NOTIFICATION_ACTIVATED and tmpl_context.auth_is_internal:
                                    <div class="pull-left">
                                        <a class="btn btn-link" href="${tg.url('/reset_password')}"><i class="fa fa-magic"></i> ${_('Forgot password?')}</a>
                                    </div>
                                % endif
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-offset-3 col-sm-6 text-center">${CFG.WEBSITE_HOME_BELOW_LOGIN_FORM|n}</div>
            </div>


        </div>
    </div>
</div>


