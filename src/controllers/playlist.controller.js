import mongoose from "mongoose";
import { PlayList } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;
  if (!name || !description) {
    throw new ApiError(400, "Name and description is required");
  }

  const myPlaylist = await PlayList.create({
    name,
    description,
    video: [],
    owner: userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, myPlaylist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const dbUserId = new mongoose.Types.ObjectId(userId);

  const playlists = await PlayList.aggregate([
    {
      $match: {
        owner: dbUserId,
      },
    },
  ]);
  if (playlists.length == 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No playlist created"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "user all playlists send successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const playlist = await PlayList.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "Error in finding playlist by this id");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        playlist,
        "This is the playlist according to the id provided"
      )
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user.id;

  const addVideo = await PlayList.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "existingVideos",
      },
    },
    {
      $addFields: {
        videoExists: {
          $in: [new mongoose.Types.ObjectId(videoId), "$videos"],
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        owner: 1,
        videos: 1,
        videoExists: 1,
      },
    },
  ]);

  if (!addVideo) {
    throw new ApiError(404, "Playlist not found or unauthorized");
  }

  const playlist = addVideo[0];
  if (playlist.videoExists) {
    throw new ApiError(400, "Video already exists in the playlist");
  }

  const updatedPlaylist = await PlayList.updateOne(
    { _id: playlistId },
    {
      $push: { videos: videoId },
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        202,
        updatedPlaylist,
        "Video added to playlist successfully"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user.id;
  const videoObjectId = new mongoose.Types.ObjectId(videoId);

  const removeVideo = await PlayList.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        videos: 1,
      },
    },
  ]);

  if (!removeVideo.length) {
    throw new ApiError(404, "Playlist not found or unauthorized");
  }

  const playlist = removeVideo[0];

  if (!playlist.videos.some((video) => video.equals(videoObjectId))) {
    throw new ApiError(400, "Video not found in the playlist");
  }

  const videoremoved = await PlayList.updateOne(
    {
      _id: new mongoose.Types.ObjectId(playlistId),
    },
    {
      $pull: {
        videos: videoObjectId,
      },
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        videoremoved,
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  const deletePlaylist = await PlayList.findByIdAndDelete(playlistId);
  if (!deletePlaylist) {
    throw new ApiError(403, "Error in playlist deletion");
  }

  return res
    .status(200)
    .json(new ApiResponse(203, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(405, "name and description is required");
  }

  const updatePlaylistdetails = await PlayList.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name,
        description: description,
      },
    },
    { new: true }
  );

  if (!updatePlaylistdetails) {
    throw new ApiError(400, "unsucessfull playlist details update");
  }

  return res
    .status(200)
    .json(
      200,
      new ApiResponse(
        200,
        updatePlaylistdetails,
        "playlist details updated sucessfully"
      )
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
