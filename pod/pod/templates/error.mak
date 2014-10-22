<%inherit file="local:templates.master_anonymous"/>
<%namespace name="POD" file="pod.templates.pod"/>

<%def name="title()">
  A ${code} Error has occurred 
</%def>

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
    <div class="col-sm-offset-3 col-sm-5">
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
    <div class="col-sm-3">
        <div>
        <h2>${_('We suggest...')}</h2>
        <p>${POD.ICO(32, 'actions/go-home')} <strong><a href="${tg.url('/')}">${_('to go back to the home page')}</a></strong></p>
        <p>${POD.ICO(32, 'apps/internet-mail')} <strong><a href="mailto:support@trac.im">${_('to contact the support')}</a></strong></p>
    </div>
</div>
<div class="row">
    <div class="col-sm-5 col-sm-offset-3">
        <div class="alert alert-danger">
            ${_('The error was: error {code}').format(code=code)} ${fixmessage(message) | n}
        </div>
    </div>
</div>

</div>
</div>
</div>

