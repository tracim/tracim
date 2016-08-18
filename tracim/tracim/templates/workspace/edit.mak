<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%namespace name="TIM" file="tracim.templates.pod"/>

<%def name="title()"></%def>

<form role="form" method="POST" action="${tg.url('/admin/workspaces/{}?_method=PUT'.format(result.workspace.id))}">
    <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
        <h4 class="modal-title">${ICON.FA('fa-edit t-less-visible')} ${_('Edit Workspace')}</h4>
    </div>
    <div class="modal-body">
        <div class="form-group">
            <label for="workspace-name1">${_('Name')}</label>
            <input name="name" type="text" class="form-control" id="workspace-name" placeholder="${_('Name')}" value="${result.workspace.label}">
        </div>
        <div class="form-group">
            <label for="workspaceDescription">${_('Description')}</label>
            <textarea name="description" class="form-control" id="workspaceDescription" placeholder="${_('You may add a description of the workspace')}">${result.workspace.description}</textarea>
        </div>
        <div class="checkbox form-group">
            <label for="workspaceCalendarEnabled">
                <input id="workspaceCalendarEnabled" name="calendar_enabled" type="checkbox" ${'checked' if result.workspace.calendar_enabled else ''} >
                <b>${_('Activate associated calendar')}</b>
            </label>
        </div>
        <script>
            $('#workspaceCalendarEnabled').click(function() {
                if($(this).is(':checked')) {
                    $('.calendar-url').css('display', 'block');
                } else {
                    $('.calendar-url').css('display', 'none');
                }
            });
        </script>
        <div class="form-group calendar-url" style="display: ${'none' if not result.workspace.calendar_enabled else 'block'};">
            <label for="workspace-name1">${_('Calendar Url')}</label>
            <input id="workspaceCalendarUrl" type="text" class="form-control"  disabled="disabled" value="${result.workspace.calendar_url}" />
            <p>
                ${_('This url is the one to configure in your calendar software: Outlook, Thunderbird, etc.')}
            </p>
        </div>
    </div>
    <div class="modal-footer">
        <span class="pull-right" style="margin-top: 0.5em;">
            <button id="current-document-add-comment-save-button" type="submit" class="btn btn-small btn-success" title="Add first comment"><i class=" fa fa-check"></i> ${_('Validate')}</button>
        </span>
    </div>
</form>

