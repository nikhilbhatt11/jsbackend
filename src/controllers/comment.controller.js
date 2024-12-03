import mongoose, { isValidObjectId, Mongoose } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Comment } from "../models/comment.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const comments = await Comment.aggregate([
    {
      $match: {
        video: new new mongoose.Types.ObjectId(videoId)(),
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (pageNumber - 1) * limitNumber,
    },
    {
      $limit: limitNumber,
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
      _id: 1,
      content: 1,
      createdAt: 1,
      "ownerDetails.username": 1,
      "ownerDetails.avatar": 1,
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        page: pageNumber,
        limit: limitNumber,
        totalComments: comments.length,
        comments,
      },
      "Comments retrieved successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const userid = req.user.id;

  if (content == "") {
    throw new ApiError(400, "content is required");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userid,
  });

  const commentWithOwner = await Comment.aggregate([
    {
      $match: {
        _id: comment._id,
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
    .json(
      new ApiResponse(200, commentWithOwner, "comment posted successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const { commentId } = req.params;

  if (content == "") {
    throw new ApiError(400, "content is required");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { content: content } },
    { new: true }
  );

  console.log(updatedComment);

  if (!updatedComment) {
    throw new ApiError(400, "unsucessfull comment update");
  }

  return res
    .status(200)
    .json(
      200,
      new ApiResponse(200, updatedComment, "Comment updated sucessfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(400, "error in deleting the comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
