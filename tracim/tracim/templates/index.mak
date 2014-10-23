<%inherit file="local:templates.master_anonymous"/>
<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="title()">
  ${h.WEBSITE_TITLE|n}
</%def>


<div class="container-fluid">
    <div class="row-fluid">
        <div>
            <div class="row">
                <div class="col-sm-offset-3 col-sm-5">
                    <h1 class="text-center" style="color: ${h.WEBSITE_HOME_TITLE_COLOR};"><b>${h.WEBSITE_TITLE}</b></h1>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-offset-3 col-sm-2">
                    <a class="thumbnail">
                        <img src="${h.WEBSITE_HOME_IMAGE_URL}" alt="">
                    </a>
                </div>
                <div class="col-sm-3">
                    <div class="well">
                        <h2 style="margin-top: 0;">${TIM.ICO(32, 'status/status-locked')} ${_('Login')}</h2>
                        <form role="form" method="POST" action="${tg.url('/login_handler', params=dict(came_from=came_from, __logins=login_counter))}">
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
                                <button type="submit" class="btn btn-small btn-success">
                                    <i class="fa fa-check"></i> ${_('Login')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-offset-5 col-sm-3" style="margin-top: -1.5em;">
                    <a class="btn btn-link" href="${tg.url('/reset_password')}"><i class="fa fa-magic"></i> ${_('Forgot password?')}</a>
                </div>
            </div>

        </div>
    </div>
</div>


