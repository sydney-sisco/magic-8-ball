const preferences = {
  'default': {
    units: 'metric',
  },
  'NiceGentleman#0194': {
    units: 'metric',
  },
  'bin1248163264128#8507': {
    units: 'nonmetric',
  },
  'Sunny#2911': {
    units: 'metric',
  },
  'Skyhammer#6076': {
    units: 'nonmetric',
  },
};

const getPreference = function(user) {
  console.log('getting prefs for:', user);

  return preferences[user] ? preferences[user] : preferences['default'];
}

module.exports = {
  getPreference
};
