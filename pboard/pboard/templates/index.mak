<%inherit file="local:templates.master"/>

<%def name="title()">
  Welcome to TurboGears 2.3, standing on the shoulders of giants, since 2007
</%def>

  <div class="row">
    <div class="span9 hidden-phone hidden-tablet">
      <div class="hero-unit">
        <h1>pod <small>your information compagnion</small></h1>
      </div>

      <div class="row">
        <div class="span2 alert alert-success">
          <p><button><i class="icon-g-cardio"></i> <strong>Track</strong> projects</button></p>
          <p><button><i class="icon-g-edit"></i> <strong>Take</strong> notes</button></p>
          <p><button><i class="icon-g-attach"></i> <strong>Keep</strong> files</button></p>
          <span><button><i class="icon-g-ok"></i> <strong>Manage</strong> status</button></span>
        </div>
        <div class="span6 well well-small">
          <h5>
            <i class="icon-g-group"></i>
            Use cases
          </h5>
          <ul>
            <li>Search a job</li>
            <li>Manage clients</li>
            <li>Track tasks</li>
            <li>...</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="span3">
      <form class="well">
        <fieldset>
          <legend>Sign up</legend>
          <input type="text" id="email" placeholder="Email"><br/>
          <input type="text" id="password" placeholder="Password"><br/>
          <input type="text" id="retype_password" placeholder="Retype your password"><br/>
          <input type="submit" id="submit" value="Sign up" /><br/>
        </fieldset>
      </form>
    </div>
  </div>


