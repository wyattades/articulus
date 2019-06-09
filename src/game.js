import Phaser from 'phaser';


const config = {
  type: Phaser.WEBGL,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: false,
    },
  },
  scene: {
    key: 'main',
    preload,
    create,
    update,
  }
};

let game;
let map;
let player, playerBody, playerHead;
let cursors;
let groundLayer, vanLayer, corgiLayer;
let text;
let score;
let bark, yeet;

function preload() {

  const loadingText = this.add.text(100, 300, 'Loading Memes: 0%', {
    fontSize: '40px',
  });
  this.load.on('progress', (value) => {
    loadingText.setText('Loading Memes: ' + parseInt(value * 100) + '%');
  });
  this.load.on('complete', () => {
    loadingText.destroy();
  });

  // for (const name of ['winner', 'happy', 'neutral', 'forward', 'corgi', 'vans'])
  //   this.load.image(name, `assets/${name}.png`);

  // // map made with Tiled in JSON format
  // this.load.tilemapTiledJSON('map', 'assets/map.json');
  // this.load.spritesheet('tiles', 'assets/tiles.png', { frameWidth: 70, frameHeight: 70 });

  // // body animations
  // this.load.atlas('playerBody', 'assets/playerBody.png', 'assets/playerBody.json');

  // this.load.audio('bark', 'assets/bark.mp3');
  // this.load.audio('yeet', 'assets/yeet.mp3');
  // this.load.audio('heyey', 'assets/heyey.mp3');
}

function create() {

  // const music = this.sound.add('heyey');
  // music.play(null, {
  //   loop: true,
  //   volume: 0.8,
  // });

  // bark = this.sound.add('bark');
  // yeet = this.sound.add('yeet');

  // // load the map 
  // map = this.make.tilemap({ key: 'map' });
  
  // // tiles for the ground layer
  // const groundTiles = map.addTilesetImage('tiles');
  // groundLayer = map.createDynamicLayer('World', groundTiles, 0, 0);
  // groundLayer.setCollisionByExclusion([-1]);
  
  // const vanTiles = map.addTilesetImage('vans');
  // vanLayer = map.createDynamicLayer('Vans', vanTiles, 0, 0);

  // const corgiTiles = map.addTilesetImage('corgi');
  // corgiLayer = map.createDynamicLayer('Corgis', corgiTiles, 0, 0);
  
  // set the boundaries of our game world
  // this.physics.world.bounds.width = groundLayer.width;
  // this.physics.world.bounds.height = groundLayer.height;
  
  // // create the player sprite    
  // playerBody = this.add.sprite(0, 0, 'playerBody');
  // playerHead = this.add.sprite(0, -100, 'forward');
  // // playerHead.setSize(100, 100);
  // playerHead.setDisplaySize(100, 100);
  // player = this.add.container(200, 700, [ playerBody, playerHead ]);
  // player.setSize(50, 100);
  // this.physics.world.enable(player);

  // player.body
  // .setBounce(0.2)
  // .setCollideWorldBounds(true);
  
  // // player will collide with the level tiles 
  // this.physics.add.collider(groundLayer, player);
  
  // vanLayer.setTileIndexCallback(17, collectVan, this);
  // this.physics.add.overlap(player, vanLayer);

  // corgiLayer.setTileIndexCallback(18, collectCorgi, this);
  // this.physics.add.overlap(player, corgiLayer);
  
  // // player walk animation
  // this.anims.create({
  //   key: 'walk',
  //   frames: this.anims.generateFrameNames('playerBody', {
  //     prefix: 'run', start: 1, end: 2,
  //   }),
  //   frameRate: 5,
  //   repeat: -1
  // });
  // // idle with only one frame, so repeat is not neaded
  // this.anims.create({
  //   key: 'idle',
  //   frames: [{ key: 'playerBody', frame: 'stand' }],
  //   frameRate: 5,
  // });
  
  
  cursors = this.input.keyboard.createCursorKeys();
  
  // set bounds so the camera won't go outside the game world
  // this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  // make the camera follow the player
  // this.cameras.main.startFollow(player);
  
  // set background color, so the sky is not black    
  this.cameras.main.setBackgroundColor('#a3f8ff');
  
  // this text will show the score
  text = this.add.text(20, 20, '0 Yeet Points', {
    fontSize: '40px',
    fill: '#000000',
    fontFamily: 'Arial',
  }).setScrollFactor(0);
}

let headTimer = null;

// this function will be called when the player touches a coin
// function collectVan(sprite, tile) {
//   vanLayer.removeTileAt(tile.x, tile.y); // remove the tile/coin
//   score += 1; // add 1 point to the score
//   text.setText(score + ' Yeet Points'); // set the text to show the current score

//   yeet.play();

//   if (headTimer !== null) {
//     window.clearTimeout(headTimer);
//     headTimer = null;
//   }
//   playerHead.setTexture('neutral');
//   headTimer = window.setTimeout(() => playerHead.setTexture('forward'), 1000);

//   return false;
// }

// function collectCorgi(sprite, tile) {
//   corgiLayer.removeTileAt(tile.x, tile.y); // remove the tile/coin
//   score += 3; // add 3 points to the score
//   text.setText(score + ' Yeet Points'); // set the text to show the current score

//   bark.play();

//   if (headTimer !== null) {
//     window.clearTimeout(headTimer);
//     headTimer = null;
//   }
//   playerHead.setTexture('neutral');
//   headTimer = window.setTimeout(() => playerHead.setTexture('forward'), 1000);

//   return false;
// }

function update(time, delta) {

  // if (player.x / 70 >= 98) {
  //   player.body.setVelocityX(0);

  //   this.add.text(20, 100, 'Wow u did it. that\'s all i could program, gn.', {
  //     fontSize: '40px',
  //     fill: '#ffffff',
  //     fontFamily: 'Arial',
  //   }).setScrollFactor(0);

  //   this.add.image(150, 450, 'winner')
  //   .setScrollFactor(0)
  //   .setDisplaySize(300, 300);

  //   if (headTimer !== null) {
  //     window.clearTimeout(headTimer);
  //     headTimer = null;
  //   }
  //   playerHead.setTexture('happy');
  // } else {
  //   if (cursors.left.isDown) {
  //     player.body.setVelocityX(-200);
  //     playerBody.anims.play('walk', true); // walk left
  //     playerBody.flipX = playerHead.flipX = true; // flip the sprite to the left
  //   } else if (cursors.right.isDown) {
  //     player.body.setVelocityX(200);
  //     playerBody.anims.play('walk', true);
  //     playerBody.flipX = playerHead.flipX = false; // use the original sprite looking to the right
  //   } else {
  //     player.body.setVelocityX(0);
  //     playerBody.anims.play('idle', true);
  //   }
  
  //   // jump 
  //   if (cursors.up.isDown && player.body.onFloor()) {
  //     player.body.setVelocityY(-550);
  //   }
  // }

}

export default class Game {
  constructor(canvas) {
    score = 0;
    config.canvas = canvas;
    game = new Phaser.Game(config);
    canvas.focus(); 
  }

  destroy() {
    game.destroy();
  }
}