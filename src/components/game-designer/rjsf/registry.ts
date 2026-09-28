import TextInputWidget from './widgets/TextInputWidget';
import NumberInputWidget from './widgets/NumberInputWidget';
import ColorPickerWidget from './widgets/ColorPickerWidget';
import CheckboxWidget from './widgets/CheckboxWidget';
import RadioWidget from './widgets/RadioWidget';
import RangeWidget from './widgets/RangeWidget';
import DecimalInputWidget from './widgets/DecimalInputWidget';
import ImagePreviewWidget from './widgets/ImagePreviewWidget';
import FieldTemplate from './templates/FieldTemplate';
import ObjectFieldTemplate from './templates/ObjectFieldTemplate';
import ArrayFieldTemplate from './templates/ArrayFieldTemplate';
import ErrorListTemplate from './templates/ErrorListTemplate';

/**
 * Los widgets del formulario del anunciante.
 *
 * Sin `assetUpload` a propósito: ahí solo se pide texto. Las imágenes del juego las
 * publica el diseñador después de auditarlas; el anunciante sube archivos como
 * recursos corporativos, que son privados y temporales.
 *
 * El formulario del diseñador arma su propio mapa —con `assetUpload`— en ConfigTab.
 */
export const BRIEF_WIDGETS = {
  textInput: TextInputWidget,
  numberInput: NumberInputWidget,
  colorPicker: ColorPickerWidget,
  imagePreview: ImagePreviewWidget,
  checkbox: CheckboxWidget,
  radio: RadioWidget,
  range: RangeWidget,
  decimalInput: DecimalInputWidget,
  switch: CheckboxWidget,
  slider: RangeWidget,
  color: ColorPickerWidget,
};

export const RJSF_TEMPLATES = {
  FieldTemplate,
  ObjectFieldTemplate,
  ArrayFieldTemplate,
  ErrorListTemplate,
};
