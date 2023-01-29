// TODO: audit usage of: TEMP_RECT, Phaser.Polygon.GetAABB, bounds ||= ..., getBounds(), etc.
// We want to create as little Rectangle objects as possible without risking using TEMP_RECT twice at the same time
export const TEMP_RECT = new Phaser.Geom.Rectangle();
export const TEMP_RECT2 = new Phaser.Geom.Rectangle();
