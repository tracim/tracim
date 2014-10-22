<%inherit file="local:templates.master_authenticated"/>
<%namespace name="POD" file="pod.templates.pod"/>

<%def name="title()">${_('A {code} Error has occured').format(code=code)}</%def>

<%
import re
mf = re.compile(r'(</?)script', re.IGNORECASE)
def fixmessage(message):
    return mf.sub(r'\1noscript', message)
%>

<div class="container-fluid">
    <div class="row-fluid">
        <div>
            <div class="row">
                <div class="col-sm-offset-3 col-sm-6">
                    <h1 class="text-center">
                        <div class="alert alert-info">
                            ${_('Something went wrong!')}
                        </div>
                    </h1>
                </div>
            </div>
            <div class="row">
                <div class="col-sm-offset-3 col-sm-2">
                    <a class="thumbnail" style="background-color: transparent; border-wdith: 0;">
                      <img style="background-color: transparent;" src="${tg.url('/assets/img/ghost.png')}" alt="...">
                    </a>
                </div>
                <div class="col-sm-4">
                    <div>
                    <h2>${_('We suggest to...')}</h2>
                    <p>${POD.ICO(32, 'actions/go-home')} &emsp;<strong><a href="${tg.url('/')}">${_('Go back to the home page')}</a></strong></p>
                    <p>${POD.ICO(32, 'apps/internet-mail')} &emsp;<strong><a href="mailto:support@trac.im">${_('Contact the support')}</a></strong></p>
                </div>
            </div>
            % if code!=403:
                <div class="row">
                    <div class="col-sm-6 col-sm-offset-3">
                        <div class="alert alert-danger">
                            ${_('The error was: error {code}').format(code=code)} ${fixmessage(message) | n}
                        </div>
                    </div>
                </div>
            % endif
        </div>
    </div>
</div>

