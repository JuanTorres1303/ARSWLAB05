import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import blueprintsService from '../../services/blueprintsService.js'
import { toFriendlyErrorMessage } from '../../utils/errorMessages.js'

export const fetchAuthors = createAsyncThunk(
  'blueprints/fetchAuthors',
  async (_, { rejectWithValue }) => {
    try {
      const data = await blueprintsService.getAll()
      // Expecting API returns array of {author, name, points}
      const authors = [...new Set(data.map((bp) => bp.author))]
      return { authors, items: data }
    } catch (err) {
      return rejectWithValue(toFriendlyErrorMessage(err))
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

const initialState = {
  authors: [],
  all: [],
  byAuthor: {},
  current: null,
  status: { authors: 'idle', byAuthor: 'idle', current: 'idle' },
  error: { authors: null, byAuthor: null, current: null },
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
        s.status.authors = 'failed'
        s.error.authors = a.payload
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
  },
})

const selectAllBlueprints = (state) => state.blueprints.all

export const selectTopBlueprints = createSelector([selectAllBlueprints], (all) =>
  [...all].sort((a, b) => (b.points?.length || 0) - (a.points?.length || 0)).slice(0, 5),
)

export default slice.reducer
