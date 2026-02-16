// api.js - Wrapper fetch() para endpoints GAS
'use strict';

var API = {
  baseUrl: '',

  configurar: function(url) {
    this.baseUrl = url;
  },

  get: async function(action) {
    var res = await fetch(this.baseUrl + '?action=' + action);
    var data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return data;
  },

  post: async function(action, body) {
    var res = await fetch(this.baseUrl + '?action=' + action, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    var data = await res.json();
    if (!data.ok) throw new Error(data.error);
    return data;
  }
};

if (typeof module !== 'undefined') module.exports = { API };
