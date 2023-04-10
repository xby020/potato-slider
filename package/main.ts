import * as THREE from 'three';
import { Texture } from 'three';
import { gsap } from 'gsap';

export type PotatoSliderOptions = {
  nodes: HTMLElement;
  images: string[];
};

export default class PotatoSlider {
  imgList: string[] = [];
  loading: boolean = false;
  slider: Texture[] = [];
  container?: HTMLElement;
  private renderer?: THREE.WebGLRenderer;
  private loader?: THREE.TextureLoader;
  private scene?: THREE.Scene;
  private camera?: THREE.OrthographicCamera;
  private mat?: THREE.ShaderMaterial;
  private geometry?: THREE.PlaneGeometry;
  private object?: THREE.Mesh;
  private isAnimating: boolean = false;

  private static vertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
  `;

  private static fragment = `
      
  varying vec2 vUv;

  uniform sampler2D currentImage;
  uniform sampler2D nextImage;

  uniform float dispFactor;

  void main() {

      vec2 uv = vUv;
      vec4 _currentImage;
      vec4 _nextImage;
      float intensity = 0.3;

      vec4 orig1 = texture2D(currentImage, uv);
      vec4 orig2 = texture2D(nextImage, uv);
      
      _currentImage = texture2D(currentImage, vec2(uv.x, uv.y + dispFactor * (orig2 * intensity)));

      _nextImage = texture2D(nextImage, vec2(uv.x, uv.y + (1.0 - dispFactor) * (orig1 * intensity)));

      vec4 finalTexture = mix(_currentImage, _nextImage, dispFactor);

      gl_FragColor = finalTexture;

  }
`;

  /**
   * 加载图片并返回texture
   *
   * @param {string} img 图片地址
   * @return {*}  {Promise<THREE.Texture>} 加载完成的texture
   * @memberof PotatoSlider
   */
  loadImg(img: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      if (this.loader && this.renderer) {
        this.loader.load(
          img,
          (texture) => {
            texture.magFilter = texture.minFilter = THREE.LinearFilter;
            if (this.renderer) {
              texture.anisotropy =
                this.renderer.capabilities.getMaxAnisotropy();
            }
            resolve(texture);
          },
          () => {},
          (err) => {
            reject(err);
          }
        );
      }
    });
  }

  /**
   * 更新图片和材质
   *
   * @param {string[]} images 图片地址数组
   * @memberof PotatoSlider
   */
  async updateSlider(images: string[]) {
    try {
      this.loading = true;
      // 更新本地 images 存储
      this.imgList = images;
      // 更新本地材质存储
      for (const i in this.imgList) {
        const imgUrl = this.imgList[i];
        const texture = await this.loadImg(imgUrl);
        this.slider[i] = texture;
      }
    } finally {
      console.log(this.slider);
      this.loading = false;
    }
  }

  /**
   * 获取渲染尺寸
   *
   * @param {Texture} img 图片texture
   * @return {*}
   * @memberof PotatoSlider
   */
  getRenderSize(img: Texture) {
    let renderW: number, renderH: number;

    const containerWidth = this.container?.clientWidth || 0;
    const containerHeight = this.container?.clientHeight || 0;

    if (img) {
      const { width, height } = img.image;
      const imgRatio = width / height;
      const containerRatio = containerWidth / containerHeight;
      if (imgRatio >= containerRatio) {
        renderH = containerHeight;
        renderW = renderH * imgRatio;
      } else {
        renderW = containerWidth;
        renderH = renderW / imgRatio;
      }
    } else {
      renderW = containerWidth;
      renderH = containerHeight;
    }

    return {
      renderW,
      renderH
    };
  }

  /**
   * 设置渲染尺寸
   *
   * @param {Texture} img 图片texture
   * @memberof PotatoSlider
   */
  setRenderSize(img: Texture) {
    const { renderW, renderH } = this.getRenderSize(img);
    this.renderer?.setSize(renderW, renderH);
  }

  constructor(nodes: HTMLElement, images: string[]) {
    this.imgList = images;
    this.container = nodes;

    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: false
    });
    this.loader = new THREE.TextureLoader();
    this.loader.crossOrigin = 'anonymous';

    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;

    // 初始化渲染容器
    const renderContainer = document.createElement('div');
    renderContainer.style.width = `100%`;
    renderContainer.style.height = `100%`;
    renderContainer.style.overflow = 'hidden';
    renderContainer.style.display = 'flex';
    renderContainer.style.justifyContent = 'center';
    renderContainer.style.alignItems = 'center';
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      const currentSlider = this.mat?.uniforms.currentImage.value;
      if (currentSlider && currentSlider.image) {
        this.setRenderSize(currentSlider);
      }
      this.render();
    });

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x23272a, 1.0);
    this.renderer.setSize(containerWidth, containerHeight);
    renderContainer.appendChild(this.renderer.domElement);
    this.container.appendChild(renderContainer);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x23272a);

    this.camera = new THREE.OrthographicCamera(
      containerWidth / -2,
      containerWidth / 2,
      containerHeight / 2,
      containerHeight / -2,
      1,
      1000
    );
    this.camera.position.z = 1;

    this.geometry = new THREE.PlaneGeometry(
      this.container.clientWidth,
      this.container.clientHeight,
      1
    );
  }

  render() {
    if (this.scene && this.camera) {
      this.renderer?.render(this.scene, this.camera);
    }
  }

  async init() {
    await this.updateSlider(this.imgList);
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        dispFactor: { value: 0.0 },
        currentImage: { value: this.slider[0] },
        nextImage: { value: this.slider[1] }
      },
      vertexShader: PotatoSlider.vertex,
      fragmentShader: PotatoSlider.fragment,
      transparent: true,
      opacity: 1.0
    });
    this.geometry = new THREE.PlaneGeometry(
      this.container?.clientWidth,
      this.container?.clientHeight,
      1
    );
    this.object = new THREE.Mesh(this.geometry, this.mat);
    this.object.position.set(0, 0, 0);

    // set render size
    const { renderW, renderH } = this.getRenderSize(this.slider[0]);
    console.log(renderW, renderH);
    this.renderer?.setSize(renderW, renderH);
    this.scene?.add(this.object);

    // start render
    const animate = () => {
      requestAnimationFrame(animate);
      this.render();
    };
    animate();
  }

  async switchById(id: number) {
    // when is not animating,start animate
    return new Promise<void>((resolve) => {
      if (this.isAnimating) {
        // sleep to wait for the animation to end
        setTimeout(() => {
          this.switchById(id);
        }, 100);
      } else {
        this.isAnimating = true;
        if (this.mat) {
          this.mat.uniforms.nextImage.value = this.slider[id];
          this.setRenderSize(this.slider[id]);
          // image chage effect
          gsap.to(this.mat.uniforms.dispFactor, {
            value: 1,
            ease: 'power1.Out',
            duration: 1,
            onComplete: () => {
              if (this.mat) {
                this.render();
                this.mat.uniforms.currentImage.value = this.slider[id];
                this.mat.uniforms.dispFactor.value = 0.0;
                this.isAnimating = false;
                resolve();
              }
            }
          });
        }
      }
    });
  }
}
