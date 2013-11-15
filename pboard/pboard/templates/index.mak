<%inherit file="local:templates.master"/>

<%def name="title()">
  pod :: take notes, list tasks, write documents, manage projects
</%def>

  <div class="row">
    <div class="span9">
      <div class="row">
        <div class="well">
          <h1>pod <small>your information compagnion</small></h1>
        </div>
      </div>

      <div class="row hidden-phone hidden-tablet">
        <div class="span3 text-right">
          <p>Take <strong>notes</strong> <i class="pod-blue fa-2x fa-fw fa fa-pencil" style="vertical-align: middle;"></i></p>
          <p>List <strong>tasks</strong> <i class="pod-blue fa-2x fa-fw fa fa-list" style="vertical-align: middle;"></i></p>
          <p>Write <strong>documents</strong> <i class="pod-blue fa-2x fa-fw fa fa-file-text-o" style="vertical-align: middle;"></i></p>
          <p>Change <strong>Status</strong> <i class="pod-blue fa-2x fa-fw fa fa-check-square-o" style="vertical-align: middle;"></i> </p>
        </div>
        <div class="span1 text-center">
          <i class="fa fa-angle-double-right fa-5x"></i><br/>
        </div>

        <div class="span5">
          <div class="well text-center">
            <div class="row">
            % for id, (icon, label) in enumerate((('fa-search', 'Search'), ('fa-dashboard', 'Track'), ('fa-sort-alpha-asc', 'Organize'), ('fa-users', 'Manage'))):
              <div class="span1">
                % for i in range(id):
                  <br/>
                % endfor
                <i class="pod-blue fa-3x fa-fw fa ${icon}"></i>
                <br/>
                <strong>${label}</strong>
              </div>
            % endfor
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="span3">
      <form class="well" action="${tg.url('/public_api/create_account')}">
        <fieldset>
          <legend>Sign up</legend>
          <input type="text"     name="email"            id="email" placeholder="Email"><br/>
          <input type="password" name="password"         id="password" placeholder="Password"><br/>
          <input type="password" name="retyped_password" id="retyped_password" placeholder="Retype your password"><br/>
          <input type="submit"   id="submit" value="Sign up" /><br/>
        </fieldset>
      </form>
    </div>
  </div>

  <div class="row">
    <div class="span12 hidden-phone hidden-tablet text-center pod-blue" style="margin: 0.5em;">
      <i>${_("pod: search a job, manage projects, track and manage clients and prospects, document processes and knowledge, ...")}</i>
    </div>
  </div>


