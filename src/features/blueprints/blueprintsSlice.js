import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import blueprintsService from '../../services/blueprintsService.js'
import { toFriendlyErrorMessage } from '../../utils/errorMessages.js'

export const fetchAuthors = createAsyncThunk(
  'blueprints/fetchAuthors',
  async (_, { rejectWithValue }) => {
    try {
      const data = await blueprintsService.getAll()
      const authors = [...new Set(data.map((bp) => bp.author))]
      return { authors, items: data }
    } catch (err) {
      if (err.unsupported) {
        return rejectWithValue({ unsupported: true })
      }
      return rejectWithValue({ message: toFriendlyErrorMessage(err) })
    }
  },
)

export const fetchByAuthor = createAsyncThunk(
  'blueprints/fetchByAuthor',
  async (author, { rejectWithValue }) => {
    try {
      const items = await blueprintsService.getByAuthor(author)
      return { author, items }
    } catch (err) {
      return rejectWithValue(toFriendlyErrorMessage(err))
    }
  },
)

export const fetchBlueprint = createAsyncThunk(
  'blueprints/fetchBlueprint',
  async ({ author, name }, { rejectWithValue }) => {
    try {
      return await blueprintsService.getByAuthorAndName(author, name)
    } catch (err) {
      return rejectWithValue(toFriendlyErrorMessage(err))
    }
  },
)

export const createBlueprint = createAsyncThunk(
  'blueprints/createBlueprint',
  async (payload, { rejectWithValue }) => {
    try {
      return await blueprintsService.create(payload)
    } catch (err) {
      return rejectWithValue(toFriendlyErrorMessage(err))
    }
  },
)

export const updateBlueprint = createAsyncThunk(
  'blueprints/updateBlueprint',
  async ({ author, name, newName, points }, { rejectWithValue }) => {
    try {
      const targetName = newName && newName.trim() && newName !== name ? newName.trim() : name
      const updated = await blueprintsService.update(author, name, {
        author,
        name: targetName,
        points,
      })
      return {
        author,
        name,
        newName: targetName !== name ? (updated?.name ?? targetName) : undefined,
        points: updated?.points ?? points,
      }
    } catch (err) {
      return rejectWithValue(toFriendlyErrorMessage(err))
    }
  },
)

export const deleteBlueprint = createAsyncThunk(
  'blueprints/deleteBlueprint',
  async ({ author, name }, { rejectWithValue }) => {
    try {
      await blueprintsService.remove(author, name)
      return { author, name }
    } catch (err) {
      return rejectWithValue(toFriendlyErrorMessage(err))
    }
  },
)

const initialState = {
  authors: [],
  all: [],
  byAuthor: {},
  current: null,
  status: { authors: 'idle', byAuthor: 'idle', current: 'idle', update: 'idle', delete: 'idle' },
  error: { authors: null, byAuthor: null, current: null, update: null, delete: null },
  snapshots: {},
}

function snapshotKey(author, name) {
  return `${author}::${name}`
}

function isSameBlueprint(bp, author, name) {
  return !!bp && bp.author === author && bp.name === name
}

function withUpdatedPoints(list, author, name, points) {
  if (!list) return list
  return list.map((bp) => (isSameBlueprint(bp, author, name) ? { ...bp, points } : bp))
}

function withUpdatedItem(list, author, name, changes) {
  if (!list) return list
  return list.map((bp) => (isSameBlueprint(bp, author, name) ? { ...bp, ...changes } : bp))
}

function withoutBlueprint(list, author, name) {
  if (!list) return list
  return list.filter((bp) => !isSameBlueprint(bp, author, name))
}

function findBlueprint(list, author, name) {
  return list ? list.find((bp) => isSameBlueprint(bp, author, name)) : undefined
}

const slice = createSlice({
  name: 'blueprints',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthors.pending, (s) => {
        s.status.authors = 'loading'
        s.error.authors = null
      })
      .addCase(fetchAuthors.fulfilled, (s, a) => {
        s.status.authors = 'succeeded'
        s.authors = a.payload.authors
        s.all = a.payload.items
      })
      .addCase(fetchAuthors.rejected, (s, a) => {
        if (a.payload?.unsupported) {
          s.status.authors = 'unsupported'
          s.error.authors = null
        } else {
          s.status.authors = 'failed'
          s.error.authors = a.payload?.message
        }
      })
      .addCase(fetchByAuthor.pending, (s) => {
        s.status.byAuthor = 'loading'
        s.error.byAuthor = null
      })
      .addCase(fetchByAuthor.fulfilled, (s, a) => {
        s.status.byAuthor = 'succeeded'
        s.byAuthor[a.payload.author] = a.payload.items
      })
      .addCase(fetchByAuthor.rejected, (s, a) => {
        s.status.byAuthor = 'failed'
        s.error.byAuthor = a.payload
      })
      .addCase(fetchBlueprint.pending, (s) => {
        s.status.current = 'loading'
        s.error.current = null
      })
      .addCase(fetchBlueprint.fulfilled, (s, a) => {
        s.status.current = 'succeeded'
        s.current = a.payload
      })
      .addCase(fetchBlueprint.rejected, (s, a) => {
        s.status.current = 'failed'
        s.error.current = a.payload
      })
      .addCase(createBlueprint.fulfilled, (s, a) => {
        const bp = a.payload
        if (s.byAuthor[bp.author]) s.byAuthor[bp.author].push(bp)
      })
      .addCase(updateBlueprint.pending, (s, a) => {
        const { author, name, points } = a.meta.arg
        const key = snapshotKey(author, name)
        s.snapshots[key] = {
          current: isSameBlueprint(s.current, author, name) ? s.current : null,
          byAuthorItem: findBlueprint(s.byAuthor[author], author, name) || null,
          allItem: findBlueprint(s.all, author, name) || null,
        }
        if (isSameBlueprint(s.current, author, name)) {
          s.current = { ...s.current, points }
        }
        s.byAuthor[author] = withUpdatedPoints(s.byAuthor[author], author, name, points)
        s.all = withUpdatedPoints(s.all, author, name, points)
        s.status.update = 'loading'
        s.error.update = null
      })
      .addCase(updateBlueprint.fulfilled, (s, a) => {
        const { author, name, newName, points } = a.payload
        const changes = newName ? { points, name: newName } : { points }
        if (isSameBlueprint(s.current, author, name)) {
          s.current = { ...s.current, ...changes }
        }
        s.byAuthor[author] = withUpdatedItem(s.byAuthor[author], author, name, changes)
        s.all = withUpdatedItem(s.all, author, name, changes)
        s.status.update = 'succeeded'
        delete s.snapshots[snapshotKey(author, name)]
      })
      .addCase(updateBlueprint.rejected, (s, a) => {
        const { author, name } = a.meta.arg
        const key = snapshotKey(author, name)
        const snap = s.snapshots[key]
        if (snap) {
          if (snap.current) s.current = snap.current
          if (snap.byAuthorItem && s.byAuthor[author]) {
            s.byAuthor[author] = s.byAuthor[author].map((bp) =>
              isSameBlueprint(bp, author, name) ? snap.byAuthorItem : bp,
            )
          }
          if (snap.allItem) {
            s.all = s.all.map((bp) => (isSameBlueprint(bp, author, name) ? snap.allItem : bp))
          }
          delete s.snapshots[key]
        }
        s.status.update = 'failed'
        s.error.update = a.payload
      })
      .addCase(deleteBlueprint.pending, (s, a) => {
        const { author, name } = a.meta.arg
        const key = snapshotKey(author, name)
        s.snapshots[key] = {
          current: isSameBlueprint(s.current, author, name) ? s.current : null,
          byAuthorItem: findBlueprint(s.byAuthor[author], author, name) || null,
          allItem: findBlueprint(s.all, author, name) || null,
        }
        if (isSameBlueprint(s.current, author, name)) {
          s.current = null
        }
        s.byAuthor[author] = withoutBlueprint(s.byAuthor[author], author, name)
        s.all = withoutBlueprint(s.all, author, name)
        s.status.delete = 'loading'
        s.error.delete = null
      })
      .addCase(deleteBlueprint.fulfilled, (s, a) => {
        const { author, name } = a.payload
        s.status.delete = 'succeeded'
        delete s.snapshots[snapshotKey(author, name)]
      })
      .addCase(deleteBlueprint.rejected, (s, a) => {
        const { author, name } = a.meta.arg
        const key = snapshotKey(author, name)
        const snap = s.snapshots[key]
        if (snap) {
          if (snap.current) s.current = snap.current
          if (snap.byAuthorItem) {
            s.byAuthor[author] = [...(s.byAuthor[author] || []), snap.byAuthorItem]
          }
          if (snap.allItem) {
            s.all = [...s.all, snap.allItem]
          }
          delete s.snapshots[key]
        }
        s.status.delete = 'failed'
        s.error.delete = a.payload
      })
  },
})

const selectAllBlueprints = (state) => state.blueprints.all

export const selectTopBlueprints = createSelector([selectAllBlueprints], (all) =>
  [...all].sort((a, b) => (b.points?.length || 0) - (a.points?.length || 0)).slice(0, 5),
)

export default slice.reducer
