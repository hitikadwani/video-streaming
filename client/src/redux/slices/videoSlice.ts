import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { videosApi, tagsApi } from '../../services/api';
import { Video, Tag } from '../../types/video';

export const fetchVideos = createAsyncThunk(
  'videos/fetchVideos',
  async (params?: { limit?: number; offset?: number }) => {
    const res = await videosApi.getAll(params);
    return res.data;
  }
);

export const fetchSearch = createAsyncThunk(
  'videos/fetchSearch',
  async (params?: { q?: string; tagIds?: number[]; limit?: number; offset?: number }) => {
    const res = await videosApi.search({
      q: params?.q,
      tags: params?.tagIds,
      limit: params?.limit ?? 24,
      offset: params?.offset,
    });
    return res.data;
  }
);

export const fetchTags = createAsyncThunk(
  'videos/fetchTags',
  async () => {
    const res = await tagsApi.getAll();
    return res.data.tags;
  }
);

export const fetchVideoById = createAsyncThunk(
  'videos/fetchVideoById',
  async (id: number) => {
    const res = await videosApi.getById(id);
    return res.data.video;
  }
);

interface VideoState {
  videos: Video[];
  count: number;
  loading: boolean;
  error: string | null;
  tags: Tag[];
  tagsLoading: boolean;
  currentVideo: Video | null;
  currentVideoLoading: boolean;
  currentVideoError: string | null;
}

const initialState: VideoState = {
  videos: [],
  count: 0,
  loading: false,
  error: null,
  tags: [],
  tagsLoading: false,
  currentVideo: null,
  currentVideoLoading: false,
  currentVideoError: null,
};

const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    clearVideoError: (state) => {
      state.error = null;
    },
    clearCurrentVideo: (state) => {
      state.currentVideo = null;
      state.currentVideoError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = action.payload.videos;
        state.count = action.payload.count;
        state.error = null;
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.error.message as string) || 'Failed to load videos';
      })
      .addCase(fetchSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = action.payload.videos;
        state.count = action.payload.count;
        state.error = null;
      })
      .addCase(fetchSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.error.message as string) || 'Search failed';
      })
      .addCase(fetchTags.pending, (state) => {
        state.tagsLoading = true;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.tags = action.payload;
        state.tagsLoading = false;
      })
      .addCase(fetchTags.rejected, (state) => {
        state.tagsLoading = false;
      })
      .addCase(fetchVideoById.pending, (state) => {
        state.currentVideoLoading = true;
        state.currentVideoError = null;
        state.currentVideo = null;
      })
      .addCase(fetchVideoById.fulfilled, (state, action) => {
        state.currentVideoLoading = false;
        state.currentVideo = action.payload;
        state.currentVideoError = null;
      })
      .addCase(fetchVideoById.rejected, (state, action) => {
        state.currentVideoLoading = false;
        state.currentVideo = null;
        state.currentVideoError = (action.error.message as string) || 'Failed to load video';
      });
  },
});

export const { clearVideoError, clearCurrentVideo } = videoSlice.actions;
export default videoSlice.reducer;
