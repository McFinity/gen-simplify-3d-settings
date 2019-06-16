const path = require('path')
const merge = require('merge-deep')
const fs = require('fs')
const convert = require('xml-js')
const glob = require('glob')

const extruders = glob.sync("configs/extruder/nozzle*.json", {}).map(path => path.replace('configs/', ''))
const qualities = glob.sync("configs/quality/quality*.json", {}).map(path => path.replace('configs/', ''))
const materials = glob.sync("configs/quality/*.json", {}).map(path => path.replace('configs/', ''))

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
      materials.forEach(material => {
        extruderQualities.push([`machine/${machineConfig}`, extruder, quality, material])
      }) 
    })
  })

  const manifest = extruderQualities.map(configPaths => {
    return {
      profileName: configPaths.join('/').replace(new RegExp('machine/', 'g'), '').replace(new RegExp('/extruder/', 'g'), '-').replace(new RegExp('/quality/', 'g'), '-').replace(new RegExp('/material/', 'g'), '-').replace(new RegExp('.json', 'g'), ''),
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
  const defaultTemp = require(path.resolve(__dirname, '../configs/temp/default-temp.json'))

  const baseConfigXml = fs.readFileSync(path.resolve(__dirname, '../configs/base-config.xml'), 'utf8')
  const baseConfig = convert.xml2js(baseConfigXml, { compact: true, ignoreComment: true, spaces: 4 })

  return merge(baseConfig, defaultExtruder, defaultQuality, defaultInfill, defaultRaft, defaultSupports, defaultTemp)
}

const outputProfileToXmlFile = (path, profile) => {
  const finalProfileXml = convert.js2xml(profile, { compact: true, ignoreComment: true, spaces: 4 })
  fs.writeFileSync(path, finalProfileXml)
}

const generateProfile = ({ name, configPaths }) => {
  const finalProfileJs = merge(
    getDefaultProfile(),
    createProfileName(name),
    ...configPaths.map(configPath => require(path.resolve('./configs', configPath)))
  )

 
  const primaryExtruderTemps = finalProfileJs.profile.temperatureController.filter(temperatureController => temperatureController._attributes.name === 'Primary Extruder')
  const primaryExtruderTemp = primaryExtruderTemps.reduce((reducedTemp, primaryExtruderTemp) => ({ ...reducedTemp, ...primaryExtruderTemp }), {})
  const heatedBedTemps = finalProfileJs.profile.temperatureController.filter(temperatureController => temperatureController._attributes.name === 'Heated Bed')
  const heatedBedTemp = heatedBedTemps.reduce((reducedTemp, heatedBedTemp) => ({ ...reducedTemp, ...heatedBedTemp }), {})

  finalProfileJs.profile.temperatureController = [ primaryExtruderTemp, heatedBedTemp ]

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