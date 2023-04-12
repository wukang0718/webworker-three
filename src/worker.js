import {
    OrthographicCamera,
    Scene,
    WebGLRenderer,
    BoxGeometry,
    MeshLambertMaterial,
    Mesh,
    AmbientLight,
    Vector3
} from 'three'


self.onmessage = function ({ data }) {
    switch (data.type) {
        case 'init':
            init(data.data)
            break;
        case 'update-camera':
            updateCamera(data.data)
            break;
    }
}

let scene;
let camera;
let renderer;

function init(data) {
    const { offCanvas } = data
    const { width, height } = offCanvas
    initScene()
    initLight()
    initCamera(width, height)
    initRenderer(offCanvas, width, height)
    render()
}
// 初始化相机
function initCamera(w, h) {
    const k = w / h;
    const s = 300;
    camera = new OrthographicCamera(-s * k, s * k, s, -s, 1, 1000)
    camera.position.set(550, 600, 100);
    camera.lookAt(scene.position);

    dispatchCreateCamera({
        args: [-s * k, s * k, s, -s, 1, 1000],
        position: [550, 600, 100],
        lookAt: [scene.position.x, scene.position.y, scene.position.z]
    })
}
// 通知主线程camera创建成功
function dispatchCreateCamera(data) {
    self.postMessage({
        type: 'create-camera',
        data: data
    })
}

// 初始化渲染器
function initRenderer(canvas, w, h) {
    renderer = new WebGLRenderer({canvas})
    renderer.setSize(w, h, false);
    renderer.setClearColor(0xb9d3ff, 1)
}

// 初始化场景
function initScene() {
    scene = new Scene();
    function createMesh(i) {
        // 立方体网格模型
        const geometry1 = new BoxGeometry(10, 10, 10);
        const material1 = new MeshLambertMaterial({
            color: 0x0000ff
        })
        const mesh1 = new Mesh(geometry1, material1);
        mesh1.translateZ(i * 10)
        scene.add(mesh1);
    }

    for (let i = 0; i < 100000; i ++) {
        createMesh(i)
    }
}

// 初始化环境光
function initLight() {
    const ambient = new AmbientLight(0x444444)
    scene.add(ambient)
}

function updateCamera(data) {
    const { position, lookAt, zoom } = data;
    camera.zoom = zoom;
    camera.position.set(...position)
    camera.lookAt(new Vector3(...lookAt))
    // 修改了zoom之后需要调用updateProjectionMatrix
    camera.updateProjectionMatrix()
}

// 开始渲染
function render() {
    function _render() {
        renderer.render(scene, camera);
        self.requestAnimationFrame(_render)
    }
    _render()
}
