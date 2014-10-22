<%namespace name="POD" file="pod.templates.pod"/>
<%def name="title()"></%def>
<%def name="content()"></%def>

% if mode=='modal':
<div class="modal-header">
    <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
    <h4 class="modal-title" id="myModalLabel">${POD.ICO(32, 'apps/help-browser')}  ${self.title()}</h4>
</div>
<div class="modal-body">
${self.content()}
</div>
<div class="modal-footer">
    <button type="button" class="btn btn-default" data-dismiss="modal">${_('Close')}</button>
</div>
% else:
<html>
    <title>POD Help: ${self.title()}</title>
    <body>
        ${self.content()}
    </body>
</html>
% endif

