<%namespace name="TIM" file="tracim.templates.pod"/>
<%namespace name="ICON" file="tracim.templates.widgets.icon"/>
<%def name="title()">${_('Invite someone to video-conference')}</%def>

<%def name="content(jitsi_meet_room)">
    <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
        <h4 class="modal-title">${ICON.FA('fa-share')}  ${self.title()}</h4>
    </div>
    <div class="modal-body">
        <p>
        ${_('To invite someone from outside of tracim into this conference, share this link. This link is available for 5 minutes.')}
        </p>
        <textarea readonly=readonly wrap="off" style="width: 100%;">${jitsi_meet_room.generate_url(jitsi_meet_room.generate_jwt_token())}</textarea>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">${_('Close')}</button>
    </div>
        </form>
</%def>
${self.content(jitsi_meet_room)}

