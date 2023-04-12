<template>
	<canvas ref="canvas"></canvas>
	<img src="./assets/loading.gif" alt="" class="loading" />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import Worker from './worker.js?worker'
import { OrthographicCamera, Vector3 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const canvas = ref()

const worker = new Worker()

onMounted(() => {
	const { clientWidth, clientHeight } = canvas.value;
	canvas.value.width = clientWidth;
	canvas.value.height = clientHeight;
	const offCanvas = canvas.value.transferControlToOffscreen()

	function dispatchCameraUpdate(data) {
		worker.postMessage({
			type: 'update-camera',
			data
		})
	}

	let camera;
	function createCamera(data) {
		const { args, position, lookAt} = data;
		camera = new OrthographicCamera(...args)
		camera.position.set(...position);
		camera.lookAt(new Vector3(...lookAt));
		const $camera = new Proxy(camera, {
			get(target, key, receiver) {
				const value = Reflect.get(target, key, receiver)
				if (key === 'lookAt') {
					return function ($target) {
						value.call(target, $target)
						dispatchCameraUpdate({
							position: [camera.position.x, camera.position.y, camera.position.z],
							lookAt: [$target.x, $target.y, $target.z],
							zoom: camera.zoom
						})
					}
				}
				return value
			}
		})
		new OrbitControls($camera, canvas.value)
	}

	worker.postMessage({
		type: 'init',
		data: {
			offCanvas
		}
	}, [offCanvas])

	worker.onmessage = function ({data}) {
		switch (data.type) {
			case "create-camera":
				createCamera(data.data);
				break;
		}
	}


})
</script>

<style>
body {
	margin: 0;
	padding: 0;
}
#app {
	width: 100vw;
	height: 100vh;
	font-size: 0;
}
canvas {
	width: 100%;
	height: 100%;
}

.loading {
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
</style>
