var config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 700,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var currentTurn = 'player'; // Изначально ходит игрок

function preload() {
    this.load.image('hero', 'hero.png');
    this.load.image('enemy', 'enemy.png');
    this.load.image('ability1', 'ability1.png');
    this.load.image('ability2', 'ability2.png');
    this.load.image('ability3', 'ability3.png');
}

function update() {
    // Игровая логика обновления здесь
}


function create() {
    this.hero = this.add.sprite(100, 220, 'hero');
    this.enemy = this.add.sprite(700, 220, 'enemy');

    this.heroHealth = 80;
    this.enemyHealth = 100;

    this.heroHealthBar = this.add.graphics();
    this.enemyHealthBar = this.add.graphics();
    updateHealthBars.call(this);

    // Размер промежутка между иконками способностей
    let gap = 140; // Промежуток в пикселях между иконками способностей

    // Расположение иконок способностей в центре снизу с учетом промежутка
    let ability1X = this.sys.game.config.width / 2 - gap; // Сдвиг на gap пикселей влево от центра
    let ability2X = this.sys.game.config.width / 2; // Центр
    let ability3X = this.sys.game.config.width / 2 + gap; // Сдвиг на gap пикселей вправо от центра
    let abilitiesY = this.sys.game.config.height - 135; // Отступ от низа
    // Фан факт, координаты привязаны к центру элемента, а не к его верхней, либо другой границе

    this.ability1 = this.add.sprite(ability1X, abilitiesY, 'ability1').setInteractive();
    this.ability2 = this.add.sprite(ability2X, abilitiesY, 'ability2').setInteractive();
    this.ability3 = this.add.sprite(ability3X, abilitiesY, 'ability3').setInteractive();

    console.log('ability1 height:', this.ability1.displayHeight);

    this.ability1.on('pointerdown', () => castAbility.call(this, 'damage'));
    this.ability2.on('pointerdown', () => castAbility.call(this, 'heal'));
    this.ability3.on('pointerdown', () => castAbility.call(this, 'ult'));


    // Добавление текста для отображения текущего хода
    this.currentTurnText = this.add.text(500, 35, 'Player\'s Turn', { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' }).setOrigin(0.5);


    // Состояние скиллов
    this.skillCooldowns = {
        heal: 0,
        ultCharge: 0,
        ultReady: false
    };

    this.ultChargeNeeded = 2;  // Нужно 2 использования обычной атаки для ульта
    this.healCooldown = 2;     // Кулдаун хила - 2 хода

    // Индикаторы для способностей
    this.healCooldownText = this.add.text(this.ability2.x, this.ability2.y + 35, '', { fontFamily: 'Arial', fontSize: 16, color: '#ffffff', align: 'center' }).setOrigin(0.5, 0.5);
    this.ultChargeBar = this.add.graphics();

    // Обновляем видимость и доступность способностей
    updateAbilityAvailability.call(this);
}

function updateAbilityAvailability() {
    // Управление доступностью хила
    this.ability2.setAlpha(this.skillCooldowns.heal > 0 ? 0.5 : 1);
    if (this.skillCooldowns.heal > 0) {
        this.skillCooldowns.heal--;
    }

    // Управление доступностью хила
    this.ability2.setAlpha(this.skillCooldowns.heal > 0 ? 0.5 : 1);
    this.healCooldownText.setText(this.skillCooldowns.heal > 0 ? 'Cooldown: ' + this.skillCooldowns.heal : '');

    // Управление накоплением и доступностью ульты
    this.ability3.setAlpha(this.skillCooldowns.ultReady ? 1 : 0.5);
    updateUltChargeBar.call(this);
}


function updateUltChargeBar() {
    // Скрываем прогресс бар
    if (this.skillCooldowns.ultReady) {
        this.ultChargeBar.clear(); // Очищаем прогресс бар
        this.ability3.setTint(0x00ff00); // Устанавливаем зелёную обводку
    }
    else {
        this.ability3.clearTint(); // Снимаем обводку
        this.ultChargeBar.clear();
        this.ultChargeBar.fillStyle(0x444444, 0.8);  // Фон шкалы
        this.ultChargeBar.fillRect(this.ability3.x - 40, this.ability3.y + 50, 80, 12);  // Базовый фон

        if (!this.skillCooldowns.ultReady) {
            this.ultChargeBar.fillStyle(0x00ff00, 0.8);  // Зеленый цвет шкалы
            this.ultChargeBar.fillRect(this.ability3.x - 40, this.ability3.y + 50, 80 * (this.skillCooldowns.ultCharge / this.ultChargeNeeded), 12);
        }
    }

}


function updateHealthBars() {
    this.heroHealthBar.clear();
    this.heroHealthBar.fillStyle(0x00ff00);
    this.heroHealthBar.fillRect(50, 367, this.heroHealth * 2, 10);

    this.enemyHealthBar.clear();
    this.enemyHealthBar.fillStyle(0xff0000);
    this.enemyHealthBar.fillRect(600, 367, this.enemyHealth * 2, 10);
}


function castAbility(type) {
    if (currentTurn !== 'player') return;  // Если не ход игрока, игнорируем нажатия

    switch (type) {
        case 'damage':
            if (this.skillCooldowns.ultCharge < this.ultChargeNeeded) {
                this.skillCooldowns.ultCharge++;
                if (this.skillCooldowns.ultCharge >= this.ultChargeNeeded) {
                    this.skillCooldowns.ultReady = true;
                }
            }
            this.enemyHealth -= 10;
            showModifier.call(this, this.enemy, -10, false);
            break;
        case 'heal':
            if (this.skillCooldowns.heal > 0) {
                console.log('Heal is on cooldown');
                return;
            }
            this.heroHealth += 30;
            this.skillCooldowns.heal = this.healCooldown;  // Восстанавливаем кулдаун
            if (this.heroHealth > 100) this.heroHealth = 100;
            showModifier.call(this, this.hero, 30, true);
            break;
        case 'ult':
            if (!this.skillCooldowns.ultReady) {
                console.log('Ult is not ready');
                return;
            }
            this.enemyHealth -= 30;
            this.skillCooldowns.ultReady = false;
            this.skillCooldowns.ultCharge = 0;
            showModifier.call(this, this.enemy, -30, false);
            break;
    }
    this.enemyHealth = Math.max(0, this.enemyHealth);
    updateHealthBars.call(this);
    updateAbilityAvailability.call(this);
    updateUltChargeBar.call(this); // Обновляем шкалу ульты после действия

    // Переключаем ход на врага
    currentTurn = 'enemy';
    this.currentTurnText.setText('Enemy\'s Turn');
    this.time.delayedCall(1000, enemyAttack, [], this);
}




function enemyAttack() {
    // Ход врага (простая атака)
    console.log('Enemy attacks with a basic attack');
    this.heroHealth -= 10;
    showModifier.call(this, this.hero, -10, false);
    this.heroHealth = Math.max(0, this.heroHealth);
    updateHealthBars.call(this);

    // Переключаем ход обратно на игрока
    currentTurn = 'player';
    this.currentTurnText.setText('Player\'s Turn');
}


function showModifier(sprite, value, isHealing) {
    let color = isHealing ? '#00ff00' : '#ff0000';  // Зелёный для исцеления, красный для урона
    let modifierText = this.add.text(sprite.x + 180, sprite.y - 50, `${isHealing ? '+' : '-'}${Math.abs(value)}`, { fontFamily: 'Arial', fontSize: 24, color: color }).setOrigin(0.5);
    this.tweens.add({
        targets: modifierText,
        y: sprite.y - 140,  // Движение текста вверх на 30 пикселей
        alpha: 0.3,          // Плавное исчезновение
        duration: 2000,     // Продолжительность анимации в миллисекундах
        ease: 'Power2',
        onComplete: function () { modifierText.destroy(); }  // Удаление текста после завершения анимации
    });
}
