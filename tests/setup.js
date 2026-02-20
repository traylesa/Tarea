/**
 * Jest setup: expone date-utils.js como globales,
 * simulando el comportamiento del navegador con <script> tags.
 */
const dateUtils = require('../src/extension/date-utils.js');
Object.assign(global, dateUtils);
