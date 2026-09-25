let blueprints = [
  {
    author: 'jdoe',
    name: 'house',
    points: [
      { x: 100, y: 300 },
      { x: 100, y: 180 },
      { x: 200, y: 100 },
      { x: 300, y: 180 },
      { x: 300, y: 300 },
      { x: 100, y: 300 },
    ],
  },
  {
    author: 'jdoe',
    name: 'garage',
    points: [
      { x: 350, y: 280 },
      { x: 470, y: 280 },
      { x: 470, y: 180 },
      { x: 350, y: 180 },
      { x: 350, y: 280 },
    ],
  },
  {
    author: 'jdoe',
    name: 'triangle',
    points: [
      { x: 60, y: 340 },
      { x: 160, y: 340 },
      { x: 110, y: 220 },
      { x: 60, y: 340 },
    ],
  },
  {
    author: 'msmith',
    name: 'tower',
    points: [
      { x: 240, y: 340 },
      { x: 240, y: 120 },
      { x: 280, y: 60 },
      { x: 320, y: 120 },
      { x: 320, y: 340 },
      { x: 240, y: 340 },
    ],
  },
  {
    author: 'msmith',
    name: 'zigzag',
    points: [
      { x: 40, y: 60 },
      { x: 120, y: 180 },
      { x: 200, y: 60 },
      { x: 280, y: 180 },
      { x: 360, y: 60 },
      { x: 440, y: 180 },
    ],
  },
  {
    author: 'msmith',
    name: 'diamond',
    points: [
      { x: 260, y: 40 },
      { x: 400, y: 180 },
      { x: 260, y: 320 },
      { x: 120, y: 180 },
      { x: 260, y: 40 },
    ],
  },
]

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

async function getAll() {
  return clone(blueprints)
}

async function getByAuthor(author) {
  return clone(blueprints.filter((bp) => bp.author === author))
}

async function getByAuthorAndName(author, name) {
  const found = blueprints.find((bp) => bp.author === author && bp.name === name)
  if (!found) {
    const error = new Error('Blueprint not found')
    error.response = { status: 404 }
    throw error
  }
  return clone(found)
}

async function create(payload) {
  const exists = blueprints.some((bp) => bp.author === payload.author && bp.name === payload.name)
  if (exists) {
    const error = new Error('Blueprint already exists')
    error.response = { status: 409 }
    throw error
  }
  const blueprint = { author: payload.author, name: payload.name, points: payload.points || [] }
  blueprints = [...blueprints, blueprint]
  return clone(blueprint)
}

async function update(author, name, payload) {
  const idx = blueprints.findIndex((bp) => bp.author === author && bp.name === name)
  if (idx === -1) {
    const error = new Error('Blueprint not found')
    error.response = { status: 404 }
    throw error
  }
  const updated = { author, name, points: payload.points || [] }
  blueprints = blueprints.map((bp, i) => (i === idx ? updated : bp))
  return clone(updated)
}

async function remove(author, name) {
  const exists = blueprints.some((bp) => bp.author === author && bp.name === name)
  if (!exists) {
    const error = new Error('Blueprint not found')
    error.response = { status: 404 }
    throw error
  }
  blueprints = blueprints.filter((bp) => !(bp.author === author && bp.name === name))
  return { author, name }
}

export default { getAll, getByAuthor, getByAuthorAndName, create, update, remove }
