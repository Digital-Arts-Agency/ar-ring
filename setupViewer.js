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
        CameraView,
    } = window.webgi;

    const { RingTryonPlugin, WebCameraBackgroundPlugin, WebCameraPlugin } = window['ij_vto'];

    // Initialize the viewer
    const viewer = new ViewerApp({
        canvas: document.getElementById('webgi-canvas'),
    });
    viewer.renderer.displayCanvasScaling = 2;

    console.log('viewer', viewer);



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
    let ring1 = await viewer.load('https://rio-assets.s3.eu-west-2.amazonaws.com/ar-rings-test/rio-ring3.glb');
    // let ring2 = await viewer.load('https://rio-assets.s3.eu-west-2.amazonaws.com/ar-rings-test/ring3.glb');
    let ring2 = await viewer.load('https://rio-assets.s3.eu-west-2.amazonaws.com/ar-rings-test/rio-ring2.glb');
    let ring4 = await viewer.load('https://rio-assets.s3.eu-west-2.amazonaws.com/ar-rings-test/rio-ring1.glb');
    ring1.visible = true;
    ring2.visible = false;

    ring4.visible = false;

    console.log('loaded models', ring1, ring2, ring4);
    console.log('viewer.scene', viewer.scene);



    if (!viewer.scene.environment) await viewer.setEnvironmentMap(gemEnv);

    viewer.scene.addEventListener('addSceneObject', () => {
        const shadowObj = viewer.scene.findObjectsByName('shadow')[0];
        const shadow = shadowObj?.modelObject.material;
        if (!shadow) return;
        shadow.visible = false;
        shadow.opacity = 0.65;
        shadow.userData.renderToDepth = false;
    });

    const modelPath = getUrlQueryParam('m') || getUrlQueryParam('model') || '';

    if (modelPath) {
        await viewer.load(modelPath);
        await viewer.load(modelPath.replace('.glb', '.json'));

        let view = new CameraView();
        view.position = new Vector3(5, 5, 5);
        view.up = new Vector3(0, 1, 0);
        let camViewPlugin = viewer.plugins.CameraViews;
        camViewPlugin.camViews.push(view)
        console.log('view', view);
        console.log('camViewPlugin', camViewPlugin);
        await camViewPlugin.animateToView(view, 500);


        // Toggle the visibility of the model buttons when the Ring Models button is clicked
        document.getElementById('ring-models-button').addEventListener('click', () => {
            const modelButtons = document.getElementById('model-buttons');
            modelButtons.classList.toggle('active');
        });

        // Example: Add event listeners for model buttons to load different models
        document.getElementById('model-1').addEventListener('click', () => {
            console.log('Loading Model 1...');
            // Add your logic to load Model 1 here
            ring1.visible = true;
            ring2.visible = false;
            // ring3.visible = false;
            ring4.visible = false;
            viewer.scene.setDirty({ sceneUpdate: true });
            // viewer.scene.renderer.refreshPipeline();
        });


        document.getElementById('model-3').addEventListener('click', () => {
            console.log('Loading Model 3...');
            // Add your logic to load Model 3 here

            ring1.visible = false;
            ring2.visible = true;
            // ring3.visible = true;
            ring4.visible = false
            viewer.scene.setDirty({ sceneUpdate: true });
            // viewer.scene.renderer.refreshPipeline();
        });

        document.getElementById('model-4').addEventListener('click', () => {
            console.log('Loading Model 4...');
            // Add your logic to load Model 4 here
            ring1.visible = false;
            ring2.visible = false;
            // ring3.visible = false;
            ring4.visible = true;
            viewer.scene.setDirty({ sceneUpdate: true });
            // viewer.scene.renderer.refreshPipeline();
        });

        const startAr = document.getElementById('start-ar');
        const flipCamera = document.getElementById('flip-camera');
        const saveImage = document.getElementById('save-image');
        const exitAr = document.getElementById('exit-ar');


        // Make sure the "Start AR" button is visible initially, and others are hidden
        startAr.style.display = 'block';
        flipCamera.style.display = 'none';
        saveImage.style.display = 'none';
        exitAr.style.display = 'none';

        startAr.onclick = () => {
            if (!tryon.running) tryon.start();
            startAr.style.display = 'none';
            flipCamera.style.display = 'block';
            saveImage.style.display = 'block';
            exitAr.style.display = 'block';

            // Hide the model buttons when AR is started
            const modelButtons = document.getElementById('model-buttons');
            const ringModelsButton = document.getElementById('ring-models-button');
            modelButtons.style.display = 'none';  // Hide the model buttons
            ringModelsButton.style.display = 'none';  // Hide the Ring Models button
        };

        flipCamera.onclick = () => tryon.flipCamera();
        saveImage.onclick = () => tryon.saveImage();

        exitAr.onclick = () => {
            tryon.stop();
            startAr.style.display = 'block';
            flipCamera.style.display = 'none';
            saveImage.style.display = 'none';
            exitAr.style.display = 'none';
            window.location.reload();

            viewer.scene.setDirty({ sceneUpdate: true });
            viewer.scene.renderer.refreshPipeline();

            // Show the model buttons when AR is exited
            const modelButtons = document.getElementById('model-buttons');
            const ringModelsButton = document.getElementById('ring-models-button');
            // modelButtons.style.display = 'block';  // Show the model buttons
            ringModelsButton.style.display = 'block';  // Show the Ring Models button
        };
    } else if (!editMode) {
        alert('No model set to load');
    }
}
