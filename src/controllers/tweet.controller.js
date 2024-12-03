import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user._id;

  if (content == "") {
    throw new ApiError(400, "content is required");
  }

  const tweet = await Tweet.create({
    content,
    owner: userId,
  });

  const tweetWithOwner = await Tweet.aggregate([
    {
      $match: {
        _id: tweet._id,
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
        content: 1,
        owner: "$ownerDetails.username",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, tweetWithOwner, "tweet sended successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const dbUserId = new mongoose.Types.ObjectId(userId);

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: dbUserId,
      },
    },
  ]);
  if (tweets.length == 0) {
    return res.status(200).json(new ApiResponse(200, {}, "No tweet created"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "user all tweets send successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (content == "") {
    throw new ApiError(400, "content is required");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { content: content } },
    { new: true }
  );
  if (!updatedTweet) {
    throw new ApiError(400, "unsucessfull tweet update");
  }

  return res
    .status(200)
    .json(200, new ApiResponse(200, updatedTweet, "Tweet updated sucessfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  if (!deletedTweet) {
    throw new ApiError(400, "error in deleting the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
