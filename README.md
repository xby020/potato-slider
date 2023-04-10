# Potato slider

> an another fancy web slider

## Install

```bash
npm install @xby020/potato-slider
```

## Usage

```js
import PotatoSlider from '@xby020/potato-slider'

const dom = document.getElementById('slider');
const images = ['imgUrl1','imgUrl2','imgUrl3'];

const slider = new PotatoSlider(dom,images);

// promise
await slider.init();
```
### Switch
  
  ```js
  // switch by id, which is the index of images
  slider.switchById(1);
  ```