const profile = require('../profile')

profile.generateProfiles({ machineConfig: 'ender3.json' })

// profile.generateProfiles({
//   machineConfig: 'ender3.json',
//   additionalConfigPaths: [ 'infill/no-infill' ],
//   nameSuffix: '-no-infill'
// })

