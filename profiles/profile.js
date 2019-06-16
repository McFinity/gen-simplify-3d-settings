const path = require('path')
const merge = require('merge-deep')
const fs = require('fs')
const convert = require('xml-js')

const extruders = [
  'extruder/nozzle-2.json',
  'extruder/nozzle-4.json',
  'extruder/nozzle-6.json',
  'extruder/nozzle-8.json'
]

const qualities = [
  'quality/draft-quality.json',
  'quality/ok-quality.json',
  'quality/good-quality.json',
  'quality/fine-quality.json'
]

const createProfileName = (name) => ({
  profile: {
    _attributes: {
      name
    }
}})

const createProfileManifest = ({ machineConfig }) => {
  const extruderQualities = []
  extruders.forEach(extruder => {
    qualities.forEach(quality => {
      extruderQualities.push([`machine/${machineConfig}`, extruder, quality])
    })
  })

  const manifest = extruderQualities.map(configPaths => {
    return {
      profileName: configPaths.join('/').replace(new RegExp('machine/', 'g'), '').replace(new RegExp('/extruder/', 'g'), '-').replace(new RegExp('/quality/', 'g'), '-').replace(new RegExp('.json', 'g'), ''),
      configPaths
    }
  })
  
  return manifest
}

const getDefaultProfile = () => {
  const defaultExtruder = require(path.resolve(__dirname, '../configs/extruder/default-extruder.json'))
  const defaultQuality = require(path.resolve(__dirname, '../configs/quality/default-quality.json'))
  const defaultInfill = require(path.resolve(__dirname, '../configs/infill/default-infill.json'))
  const defaultRaft = require(path.resolve(__dirname, '../configs/raft/default-raft.json'))
  const defaultSupports = require(path.resolve(__dirname, '../configs/supports/default-supports.json'))

  const baseConfigXml = fs.readFileSync(path.resolve(__dirname, '../configs/base-config.xml'), 'utf8')
  const baseConfig = convert.xml2js(baseConfigXml, { compact: true, ignoreComment: true, spaces: 4 })

  return merge(baseConfig, defaultExtruder, defaultQuality, defaultInfill, defaultRaft, defaultSupports)
}

const outputProfileToXmlFile = (path, profile) => {
  const finalProfileXml = convert.js2xml(profile, { compact: true, ignoreComment: true, spaces: 4 })
  fs.writeFileSync(path, finalProfileXml)
}

const generateProfile = ({ name, configPaths }) => {
  const finalProfileJs = merge(
    getDefaultProfile(),
    createProfileName(name),
    ...configPaths.map(configPath => require(path.resolve('./configs/', configPath)))
  )

  outputProfileToXmlFile(path.resolve('./output', `${name}.xml`), finalProfileJs)
}

const generateProfiles = ({ machineConfig, additionalConfigPaths = [], nameSuffix = '' }) => {
  const profileManifest = createProfileManifest({ machineConfig })
  profileManifest.forEach(profileToCreate => {
    generateProfile({
      name: profileToCreate.profileName + nameSuffix,
      configPaths: [ ...profileToCreate.configPaths, ...additionalConfigPaths ]
    })
  })
}

module.exports = {
  createProfileManifest,
  generateProfile,
  generateProfiles
}