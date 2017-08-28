var GameScene = function() {
  var _ = this;
  _.ww = 4096;
  _.wh = 4096;
  _.maxBlur = 5;
  _.c = $.byId("c"); // canvas

  _.inherits(Scene);
  Scene.call(_);

  $.o = new Collisions();
  $.g.walls = new Group();

  $.lvl.gen(_.wh, _.wh);
  _.player = new Player(120, 120);
  $.cam.setWorldSize(_.ww, _.wh);
  $.cam.setTarget(_.player);

  // Load the walls
  for (var j=0; j<$.lvl.wh; j++) {
    for (var i=0; i<$.lvl.ww; i++) {
      if ($.lvl.isWall(j, i)) {
        $.g.walls.add(new Wall(j*32, i*32, 0));
      }
    }
  }

  _.update = function() {
    $.x.clr('#ccc');

    // Update
    _.player.u();
    $.cam.u();

    // Render
    $.cam.r(_.player);
    $.g.walls.r();
  };

  _.applyFilter = function(g, b) {
    b = b * _.maxBlur / 100;
    _.c.style.filter = "grayscale(" + g + "%) blur(" + b + "px)";
  };

  //_.applyFilter(50, 100);
}
