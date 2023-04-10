import PotatoSlider from '../package/main';

// nodes
const nodes = document.querySelector('#app') as HTMLElement;

const images = [
  'https://images.pexels.com/photos/6954509/pexels-photo-6954509.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
  'https://cdn.pixabay.com/photo/2023/03/26/21/11/cactus-7879147_960_720.jpg',
  'https://cdn.pixabay.com/photo/2023/03/22/11/07/seeds-7869190_960_720.jpg'
];

const slider = new PotatoSlider(nodes, images);

slider.init();

let sliderIndex = 1;
setInterval(() => {
  slider.switchById(sliderIndex);
  sliderIndex++;
  if (sliderIndex > 2) {
    sliderIndex = 0;
  }
}, 5000);
