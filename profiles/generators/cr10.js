const profile = require('../profile')

profile.generateProfiles({ machineConfig: 'cr10.json' })

// profile.generateProfiles({
//   machineConfig: 'cr10.json',
//   additionalConfigPaths: [ 'infill/no-infill' ],
//   nameSuffix: '-no-infill'
// })