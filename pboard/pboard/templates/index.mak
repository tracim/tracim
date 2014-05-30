<%inherit file="local:templates.master"/>
<%namespace name="POD" file="pboard.templates.pod"/>

<%def name="title()">
  pod :: take notes, list tasks, write documents, manage projects blabla
</%def>

  <div class="row">
        <div class="span12">
          <div class="well">
            <h1>pod <small>Simple tool, flexible data.</small></h1>
          </div>
        </div>
  </div>

  <div class="row">
    <div class="span10 offset1">
      <div class="row hidden-phone hidden-tablet">

        ## LOGIN SCREEN
        <div class="span3 offset2">
          % if not request.identity:
            <div class="well text-center" style="min-height: 16em;">
              <form action="${tg.url('/login_handler')}">
                <fieldset>
                <legend><i class="fa fa-key" style="vertical-align: baseline !important;"></i> Login</legend>
                <input class="span2" type="text" id="login" name="login" placeholder="email..."><br/>
                <input class="span2" type="password" id="password" name="password" placeholder="password..."><br/>
                <div class="span2 control-group">
                  <input type="checkbox" id="loginremember" name="remember" value="2252000"/> ${_('Remember me')}
                </div>
                <input type="submit" id="submit" value="Login" />
                </fieldset>
              </form>
            </div>
          % else:
            <div class="well text-center" style="min-height: 16em;">
              <p>${_('Welcome, ')}${request.identity['user'].display_name}</p>
              <p>${_('Click on <a href="{0}">Document</a> in the top menu to access you data.'.format(tg.url('/document')))|n}</p>
            </div>
          % endif
        </div>
        ## END OF LOGIN SCREEN

        <div class="span3" >
          <div class="well" style="min-height: 15em;">
            <p><i class="pod-blue fa-2x fa-fw fa fa-pencil" style="vertical-align: middle;"></i> Take <strong>notes</strong> </p>
            <p><i class="pod-blue fa-2x fa-fw fa fa-list" style="vertical-align: middle;"></i> List <strong>tasks</strong> </p>
            <p><i class="pod-blue fa-2x fa-fw fa fa-file-text-o" style="vertical-align: middle;"></i> Write <strong>documents</strong></p>
            <p><i class="pod-blue fa-2x fa-fw fa fa-check-square-o" style="vertical-align: middle;"></i>Change <strong>Status</strong></p>
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

      </div>
    </div>
  </div>

