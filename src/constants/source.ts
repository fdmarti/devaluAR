/**
 * Data source details shown on the site.
 *
 * They are static constants and not dataset fields on purpose: the footer has
 * to be able to render before the dataset request finishes, and also in the
 * error state.
 *
 * They live in their own module because two views use them: the credits line
 * on the home and the license in the footer.
 */
export const SOURCE = {
  origin: 'INDEC',
  originUrl: 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31',
  collector: 'Hacé Cuentas',
  collectorUrl: 'https://hacecuentas.com',
  datasetUrl:
    'https://hacecuentas.com/datasets/inflacion-argentina-historica-mensual.json',
  license: 'CC-BY-4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
}
