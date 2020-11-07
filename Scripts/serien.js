/*
Author: Fredwuz (frederic23.mai@gmail.com)
serien.js (c) 2020
Desc: Netflix and Amazon Prime series update logic
Created:  10/24/2020
Modified: 10/27/2020
*/

var cron = require('node-cron')
const fs = require('fs')
const readline = require('readline')
const fetch = require('node-fetch')
let Parser = require('rss-parser')
const sizeOf = require('image-size')
const nrc = require('node-run-cmd')
const config = require('./config.json')

let parser = new Parser()
var serienarray = []
var neu = true
exports.serien = async function () {
  cron.schedule(
    '30 18 * * *',
    () => {
      console.log('running a task every Day at 19:30')
      sendSerien()
    },
    {
      timezone: 'Europe/Berlin',
    }
  )
}

async function sendSerien() {
  netflix = ''
  amazonprime = ''
  serienarray = []
  imgURLnetflix = []
  imgURLamazonprime = []
  const serien = fs.createReadStream('serien.txt')

  const rl = readline.createInterface({
    input: serien,
    output: process.stdout,
  })
  for await (const line of rl) {
    serienarray.push(line)
  }

  let feed = await parser.parseURL('https://www.vodspy.de/rss')
  for (let index = 0; index < feed.items.length; index++) {
    neu = true
    if (feed.items[index].categories[0] == 'Netflix') {
      for (let i = 0; i < serienarray.length; i++) {
        if (serienarray[i].includes(feed.items[index].title)) {
          neu = false
          i = i + 1000
        }
      }
      if (neu) {
        fs.appendFileSync('serien.txt', feed.items[index].title + '\n')
        show = feed.items[index].title
        show = show.substring(0, show.indexOf('['))
        netflix = netflix + show + '\n'
        imgURLnetflix.push(('' + feed.items[index].content.match(/<img[^>]+src="http([^">]+)/g)).substring(10))
      }
    }
    if (feed.items[index].categories[0] == 'Amazon Prime') {
      for (let i = 0; i < serienarray.length; i++) {
        if (serienarray[i].includes(feed.items[index].title)) {
          neu = false
          i = i + 1000
        }
      }
      if (neu) {
        fs.appendFileSync('serien.txt', feed.items[index].title + '\n')
        show = feed.items[index].title
        show = show.substring(0, show.indexOf('['))
        amazonprime = amazonprime + show + '\n'
        imgURLamazonprime.push(('' + feed.items[index].content.match(/<img[^>]+src="http([^">]+)/g)).substring(10))
      }
    }
  }
  netflixIMG = netflix.split('\n')
  netflixIMG.splice(-1, 1)

  amazonprimeIMG = amazonprime.split('\n')
  amazonprimeIMG.splice(-1, 1)

  for (let j = 0; j < config.DEserien_feed.length; j++) {
    if (netflix != '') {
      gclient.sendText(config.DEserien_feed[j], '*Neu auf Netflix*\n' + netflix)
    }
    if (amazonprime != '') {
      gclient.sendText(config.DEserien_feed[j], '*Neu auf Amazon Prime*\n' + amazonprime)
    }
  }
  for (let j = 0; j < config.DEserien_feedIMG.length; j++) {
    if (netflix != '') {
      for (let i = 0; i < netflixIMG.length; i++) {
        await Sleep(100)
        await gclient.sendImage(config.DEserien_feedIMG[j], imgURLnetflix[i], 'image.jpg', netflixIMG[i] + ' [Netflix]')
      }
    }
    if (amazonprime != '') {
      for (let i = 0; i < amazonprimeIMG.length; i++) {
        await Sleep(100)
        await gclient.sendImage(config.DEserien_feedIMG[j], imgURLamazonprime[i], 'image.jpg', amazonprimeIMG[i] + ' [Amazon Prime]')
      }
    }
  }
  /*   imgURLnetflix.forEach(async (element) => {
    filepath = 'Sticker/' + element.substring(element.lastIndexOf('/') + 1)
    const response = await fetch(element)
    const buffer = await response.buffer()
    fs.writeFile(filepath, buffer, () => console.log('finished downloading!'))
    await convertSticker(filepath)
  })

  imgURLamazonprime.forEach(async (element) => {
    filepath = 'Sticker/' + element.substring(element.lastIndexOf('/') + 1)
    const response = await fetch(element)
    const buffer = await response.buffer()
    fs.writeFile(filepath, buffer, () => console.log('finished downloading!'))
    await convertSticker(filepath)
  })

  for (let j = 0; j < config.DEserien_feedIMGSticker.length; j++) {
    if (netflix != '') {
      for (let i = 0; i < imgURLnetflix.length; i++) {
        filepath = 'Sticker/' + imgURLnetflix[i].substring(imgURLnetflix[i].lastIndexOf('/') + 1)
        console.log(imgURLnetflix[i])
        await gclient.sendImageAsSticker(config.DEserien_feedIMGSticker[j], filepath + '.png')
      }
    }
    if (amazonprime != '') {
      for (let i = 0; i < imgURLamazonprime.length; i++) {
        filepath = 'Sticker/' + imgURLamazonprime[i].substring(imgURLamazonprime[i].lastIndexOf('/') + 1)
        console.log(imgURLamazonprime[i])
        await gclient.sendImageAsSticker(config.DEserien_feedIMGSticker[j], filepath + '.png')
      }
    }
  } */
  delete require.cache[require.resolve('./config.json')]
}

function Sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function convertSticker(file) {
  await nrc.run('convert ' + file + ' ' + file + '.png')
  var dimensions = await sizeOf(file + '.png')
  console.log(dimensions.width + '  ' + dimensions.height)
  if (dimensions.width < dimensions.height) {
    await nrc.run('mogrify -bordercolor transparent -border ' + (dimensions.height - dimensions.width) / 2 + 'x0 ' + file + '.png')
  } else if (dimensions.width > dimensions.height) {
    await nrc.run('mogrify -bordercolor transparent -border 0x' + (dimensions.width - dimensions.height) / 2 + ' ' + file + '.png')
  } else {
  }
}
