import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import type { ViewportPreset } from '../types';
import type { VolumeActor } from '../types/IActor';

/**
 * Applies a preset to a volume actor.
 *
 * @param actor - The volume actor to apply the preset to.
 * @param preset - The preset to apply.
 */
export default function applyPreset(
  actor: VolumeActor,
  preset: ViewportPreset
) {
  // Create color transfer function
  const colorTransferArray = preset.colorTransfer
    .split(' ')
    .splice(1)
    .map(parseFloat);

  const { shiftRange } = getShiftRange(colorTransferArray);
  const min = shiftRange[0];
  const width = shiftRange[1] - shiftRange[0];
  const cfun = vtkColorTransferFunction.newInstance();
  const normColorTransferValuePoints = [];
  for (let i = 0; i < colorTransferArray.length; i += 4) {
    let value = colorTransferArray[i];
    const r = colorTransferArray[i + 1];
    const g = colorTransferArray[i + 2];
    const b = colorTransferArray[i + 3];

    value = (value - min) / width;
    normColorTransferValuePoints.push([value, r, g, b]);
  }

  applyPointsToRGBFunction(normColorTransferValuePoints, shiftRange, cfun);

  actor.getProperty().setRGBTransferFunction(0, cfun);

  // Create scalar opacity function
  const scalarOpacityArray = preset.scalarOpacity
    .split(' ')
    .splice(1)
    .map(parseFloat);

  const ofun = vtkPiecewiseFunction.newInstance();
  const normPoints = [];
  for (let i = 0; i < scalarOpacityArray.length; i += 2) {
    let value = scalarOpacityArray[i];
    const opacity = scalarOpacityArray[i + 1];

    value = (value - min) / width;

    normPoints.push([value, opacity]);
  }

  applyPointsToPiecewiseFunction(normPoints, shiftRange, ofun);

  const property = actor.getProperty();

  property.setScalarOpacity(0, ofun);
  const [
    gradientMinValue,
    gradientMinOpacity,
    gradientMaxValue,
    gradientMaxOpacity,
  ] = preset.gradientOpacity.split(' ').splice(1).map(parseFloat);

  property.setUseGradientOpacity(0, true);
  property.setGradientOpacityMinimumValue(0, gradientMinValue);
  property.setGradientOpacityMinimumOpacity(0, gradientMinOpacity);
  property.setGradientOpacityMaximumValue(0, gradientMaxValue);
  property.setGradientOpacityMaximumOpacity(0, gradientMaxOpacity);

  if (preset.interpolation === '1') {
    property.setInterpolationTypeToFastLinear();
    //property.setInterpolationTypeToLinear()
  }

  property.setShade(preset.shade === '1');

  const ambient = parseFloat(preset.ambient);
  const diffuse = parseFloat(preset.diffuse);
  const specular = parseFloat(preset.specular);
  const specularPower = parseFloat(preset.specularPower);

  property.setAmbient(ambient);
  property.setDiffuse(diffuse);
  property.setSpecular(specular);
  property.setSpecularPower(specularPower);
}

function getShiftRange(colorTransferArray) {
  // Credit to paraview-glance
  // https://github.com/Kitware/paraview-glance/blob/3fec8eeff31e9c19ad5b6bff8e7159bd745e2ba9/src/components/controls/ColorBy/script.js#L133

  // shift range is original rgb/opacity range centered around 0
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < colorTransferArray.length; i += 4) {
    min = Math.min(min, colorTransferArray[i]);
    max = Math.max(max, colorTransferArray[i]);
  }

  const center = (max - min) / 2;

  return {
    shiftRange: [-center, center],
    min,
    max,
  };
}

function applyPointsToRGBFunction(points, range, cfun) {
  const width = range[1] - range[0];
  const rescaled = points.map(([x, r, g, b]) => [
    x * width + range[0],
    r,
    g,
    b,
  ]);

  cfun.removeAllPoints();
  rescaled.forEach(([x, r, g, b]) => cfun.addRGBPoint(x, r, g, b));

  return rescaled;
}

function applyPointsToPiecewiseFunction(points, range, pwf) {
  const width = range[1] - range[0];
  const rescaled = points.map(([x, y]) => [x * width + range[0], y]);

  pwf.removeAllPoints();
  rescaled.forEach(([x, y]) => pwf.addPoint(x, y));

  return rescaled;
}
