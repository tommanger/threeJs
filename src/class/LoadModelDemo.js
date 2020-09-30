import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader";
import BasicCharacterControls from "./BasicCharacterControls";
import men from "../resources/men/malcolm.fbx"
import walking from "../resources/men/walking.fbx"
import Idle from "../resources/men/Idle.fbx"
import standingJump from "../resources/men/standingJump.fbx"

export default class LoadModelDemo {
    constructor() {
        this._Initialize();
    }

    _Initialize() {
        this._threejs = new THREE.WebGLRenderer({
            antialias: true,
        });
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this._threejs.domElement);

        window.addEventListener('resize', () => {
            this._OnWindowResize();
        }, false);

        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 1000.0;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(75, 20, 0);

        this._scene = new THREE.Scene();

        let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        light.position.set(20, 100, 10);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.001;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.left = 100;
        light.shadow.camera.right = -100;
        light.shadow.camera.top = 100;
        light.shadow.camera.bottom = -100;
        this._scene.add(light);

        light = new THREE.AmbientLight(0xFFFFFF, 4.0);
        this._scene.add(light);

        const controls = new OrbitControls(this._camera, this._threejs.domElement);
        controls.target.set(0, 20, 0);
        controls.update();

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 1000, 10, 10),
            new THREE.MeshStandardMaterial({
                color: 0x202020,
            }));
        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this._scene.add(plane);

        this._mixers = [];
        this._previousRAF = null;
        this.walkAnimation = null;

        this._LoadAnimatedModel();
        this._RAF();
    }

    _LoadAnimatedModel() {
        const loader = new FBXLoader();
        loader.load(men, (fbx) => {
            fbx.scale.setScalar(0.1);
            fbx.traverse(c => {
                c.castShadow = true;
            });

            const params = {
                target: fbx,
                camera: this._camera,
            }
            this._controls = new BasicCharacterControls(params);

            const anim = new FBXLoader();
            anim.load(Idle, (anim) => {
                const m = new THREE.AnimationMixer(fbx);
                this._mixers.push(m);
                this.standAnimation = m.clipAction(anim.animations[0]);
                this.standAnimation.play();
            });
            anim.load(walking, (anim) => {
                const m = new THREE.AnimationMixer(fbx);
                this._mixers.push(m);
                this.walkAnimation = m.clipAction(anim.animations[0]);
            });
            anim.load(standingJump, (anim) => {
                const m = new THREE.AnimationMixer(fbx);
                this._mixers.push(m);
                this.standingJumpAnimation = m.clipAction(anim.animations[0]);
            });

            this._scene.add(fbx);
        });
    }

    _OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth, window.innerHeight);
    }

    _RAF() {
        requestAnimationFrame((t) => {
            if (this._previousRAF === null) {
                this._previousRAF = t;
            }

            this._RAF();

            this._threejs.render(this._scene, this._camera);
            this._Step(t - this._previousRAF);
            this._previousRAF = t;
        });
    }

    _Step(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        if (this._mixers) {
            this._mixers.map(m => m.update(timeElapsedS));
        }

        if (this._controls) {
            this._controls.Update(timeElapsedS);

            this.handleMoveAnimations();
        }
    }

    handleMoveAnimations() {
        if (this._controls._move.forward || this._controls._move.backward) {
            this.walkAnimation && this.walkAnimation.play();
            this.standAnimation && this.standAnimation.stop();
        } else {
            this.walkAnimation && this.walkAnimation.stop();
            this.standAnimation && this.standAnimation.play();
        }
        if (this._controls._move.jump) {
            this.standAnimation && this.standAnimation.stop();
            this.standingJumpAnimation && this.standingJumpAnimation.play();
        } else {
            this.standingJumpAnimation && this.standingJumpAnimation.stop();
        }
    }
}
