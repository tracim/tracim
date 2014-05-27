<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pboard.templates.pod"/>

<%def name="title()">
  pod :: take notes, list tasks, write documents, manage projects
</%def>

  <div class="row">
    <div class="span10 offset1">
      <div class="row">
        <div class="span10">
          <div class="well">
            <h1>pod <small>Simple tool, flexible data.</small></h1>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="span10 offset1">
      <div class="row hidden-phone hidden-tablet">
        <div class="span3" >
          <div class="well text-right" style="min-height: 15em;">
            <p>Take <strong>notes</strong> <i class="pod-blue fa-2x fa-fw fa fa-pencil" style="vertical-align: middle;"></i></p>
            <p>List <strong>tasks</strong> <i class="pod-blue fa-2x fa-fw fa fa-list" style="vertical-align: middle;"></i></p>
            <p>Write <strong>documents</strong> <i class="pod-blue fa-2x fa-fw fa fa-file-text-o" style="vertical-align: middle;"></i></p>
            <p>Change <strong>Status</strong> <i class="pod-blue fa-2x fa-fw fa fa-check-square-o" style="vertical-align: middle;"></i> </p>
            <hr/>
            <p class="text-center">
              <i class="pod-blue fa-2x fa-fw fa fa-file-text-o" title="${_('Text documents')}" style="vertical-align: middle;"></i>
              <i class="pod-blue fa-2x fa-fw fa fa-calendar"    title="${_('Events')}" style="vertical-align: middle;"></i>
              <i class="pod-blue fa-2x fa-fw fa fa-user"        title="${_('Contacts')}"       style="vertical-align: middle;"></i>
              <i class="pod-blue fa-2x fa-fw fa fa-comments-o"  title="${_('Comments')}"       style="vertical-align: middle;"></i>
              <i class="pod-blue fa-2x fa-fw fa fa-paperclip"   title="${_('Files')}" style="vertical-align: middle;"></i>
            </p>
          </div>
        </div>

        <div class="span4">
          <div class="well text-center" style="min-height: 16em;">
            <div class="row-fluid">
            % for (icon, label) in (('fa-search', 'Search'), ('fa-dashboard', 'Track')):
              <div class="span6">
                <i class="pod-blue fa-4x fa ${icon}"></i><br/>
                <strong>${label}</strong>
              </div>
            % endfor
            </div>
            <div class="row-fluid" style="margin-top: 2em;">
            % for (icon, label) in (('fa-sort-alpha-asc', 'Organize'), ('fa-users', 'Manage')):
              <div class="span6">
                <i class="pod-blue fa-4x fa-fw fa ${icon}"></i><br/>
                <strong>${label}</strong>
              </div>
            % endfor
            </div>
          </div>
        </div>

		% if not request.identity:
        <div class="span3">
          <div class="well text-center" style="min-height: 16em;">
			<form action="${tg.url('/login_handler')}">
			  <fieldset>
				<legend><i class="fa fa-key" style="vertical-align: baseline !important;"></i> Login</legend>
				<input class="span2" type="text" id="login" name="login" placeholder="email...">
				<input class="span2" type="password" id="password" name="password" placeholder="password...">
				<div class="span2 control-group">
				  Remember me <input type="checkbox" id="loginremember" name="remember" value="2252000"/>
				</div>
				<input type="submit" id="submit" value="Login" />
			  </fieldset>
			</form>
		  </div>
		</div>
		% else:
		<div class="span3">
          <div class="well text-center" style="min-height: 16em;">
		    <p>${_('Welcome, ')}${request.identity['user'].display_name}</p>
			<p>${_('Click on Documents in the top menu to access you data.')}</p>
		  </div>
		</div>
		% endif
      </div>
    </div>
  </div>

