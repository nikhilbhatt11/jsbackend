import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user._id;
  console.log(userId);

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all fields are required");
  }
  const videoPath = req.files?.videoFile[0].path;
  const thumbnailPath = req.files?.thumbnail[0]?.path;

  if (!videoPath) {
    throw new ApiError(400, "video file is required");
  }

  if (!thumbnailPath) {
    throw new ApiError(400, "thumbnail file is required");
  }

  const videoFile = await uploadOnCloudinary(videoPath);
  const thumbnail = await uploadOnCloudinary(thumbnailPath);

  if (!videoFile) {
    throw new ApiError(400, "video file by cloudinary is required!!!!");
  }

  if (!thumbnail) {
    throw new ApiError(400, "thumbnail file by cloudinary is required!!!!");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url || "",
    thumbnail: thumbnail.url || "",
    duration: videoFile.duration,
    owner: userId,
  });

  const videoWithOwner = await Video.aggregate([
    {
      $match: {
        _id: video._id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: "$ownerDetails",
    },
    {
      $project: {
        title: 1,
        description: 1,
        videoFile: 1,
        thumbnail: 1,
        duration: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: {
          username: "$ownerDetails.username",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, videoWithOwner, "Video Uploaded successully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "wroung video id passed in params");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "your video by id is this"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoPath = req.files?.videoFile[0].path;
  if (!videoPath) {
    throw new ApiError(400, "video file is required");
  }
  const videoFile = await uploadOnCloudinary(videoPath);
  if (!videoFile) {
    throw new ApiError(400, "video file by cloudinary is required!!!!");
  }

  const oldVideo = await Video.findById(videoId);
  console.log(oldVideo.videoFile.url);

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { videoFile: videoFile.url } },
    { new: true }
  );

  deleteFromCloudinary(oldVideo.videoFile.url);

  return res
    .status(200)
    .json(
      200,
      new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  try {
    const deletedVideo = await Video.findByIdAndDelete(videoId);
    if (!deletedVideo) {
      return res.status(404).json(new ApiResponse(404, {}, "Video not found"));
    }

    return res.status(200).json(200, {}, "Video deleted successfully");
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found");
  }

  video.isPublished = !video.isPublished;

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video publiash id updated"));
});

export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
