// Герой обложки № 18: та же доска Гальтона, что в сценах (scenes/kit.mjs): алюминиевая рама, стекло,
// гвозди треугольником, стальные шарики уже сложились в ячейках в колокол.
import { makeBoard, makeBalls } from './scenes/kit.mjs';

export default function (THREE) {
  const object = new THREE.Group();
  const board = makeBoard();
  const balls = makeBalls(260, { seed: 18 });
  balls.set(100, () => 0, {}, 1);
  object.add(board.grp, balls.im);
  return { object, cam: { az: 24, el: 8, dist: 22.5, target: [0, 3.4, 0], fov: 24 } };
}
