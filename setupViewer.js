// setupViewer.js

import { getUrlQueryParam } from './utils.js';

export async function setupTryOnViewer() {
    const {
        addBasePlugins,
        CameraUiPlugin,
        HierarchyUiPlugin,
        PickingPlugin,
        SSRPlugin,
        TonemapPlugin,
        TweakpaneUiPlugin,
        ViewerApp,
        VignettePlugin,
        DropzonePlugin,
        DiamondPlugin,
    } = window.webgi;

    const { RingTryonPlugin, WebCameraBackgroundPlugin, WebCameraPlugin } = window['ij_vto'];

    // Initialize the viewer
    const viewer = new ViewerApp({
        canvas: document.getElementById('webgi-canvas'),
    });
    viewer.renderer.displayCanvasScaling = 2;

    // Add and setup plugins
    await addBasePlugins(viewer, { interactionPrompt: false });
    const diamondPlugin = await viewer.addPlugin(DiamondPlugin);

    diamondPlugin.setKey('KQAK6AGRQX5SGBAEQ4MWPM5QNWJN2AP2-B2CRTBZ9TQ');
    const tryon = await viewer.addPlugin(RingTryonPlugin);

    const editMode = getUrlQueryParam('debug') !== null || getUrlQueryParam('edit') !== null;

    if (editMode) {
        viewer.container.style.width = 'calc(100% - 340px)';
        await viewer.addPlugin(HierarchyUiPlugin);
        await viewer.addPlugin(PickingPlugin);
        await viewer.addPlugin(CameraUiPlugin);
        await viewer.addPlugin(DropzonePlugin);

        const uiPlugin = await viewer.addPlugin(TweakpaneUiPlugin);
        uiPlugin.setupPlugins(
            RingTryonPlugin,
            PickingPlugin,
            TonemapPlugin,
            CameraUiPlugin,
            HierarchyUiPlugin,
            DropzonePlugin,
            SSRPlugin,
            VignettePlugin,
            WebCameraPlugin,
            WebCameraBackgroundPlugin
        );
    }

    const gemEnv = 'https://playground.ijewel3d.com/assets/lightmaps/gem/gem-2.exr';
    const metalEnv = 'https://playground.ijewel3d.com/assets/lightmaps/metal/lightmap-2.hdr';

    // Set environment map
    const separateEnv = false;
    if (separateEnv) {
        await viewer.setEnvironmentMap(metalEnv);
        diamondPlugin.envMap = await viewer.load(gemEnv);
        viewer.scene.fixedEnvMapDirection = true;
    }

    // Load models
    let ring1 = await viewer.load('https://rio-assets.s3.eu-west-2.amazonaws.com/rings/high-quality.glb');
    let ring2 = await viewer.load('https://rio-assets.s3.eu-west-2.amazonaws.com/rings/high-quality+(1).glb');
    ring1.visible = false;

    if (!viewer.scene.environment) await viewer.setEnvironmentMap(gemEnv);

    viewer.scene.addEventListener('addSceneObject', () => {
        const shadowObj = viewer.scene.findObjectsByName('shadow')[0];
        const shadow = shadowObj?.modelObject.material;
        if (!shadow) return;
        shadow.visible = false;
        shadow.opacity = 0.65;
        shadow.userData.renderToDepth = false;
    });

    const modelPath = getUrlQueryParam('m') || getUrlQueryParam('model') || 'https://rio-assets.s3.eu-west-2.amazonaws.com/rings/high-quality+(1).glb';

    if (modelPath) {
        await viewer.load(modelPath);
        await viewer.load(modelPath.replace('.glb', '.json'));

        const startAr = document.getElementById('start-ar');
        const flipCamera = document.getElementById('flip-camera');
        const saveImage = document.getElementById('save-image');

        // Make sure the "Start AR" button is visible initially, and others are hidden
        startAr.style.display = 'block';
        flipCamera.style.display = 'none';
        saveImage.style.display = 'none';

        startAr.onclick = () => {
            if (!tryon.running) tryon.start();
            startAr.style.display = 'none';
            flipCamera.style.display = 'block';
            saveImage.style.display = 'block';
        };

        flipCamera.onclick = () => tryon.flipCamera();
        saveImage.onclick = () => tryon.saveImage();
    } else if (!editMode) {
        alert('No model set to load');
    }
}
