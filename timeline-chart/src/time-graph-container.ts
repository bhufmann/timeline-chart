import * as PIXI from "pixi.js-legacy";
import { TimeGraphRectangle } from "./components/time-graph-rectangle";
import { TimeGraphLayer } from "./layer/time-graph-layer";
import { TimeGraphStateController } from "./time-graph-state-controller";
import { TimeGraphUnitController } from "./time-graph-unit-controller";

export interface TimeGraphContainerOptions {
    id: string;
    width: number;
    height: number;
    backgroundColor?: number;
    lineColor?: number;
    transparent?: boolean;
    classNames?: string;
}

export class TimeGraphContainer {

    protected stage: PIXI.Container;
    protected _canvas: HTMLCanvasElement;

    protected stateController: TimeGraphStateController;

    protected layers: TimeGraphLayer[];

    private application: PIXI.Application;

    private background: TimeGraphRectangle;

    constructor(protected config: TimeGraphContainerOptions, protected unitController: TimeGraphUnitController, protected extCanvas?: HTMLCanvasElement) {
        let canvas: HTMLCanvasElement
        if (!extCanvas) {
            canvas = document.createElement('canvas');
        } else {
            canvas = extCanvas;
        }

        const noWebgl2 = !PIXI.utils.isWebGLSupported() || !canvas.getContext('webgl2');
        canvas.style.width = config.width + 'px';
        canvas.style.height = config.height + 'px';
        canvas.width = config.width;
        canvas.height = config.height;
        canvas.id = config.id;
        canvas.className = `time-graph-canvas ${this.config.classNames || ''}`;
        const ratio = window.devicePixelRatio;
        this.application = new PIXI.Application({
            width: canvas.width,
            height: canvas.height,
            view: canvas,
            backgroundColor: config.backgroundColor,
            transparent: config.transparent,
            antialias: true,
            resolution: ratio,
            autoDensity: true,
            forceCanvas: noWebgl2
        });

        console.log('contructor: width ' + canvas.width);
        console.log('contructor: height ' + canvas.height);
        this.stage = this.application.stage;
        this._canvas = this.application.view;

        this.stateController = new TimeGraphStateController(canvas, unitController);

        this.layers = [];

        this.background = new TimeGraphRectangle({
            opacity: 1,
            position: {
                x: 0, y: 0
            },
            height: this.canvas.height,
            width: this.canvas.width,
            color: config.backgroundColor,
        });
        this.background.render();
        this.stage.addChild(this.background.displayObject);
    }

    get canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    // if canvas size has changed displayWidth need to be updated for zoomfactor
    updateCanvas(newWidth: number, newHeight: number, newColor?: number, lineColor?: number) {
        this.config.width = newWidth;
        this.config.height = newHeight;
        if (newColor) {
            this.config.backgroundColor = newColor;
        }

        this.application.renderer.view.style.width = newWidth + 'px';
        this.application.renderer.view.style.height = newHeight + 'px'
        // canvas.style.height = config.height + 'px';

        // const opts: TimeGraphLayerOptions = { lineColor, newWidth, newHeight };
        this.application.renderer.resize(newWidth, newHeight);

        console.log('updateCanvas: view width ' + this.application.view.width);
        console.log('updateCanvas: view height ' + this.application.view.height);

        console.log('updateCanvas: canvas width ' + this._canvas.width);
        console.log('updateCanvas: canvas height ' + this._canvas.height);

        this.stateController.updateDisplayWidth();
        this.stateController.updateDisplayHeight();

        this.background.update({
            position: {
                x: 0, y: 0
            },
            height: newHeight,
            width: newWidth,
            color: newColor
        });

        // this.layers.forEach(l => l.update(opts));
        this.stage.width = newWidth;
        // this.application.renderer.render(this.stage);
    }

    addLayers(layers: TimeGraphLayer[]) {
        layers.forEach(layer => this.addLayer(layer));
    }

    protected addLayer(layer: TimeGraphLayer) {
        this.layers.push(layer);
        layer.initializeLayer(this._canvas, this.stage, this.stateController, this.unitController);
    }

    destroy() {
        this.layers.forEach(l => l.destroy());
        this.application.destroy(true);
    }
}
