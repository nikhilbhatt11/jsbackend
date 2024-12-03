import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  const userId = req.user.id;

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });
  console.log(existingLike);
  if (!existingLike) {
    const newLike = new Like({
      video: videoId,
      likedBy: userId,
    });

    const videoLike = await newLike.save();
    return res
      .status(201)
      .json(new ApiResponse(200, videoLike, "video liked successfully"));
  } else {
    await Like.deleteOne({ _id: existingLike._id });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video unliked successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const userId = req.user.id;

  const existingCommentLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (!existingCommentLike) {
    const newCommentLike = await new Like({
      comment: commentId,
      likedBy: userId,
    });

    const commentLike = await newCommentLike.save();

    return res
      .status(200)
      .json(new ApiResponse(200, commentLike, "Comment liked successfully"));
  } else {
    await Like.deleteOne({ _id: existingCommentLike._id });
    return res
      .status(200)
      .json(new ApiResponse(201, {}, "comment unliked successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const userId = req.user.id;

  const existingTweetLike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });

  if (!existingTweetLike) {
    const newTweetLike = await new Like({
      tweet: tweetId,
      likedBy: userId,
    });

    const tweetLike = await newTweetLike.save();

    return res
      .status(200)
      .json(new ApiResponse(200, tweetLike, "tweet liked successfully"));
  } else {
    await Like.deleteOne({ _id: existingTweetLike._id });
    return res
      .status(200)
      .json(new ApiResponse(201, {}, "tweet unliked successfully"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userid = req.user.id;
  const userId = new mongoose.Types.ObjectId(userid);

  const allLikedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: userId,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $unwind: "$videoDetails",
    },
    {
      $replaceRoot: { newRoot: "$videoDetails" }, // Replace each document with its videoDetails
    },
  ]);

  if (allLikedVideos.length == 0) {
    res.status(200).json(new ApiResponse(200, {}, "no liked videos"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, allLikedVideos, "Your allliked videos"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
