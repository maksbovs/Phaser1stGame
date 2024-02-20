var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var health = 100;
var healthText;
var healthBar;
var game = new Phaser.Game(config);
var starSound;
var bombSound;
var timer;
var timerText;
var startTime; // Додано змінну для збереження часу початку гри

function preload ()
{
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });

    // Завантажуємо звуки
    this.load.audio('starSound', 'assets/sound.wav');
    this.load.audio('bombSound', 'assets/bomb.mp3');
}

function create ()
{
    //  A simple background for our game
    this.add.image(400, 300, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    //  Now let's create some ledges
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // The player and its settings
    player = this.physics.add.sprite(100, 450, 'dude');

    //  Player physics properties. Give the little guy a slight bounce.
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'dude', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {

        //  Give each star a slightly different bounce
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));

    });

    bombs = this.physics.add.group();

    //  The score
    scoreText = this.add.text(16, 50, 'Score: 0', { fontSize: '32px', fill: '#000' });
    healthText = this.add.text(0, 0, '100%', { fontSize: '16px', fill: '#00ff00' });
    healthBar = this.add.graphics();
    updateHealthBar();

    // Таймер
    startTime = new Date(); // Зберігаємо час початку гри
    timer = this.time.addEvent({
        delay: 1000, // 1 секунда
        callback: updateTimer,
        callbackScope: this,
        loop: true
    });

    timerText = this.add.text(700, 16, 'Time: 0', { fontSize: '32px', fill: '#000' });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(player, stars, collectStar, null, this);

    this.physics.add.collider(player, bombs, hitBomb, null, this);

    // Завантажуємо звуки
    starSound = this.sound.add('starSound');
    bombSound = this.sound.add('bombSound');
}

function update ()
{
    if (gameOver)
    {
        return;
    }

    if (cursors.left.isDown)
    {
        player.setVelocityX(-160);

        player.anims.play('left', true);
    }
    else if (cursors.right.isDown)
    {
        player.setVelocityX(160);

        player.anims.play('right', true);
    }
    else
    {
        player.setVelocityX(0);

        player.anims.play('turn');
    }

    if (cursors.up.isDown && player.body.touching.down)
    {
        player.setVelocityY(-330);
    }

    // Update health text position
    healthText.setPosition(player.x - healthText.displayWidth / 2, player.y - 70);
    healthBar.setPosition(player.x - 20, player.y - 40);
}

function collectStar (player, star)
{
    star.disableBody(true, true);

    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

    var bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.allowGravity = false;

    // Відтворюємо звук
    starSound.play();

    // Reset gameOver flag
    gameOver = false;
}

function hitBomb(player, bomb) {
    health -= 50; // Зменшуємо здоров'я на половину

    updateHealthBar(); // Оновлюємо індикатор здоров'я

    // Відтворюємо звук
    bombSound.play();

    if (health <= 0) {
        this.physics.pause();
        player.setTint(0xff0000);
        player.anims.play('turn');
        gameOver = true;
        gameOverText = this.add.text(400, 300, 'Game Over', { fontSize: '64px', fill: '#ff0000' });
        gameOverText.setOrigin(0.5);
        replayButton = this.add.image(400, 400, 'replay').setInteractive();
        replayButton.on('pointerdown', function () {
            resetGame.call(this);
        }, this);
    }
}

function resetGame() {
    gameOverText.destroy(); // Видаляємо текст "Game Over"
    replayButton.destroy(); // Видаляємо кнопку "Replay"
    
    // Повністю скидаємо гру до початкового стану
    score = 0;
    scoreText.setText('Score: 0');
    player.setX(100);
    player.setY(450);
    player.clearTint();
    health = 100; // Скидаємо здоров'я до початкового значення
    updateHealthBar(); // Оновлюємо індикатор здоров'я
    gameOver = false;
    this.scene.restart(); // Перезапускаємо сцену
}

function updateHealthBar() {
    healthText.setText(health + '%');
    healthBar.clear();
    healthBar.fillStyle(0x2ecc71, 1);
    healthBar.fillRect(0, 0, health / 100 * 40, 5);
}

function updateTimer() {
    var elapsedTime = Math.floor((new Date() - startTime) / 1000); // Розраховуємо пройдений час у секундах
    timerText.setText('Time: ' + elapsedTime);
}
