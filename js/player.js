var Player = function(x, y) {
  var _ = this;
  _.mxs = 0; // max speed
  _.d = DIR.LEFT; // direction
  _.s = 0.35; // speed

  _.dx = 0;
  _.dy = 0;
  _.ic = 0; // invincibility counter
  _.humanity = 100;
  _.humanityDecay = _.humanity / (7 * 60); // 7 min
  _.hc = 0; // healing counter
  _.vaccine = 0;
  _.angle = 0;
  _.ammo = 500;

  _.skinColor = '#ffe499';
  _.hairColor = '#795548';
  _.aim = new Point(0, 0);
  _.weapon = WEAPONS.PISTOL;

  //var x = room.x + (room.w / 2) - 32,
  //    y = room.y + (room.h / 2) - 32;

  _.inherits(Sprite);
  Sprite.call(_, x, y, 64, 64);

  _.u = function() {
    if (_.hc > 0) {
      _.hc = iir(_.hc - $.e, 0);
    } else {
      _.humanity = iir(_.humanity - ($.e * _.humanityDecay / 1000), 0.1);
    }
    _.mxs = iir(-1.5 + (_.humanity / 10), MIN_PLAYER_SPEED);
    _.shotDelay = iir(_.shotDelay - $.e, 0);

    if (_.ic > 0) {
      _.ic = iir(_.ic - $.e, 0);
      // Slow down 20% if recovering
      // _.mxs = iir(_.mxs - (_.mxs * 0.2), MIN_PLAYER_SPEED);
    }

    if ($.in.p(INPUT.LEFT)) {
      _.d = DIR.LEFT;
      _.dx -= _.s;
    } else if ($.in.p(INPUT.RIGHT)) {
      _.d = DIR.RIGHT;
      _.dx += _.s;
    }

    if ($.in.p(INPUT.UP)) {
      _.d = DIR.UP;
      _.dy -= _.s;
    } else if ($.in.p(INPUT.DOWN)) {
      _.d = DIR.DOWN;
      _.dy += _.s;
    }

    _.dx = iir(_.dx, -_.mxs, _.mxs);
    _.dy = iir(_.dy, -_.mxs, _.mxs);

    if (!$.in.p(INPUT.LEFT) && !$.in.p(INPUT.RIGHT)) {
      _.dx = 0;
    }
    if (!$.in.p(INPUT.UP) && !$.in.p(INPUT.DOWN)) {
      _.dy = 0;
    }

    _.x += _.dx;
    _.y += _.dy;

    // Checking world limit collisions
    _.x = iir(_.x, 0, $.cam.ww - _.w);
    _.y = iir(_.y, 0, $.cam.wh - _.h);

    _.updateRect();

    // Collisions with walls
    // p = Player
    // w = Wall
    $.g.w.c(_, function(p, w) {
      if($.o.top(p, w)) {
        p.y = w.b.b;
      } else if ($.o.bottom(p, w)) {
        p.y = w.b.t - p.h;
      }
      if ($.o.left(p, w)) {
        p.x = w.b.r;
      } else if ($.o.right(p, w)) {
        p.x = w.b.l - p.w;
      }
    });

    // Collisions with zombies
    if (_.ic === 0) {
      $.g.z.c(_, function(p, z) {
        _.humanity -= z.bite();
        _.ic = INVINCIBILITY_TIME;
        _.dropVaccine();
        $.ss.shake(1.8, 200)
      });
    }

    // Collisions with items
    $.g.i.c(_, function(p, i) {
      i.a = 0;
      if (i.type === ITEMS.MEDIKIT) {
        _.hc = MEDIKIT_DURATION;
      } else if (i.type === ITEMS.AMMO) {
        _.ammo += AMMO_PER_BOX;
      } else {
        if (i.type === ITEMS.PISTOL) {
          _.weapon = WEAPONS.PISTOL;
        } else if (i.type === ITEMS.SHOTGUN) {
          _.weapon = WEAPONS.SHOTGUN;
        } else if (i.type === ITEMS.FLAME) {
          _.weapon = WEAPONS.FLAME;
        }
      }
    });

    // If the player doesn't have the vaccine, we check for collisions with the vaccine box
    if (!_.vaccine) {
      $.g.x.c(_, function(p, b) {
        if (b.isPickable()) {
          _.vaccine = b;
        }
      });
    }
    if (_.vaccine) {
      _.vaccine.x = _.x + 16;
      _.vaccine.y = _.y - 34;
    }

    $.g.h.c(_, function(p, z) {
      if (z.end && _.vaccine) {
        // Stop all the zombies, fade out, etc
        console.log('you win');
      } else if (z.intro && _.vaccine) {
        $.scn.game.game();
      }
    });

    _.updateRect();

    if (_.shooting && !_.shotDelay) {
      _.shoot();
    }
    //console.log('bullets', $.g.b.e.length);
  };

  _.r = function(p) {
    $.x.s();
    // debug
    $.x.ss('#f00');
    $.x.sr(p.x, p.y, _.w, _.h);
    //if (_.ic !== 0)
    //  $.x.fs('#000000');
    //else
    //  $.x.fs('#ff0000');
    $.x.fs(_.skinColor);
    // Face
    $.x.fr(p.x + 16, p.y + 5, 34, 20);
    // Lab coat
    $.x.fs('white');
    $.x.fr(p.x + 16, p.y + 25, 34, 33);
    // Feet
    $.x.fs('black');
    $.x.fr(p.x + 22, p.y + 59, 9, 6);
    $.x.fr(p.x + 35, p.y + 59, 9, 6);

    if (_.d === DIR.DOWN) {
      // T-shirt
      $.x.fs('#2196f3');
      $.x.fr(p.x + 29, p.y + 25, 8, 24);

      $.x.fs('black');
      $.x.fr(p.x + 29, p.y + 49, 8, 7);
      $.x.fr(p.x + 29, p.y + 56, 2, 3);
      $.x.fr(p.x + 35, p.y + 56, 2, 3);
      // Eyes
      $.x.fr(p.x + 24, p.y + 8, 4, 4);
      $.x.fr(p.x + 37, p.y + 8, 4, 4);
      // Hands
      $.x.fs(_.skinColor);
      $.x.fr(p.x + 16, p.y + 42, 4, 4);
      $.x.fr(p.x + 46, p.y + 42, 4, 4);
      // Hair
      $.x.fs(_.hairColor);
      if (_.sex === 'm') {
        $.x.fr(p.x + 16, p.y + 5, 4, 15);
        $.x.fr(p.x + 20, p.y + 1, 26, 4);
        $.x.fr(p.x + 46, p.y + 5, 4, 15);
      }
    } else if (_.d === DIR.UP) {
      $.x.fs(_.hairColor);
      if (_.sex === 'm') {
        $.x.fr(p.x + 16, p.y + 5, 34, 15);
        $.x.fr(p.x + 20, p.y + 1, 26, 4);
      }
      // Hands
      $.x.fs(_.skinColor);
      $.x.fr(p.x + 16, p.y + 42, 4, 4);
      $.x.fr(p.x + 46, p.y + 42, 4, 4);
    } else if (_.d === DIR.LEFT) {
    } else if (_.d === DIR.RIGHT) {
    }

    // debug
    var c = _.getOffsetCenter(p),
        mag = 100
    $.x.ss('#f00');
    $.x.bp();
    $.x.mv(c.x, c.y);
    $.x.lt(c.x + (mag * cos(_.angle)), c.y + (mag * sin(_.angle)));
    $.x.k();
    $.x.r();
  }

  _.shoot = function() {
    if (!_.ammo) {
      return
    }
    _.dropVaccine();
    _.shotDelay = _.weapon.DELAY;
    var c = _.getCenter();
    _.ammo -= 1;
    $.g.b.add(new Bullet(c.x, c.y, _.angle, _.weapon));
    if (_.weapon.ID === WEAPONS.SHOTGUN.ID) {
      $.g.b.add(new Bullet(c.x, c.y, _.angle + (rndr(4, 15) * PI / 180), _.weapon));
      $.g.b.add(new Bullet(c.x, c.y, _.angle - (rndr(4, 15) * PI / 180), _.weapon));
      _.ammo = iir(_.ammo - 2, 0);
    }
  }

  _.reset = function(x, y) {
    _.x = x;
    _.y = y;
    _.vaccine = 0;
  }

  _.dropVaccine = function() {
    if (_.vaccine) {
      _.vaccine.drop(_);
      _.vaccine = 0;
    }
  }

  _.getCenter = function() {
    // p is the transformed point of the sprite
    return new Point(_.x + (_.w / 2), _.y + (_.h / 2));
  }

  _.getOffsetCenter = function(p) {
    // p is the transformed point of the sprite
    return new Point(p.x + (_.w * _.scaleX / 2), p.y + (_.h * _.scaleY / 2));
  }

  _.updateAim = function(e) {
    var rect = $.cv.getBoundingClientRect(),
        p = $.cam.transformPointCoordinates(_.x, _.y), // transform coordinates to viewport coords
        c = _.getOffsetCenter(p);

    _.scaleX = $.cv.width / rect.width;
    _.scaleY = $.cv.height / rect.height;

    _.aim.x = (e.clientX - rect.left) * _.scaleX;
    _.aim.y = (e.clientY - rect.top) * _.scaleY;
    _.angle = atan2((_.aim.y - c.y), (_.aim.x - c.x));
  }

  _.drawAim = function() {
    $.x.s();
    $.x.bp();
    $.x.fs('#f00');
    $.x.arc(_.aim.x, _.aim.y, 2, 0, 2 * PI);
    $.x.f();
    $.x.fr(_.aim.x, _.aim.y - 14, 1, 8);
    $.x.fr(_.aim.x, _.aim.y + 7, 1, 8);
    $.x.fr(_.aim.x - 14, _.aim.y, 8, 1);
    $.x.fr(_.aim.x + 7, _.aim.y, 8, 1);
    $.x.r();
  }

  $.cv.addEventListener('mousemove', function(e) {
    _.updateAim(e);
  }, false);

  $.cv.addEventListener('mousedown', function(e) {
    _.shooting = 1;
  });

  $.cv.addEventListener('mouseup', function(e) {
    _.shooting = 0;
  });
};
