class FirstPersonShooter {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.enemies = [];
        this.bullets = [];
        this.obstacles = [];
        
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.health = 100;
        this.ammo = 30;
        this.maxAmmo = 30;
        
        this.moveSpeed = 0.1;
        this.mouseSpeed = 0.002;
        
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            r: false
        };
        
        this.isPointerLocked = false;
        this.enemySpawnRate = 0.005;
    }
    
    init() {
        console.log("Initializing FPS game...");
        
        try {
            this.createScene();
            this.createLighting();
            this.createEnvironment();
            this.setupControls();
            this.animate();
            console.log("Game initialized successfully!");
        } catch (error) {
            console.error("Error initializing game:", error);
        }
    }
    
    createScene() {
        console.log("Creating scene...");
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        const container = document.getElementById('gameContainer');
        if (container) {
            container.appendChild(this.renderer.domElement);
            console.log("Renderer added to container");
        } else {
            console.error("Game container not found!");
        }
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    createLighting() {
        console.log("Creating lighting...");
        
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
    }
    
    createEnvironment() {
        console.log("Creating environment...");
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create some obstacles
        this.createObstacles();
        
        console.log("Environment created");
    }
    
    createObstacles() {
        const obstacleGeometry = new THREE.BoxGeometry(2, 3, 2);
        const obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        const positions = [
            [10, 1.5, 10], [-10, 1.5, -10], [15, 1.5, -15], [-15, 1.5, 15],
            [20, 1.5, 0], [-20, 1.5, 0], [0, 1.5, 20], [0, 1.5, -20]
        ];
        
        positions.forEach(pos => {
            const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
            obstacle.position.set(pos[0], pos[1], pos[2]);
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            this.obstacles.push(obstacle);
            this.scene.add(obstacle);
        });
    }
    
    setupControls() {
        console.log("Setting up controls...");
        
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyW': this.keys.w = true; break;
                case 'KeyA': this.keys.a = true; break;
                case 'KeyS': this.keys.s = true; break;
                case 'KeyD': this.keys.d = true; break;
                case 'KeyR': this.reload(); break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch(event.code) {
                case 'KeyW': this.keys.w = false; break;
                case 'KeyA': this.keys.a = false; break;
                case 'KeyS': this.keys.s = false; break;
                case 'KeyD': this.keys.d = false; break;
            }
        });
        
        // Mouse events
        document.addEventListener('click', () => {
            if (this.gameStarted && !this.isPointerLocked) {
                this.renderer.domElement.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
        });
        
        document.addEventListener('mousemove', (event) => {
            if (!this.isPointerLocked || !this.gameStarted) return;
            
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;
            
            this.camera.rotation.y -= movementX * this.mouseSpeed;
            this.camera.rotation.x -= movementY * this.mouseSpeed;
            this.camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.camera.rotation.x));
        });
        
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0 && this.isPointerLocked && this.gameStarted) {
                this.shoot();
            }
        });
    }
    
    shoot() {
        if (this.ammo <= 0) return;
        
        this.ammo--;
        this.updateUI();
        
        const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        
        bullet.position.copy(this.camera.position);
        
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        bullet.userData = {
            direction: direction,
            speed: 1,
            life: 200
        };
        
        this.bullets.push(bullet);
        this.scene.add(bullet);
        
        console.log("🔫 Shot fired!");
    }
    
    reload() {
        if (this.ammo < this.maxAmmo) {
            this.ammo = this.maxAmmo;
            this.updateUI();
            console.log("🔄 Reloaded!");
        }
    }
    
    spawnEnemy() {
        const enemyGeometry = new THREE.BoxGeometry(1, 2, 1);
        const enemyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 25;
        enemy.position.set(
            Math.cos(angle) * distance,
            1,
            Math.sin(angle) * distance
        );
        
        enemy.castShadow = true;
        enemy.userData = {
            health: 3,
            speed: 0.02
        };
        
        this.enemies.push(enemy);
        this.scene.add(enemy);
    }
    
    updatePlayer() {
        if (!this.gameStarted || this.gameOver) return;
        
        const direction = new THREE.Vector3();
        
        if (this.keys.w) direction.z -= 1;
        if (this.keys.s) direction.z += 1;
        if (this.keys.a) direction.x -= 1;
        if (this.keys.d) direction.x += 1;
        
        if (direction.length() > 0) {
            direction.normalize();
            direction.applyQuaternion(this.camera.quaternion);
            direction.y = 0;
            direction.normalize();
            
            const newPosition = this.camera.position.clone();
            newPosition.add(direction.multiplyScalar(this.moveSpeed));
            
            if (!this.checkCollision(newPosition)) {
                this.camera.position.copy(newPosition);
            }
        }
    }
    
    checkCollision(position) {
        for (let obstacle of this.obstacles) {
            const distance = position.distanceTo(obstacle.position);
            if (distance < 2.5) {
                return true;
            }
        }
        return false;
    }
    
    updateEnemies() {
        if (!this.gameStarted || this.gameOver) return;
        
        // Spawn enemies
        if (Math.random() < this.enemySpawnRate) {
            this.spawnEnemy();
        }
        
        // Update existing enemies
        this.enemies.forEach((enemy, enemyIndex) => {
            const direction = new THREE.Vector3()
                .subVectors(this.camera.position, enemy.position)
                .normalize();
            
            enemy.position.add(direction.multiplyScalar(enemy.userData.speed));
            
            // Check if enemy reached player
            const distance = enemy.position.distanceTo(this.camera.position);
            if (distance < 2) {
                this.takeDamage(10);
                this.scene.remove(enemy);
                this.enemies.splice(enemyIndex, 1);
            }
        });
    }
    
    updateBullets() {
        this.bullets.forEach((bullet, bulletIndex) => {
            // Move bullet
            bullet.position.add(
                bullet.userData.direction.clone().multiplyScalar(bullet.userData.speed)
            );
            bullet.userData.life--;
            
            // Remove old bullets
            if (bullet.userData.life <= 0) {
                this.scene.remove(bullet);
                this.bullets.splice(bulletIndex, 1);
                return;
            }
            
            // Check bullet-enemy collisions
            this.enemies.forEach((enemy, enemyIndex) => {
                if (bullet.position.distanceTo(enemy.position) < 1) {
                    enemy.userData.health--;
                    
                    // Remove bullet
                    this.scene.remove(bullet);
                    this.bullets.splice(bulletIndex, 1);
                    
                    // Check if enemy is dead
                    if (enemy.userData.health <= 0) {
                        this.scene.remove(enemy);
                        this.enemies.splice(enemyIndex, 1);
                        this.score += 10;
                        this.updateUI();
                        console.log("💥 Enemy destroyed! Score: " + this.score);
                    }
                }
            });
        });
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.endGame();
        }
        this.updateUI();
    }
    
    updateUI() {
        const healthEl = document.getElementById('health');
        const scoreEl = document.getElementById('score');
        const ammoEl = document.getElementById('ammo');
        
        if (healthEl) healthEl.textContent = this.health;
        if (scoreEl) scoreEl.textContent = this.score;
        if (ammoEl) ammoEl.textContent = this.ammo;
    }
    
    endGame() {
        this.gameOver = true;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
        document.exitPointerLock();
        console.log("Game Over! Final score: " + this.score);
    }
    
    restart() {
        console.log("Restarting game...");
        this.gameOver = false;
        this.health = 100;
        this.score = 0;
        this.ammo = 30;
        
        // Clear enemies and bullets
        this.enemies.forEach(enemy => this.scene.remove(enemy));
        this.bullets.forEach(bullet => this.scene.remove(bullet));
        this.enemies = [];
        this.bullets = [];
        
        // Reset camera position
        this.camera.position.set(0, 2, 0);
        this.camera.rotation.set(0, 0, 0);
        
        this.updateUI();
        document.getElementById('gameOver').style.display = 'none';
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updatePlayer();
        this.updateEnemies();
        this.updateBullets();
        
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Global game instance
let game;

function startGame() {
    console.log("Starting game...");
    document.getElementById('instructions').style.display = 'none';
    
    if (!game) {
        game = new FirstPersonShooter();
        game.init();
    }
    
    game.gameStarted = true;
    game.updateUI();
}

function restartGame() {
    if (game) {
        game.restart();
    }
}