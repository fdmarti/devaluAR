/**
 * Datos de la fuente de datos mostrados en el sitio.
 *
 * Son constantes estáticas y no campos del dataset a propósito: el footer tiene
 * que poder mostrarse antes de que termine la petición al dataset, y también en
 * el estado de error.
 *
 * Viven en un módulo propio porque los usan dos vistas: la línea de créditos
 * del home y la licencia del footer.
 */
export const FUENTE = {
  origen: 'INDEC',
  origenUrl: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31',
  recolector: 'Hacé Cuentas',
  recolectorUrl: 'https://hacecuentas.com',
  datasetUrl:
    'https://hacecuentas.com/datasets/inflacion-argentina-historica-mensual.json',
  licencia: 'CC-BY-4.0',
  licenciaUrl: 'https://creativecommons.org/licenses/by/4.0/',
}
