/**
 * @type import('@types/matter-js')
 */
export const Matter = Phaser.Physics.Matter.Matter;

const oldCanCollide = Matter.Detector.canCollide;
Matter.Detector.canCollide = (filterA, filterB) => {
  if (
    (filterA.connections && filterA.connections.includes(filterB.group)) ||
    (filterB.connections && filterB.connections.includes(filterA.group))
  )
    return false;
  return oldCanCollide(filterA, filterB);
};

/**
 * Connects two bodies at position of `child`
 * @param {Phaser.Scene} scene
 * @param {Matter.Body} parent
 * @param {Matter.Body} child
 */
export const stiffConnect = (scene, parent, child, options = {}) => {
  const {
    length = 0,
    stiffness = 1,
    // group = Matter.Body.nextGroup(true),
    ..._options
  } = options;

  const fA = parent.collisionFilter;
  const fB = child.collisionFilter;
  if (!fA.group) fA.group = Matter.Body.nextGroup(true);
  if (!fB.group) fB.group = Matter.Body.nextGroup(true);
  if (!fA.connections) fA.connections = [];
  if (!fA.connections.includes(fB.group)) fA.connections.push(fB.group);
  // parent.collisionFilter.group = group;
  // child.collisionFilter.group = group;

  if (!_options.render) _options.render = { visible: false };

  _options.pointA = {
    x: child.position.x - parent.position.x,
    y: child.position.y - parent.position.y,
  };

  return scene.matter.add.constraint(
    parent,
    child,
    length,
    stiffness,
    _options,
  );
};
